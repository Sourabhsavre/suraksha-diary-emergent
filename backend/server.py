from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Header, Query, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import csv
import json
import base64
import logging
import asyncio
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

import httpx
from pywebpush import webpush, WebPushException
from emergentintegrations.llm.openai import OpenAISpeechToText

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# --- Emergent LLM (Whisper) ---
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY) if EMERGENT_LLM_KEY else None

# --- Web Push VAPID ---
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_SUBJECT = os.environ.get('VAPID_SUBJECT', 'mailto:[email protected]')

# --- Register Hindi font for PDFs (Noto Sans Devanagari fallback) ---
try:
    # Try common system paths, fall back to using default which may not render Hindi properly
    for fp in [
        '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf',
        '/usr/share/fonts/opentype/noto/NotoSansDevanagari-Regular.ttf',
    ]:
        if os.path.exists(fp):
            pdfmetrics.registerFont(TTFont('NotoDev', fp))
            HINDI_FONT = 'NotoDev'
            break
    else:
        HINDI_FONT = 'Helvetica'
except Exception:
    HINDI_FONT = 'Helvetica'

app = FastAPI()

# Force UTF-8 charset on JSON and HTML responses (defense-in-depth against mojibake).
@app.middleware("http")
async def utf8_charset(request, call_next):
    response = await call_next(request)
    ct = response.headers.get("content-type", "")
    if ct.startswith("application/json") and "charset" not in ct:
        response.headers["content-type"] = "application/json; charset=utf-8"
    elif ct.startswith("text/") and "charset" not in ct:
        response.headers["content-type"] = f"{ct}; charset=utf-8"
    return response

api_router = APIRouter(prefix="/api")

# ============ Models ============

class IncidentCreate(BaseModel):
    reporter_name: str
    location_label: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    text: Optional[str] = None
    is_urgent: bool = False
    photo_base64: Optional[str] = None  # data URL or raw base64
    audio_base64: Optional[str] = None  # base64 encoded audio
    audio_mime: Optional[str] = None    # e.g. audio/webm

class Incident(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter_name: str
    location_label: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    text: Optional[str] = None
    transcript: Optional[str] = None
    is_urgent: bool = False
    photo_url: Optional[str] = None  # data URL stored inline (compressed by client)
    audio_url: Optional[str] = None  # data URL stored inline
    status: Literal['new', 'in_progress', 'resolved'] = 'new'
    office_notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class IncidentUpdate(BaseModel):
    status: Optional[Literal['new', 'in_progress', 'resolved']] = None
    office_notes: Optional[str] = None

class PushSub(BaseModel):
    endpoint: str
    keys: dict
    admin_email: Optional[str] = None

# ============ Auth (Emergent Google) ============

async def get_current_admin(x_session_token: Optional[str] = Header(None)) -> dict:
    if not x_session_token:
        raise HTTPException(status_code=401, detail="Missing session token")
    admin = await db.admin_sessions.find_one({"session_token": x_session_token}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid session token")
    # Optional expiry check
    exp = admin.get("expires_at")
    if exp and datetime.fromisoformat(exp) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    return admin

@api_router.post("/auth/session")
async def create_session(payload: dict):
    """Exchange Emergent session_id for a session_token. Frontend calls this after redirect."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to validate session")
        data = r.json()
    doc = {
        "session_token": data["session_token"],
        "email": data["email"],
        "name": data.get("name"),
        "picture": data.get("picture"),
        "expires_at": (datetime.now(timezone.utc).replace(microsecond=0).isoformat()),
    }
    # 7 days expiry
    from datetime import timedelta
    doc["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.admin_sessions.update_one(
        {"session_token": doc["session_token"]}, {"$set": doc}, upsert=True
    )
    return {"session_token": doc["session_token"], "email": doc["email"], "name": doc["name"], "picture": doc.get("picture")}

@api_router.get("/auth/me")
async def whoami(admin: dict = Depends(get_current_admin)):
    return {"email": admin["email"], "name": admin.get("name"), "picture": admin.get("picture")}

@api_router.post("/auth/logout")
async def logout(admin: dict = Depends(get_current_admin)):
    await db.admin_sessions.delete_one({"session_token": admin["session_token"]})
    return {"ok": True}

# ============ Push Notifications ============

@api_router.get("/push/vapid-key")
async def get_vapid_key():
    return {"public_key": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def push_subscribe(sub: PushSub, admin: dict = Depends(get_current_admin)):
    doc = {
        "endpoint": sub.endpoint,
        "keys": sub.keys,
        "admin_email": admin["email"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.push_subscriptions.update_one(
        {"endpoint": sub.endpoint}, {"$set": doc}, upsert=True
    )
    return {"ok": True}

async def send_push_to_all(payload: dict):
    if not VAPID_PRIVATE_KEY:
        return
    subs = await db.push_subscriptions.find({}, {"_id": 0}).to_list(1000)
    for s in subs:
        try:
            webpush(
                subscription_info={"endpoint": s["endpoint"], "keys": s["keys"]},
                data=json.dumps(payload, ensure_ascii=False),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_SUBJECT},
            )
        except WebPushException as e:
            code = getattr(e.response, "status_code", None) if getattr(e, "response", None) else None
            if code in (404, 410):
                await db.push_subscriptions.delete_one({"endpoint": s["endpoint"]})
        except Exception:
            pass

# ============ Incidents ============

def _pick_audio_suffix(mime: Optional[str]) -> str:
    if not mime:
        return ".webm"
    if "mp3" in mime or "mpeg" in mime:
        return ".mp3"
    if "wav" in mime:
        return ".wav"
    if "mp4" in mime or "m4a" in mime:
        return ".m4a"
    if "ogg" in mime:
        return ".ogg"
    return ".webm"


def _decode_audio_b64(audio_b64: str) -> bytes:
    if "," in audio_b64:
        audio_b64 = audio_b64.split(",", 1)[1]
    return base64.b64decode(audio_b64)


async def _whisper_transcribe_file(path: str) -> Optional[str]:
    with open(path, "rb") as fp:
        resp = await stt.transcribe(file=fp, model="whisper-1", response_format="json", language="hi")
    return getattr(resp, "text", None)


async def transcribe_audio_b64(audio_b64: str, mime: str) -> Optional[str]:
    if not stt:
        return None
    try:
        raw = _decode_audio_b64(audio_b64)
    except Exception as e:
        logging.warning(f"Audio decode failed: {e}")
        return None

    suffix = _pick_audio_suffix(mime)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tf:
        tf.write(raw)
        tf.flush()
        path = tf.name
    try:
        return await _whisper_transcribe_file(path)
    except Exception as e:
        logging.warning(f"Whisper failed: {e}")
        return None
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _photo_to_data_url(pb: Optional[str]) -> Optional[str]:
    if not pb:
        return None
    return pb if pb.startswith("data:") else f"data:image/jpeg;base64,{pb}"


def _audio_to_data_url(ab: Optional[str], mime: Optional[str]) -> Optional[str]:
    if not ab:
        return None
    m = mime or "audio/webm"
    return ab if ab.startswith("data:") else f"data:{m};base64,{ab}"


@api_router.post("/incidents", response_model=Incident)
async def create_incident(payload: IncidentCreate, background: BackgroundTasks):
    transcript = None
    if payload.audio_base64:
        transcript = await transcribe_audio_b64(payload.audio_base64, payload.audio_mime or "audio/webm")

    inc = Incident(
        reporter_name=payload.reporter_name.strip() or "अज्ञात",
        location_label=payload.location_label,
        gps_lat=payload.gps_lat,
        gps_lng=payload.gps_lng,
        text=payload.text,
        transcript=transcript,
        is_urgent=payload.is_urgent,
        photo_url=_photo_to_data_url(payload.photo_base64),
        audio_url=_audio_to_data_url(payload.audio_base64, payload.audio_mime),
    )
    await db.incidents.insert_one(inc.model_dump())

    summary = (payload.text or transcript or "नई रिपोर्ट")[:120]
    background.add_task(send_push_to_all, {
        "type": "incident",
        "id": inc.id,
        "urgent": inc.is_urgent,
        "title": "तुरंत ज़रूरी रिपोर्ट" if inc.is_urgent else "नई रिपोर्ट",
        "body": f"{inc.reporter_name}: {summary}",
        "location": inc.location_label or "",
    })
    return inc

@api_router.get("/incidents", response_model=List[Incident])
async def list_incidents(
    status: Optional[str] = None,
    urgent_only: bool = False,
    q: Optional[str] = None,
    zone: Optional[str] = None,
    since: Optional[str] = None,
    limit: int = 200,
    admin: dict = Depends(get_current_admin),
):
    query = {}
    if status:
        query["status"] = status
    if urgent_only:
        query["is_urgent"] = True
    if zone:
        query["location_label"] = zone
    if since:
        query["created_at"] = {"$gte": since}
    if q:
        query["$or"] = [
            {"text": {"$regex": q, "$options": "i"}},
            {"transcript": {"$regex": q, "$options": "i"}},
            {"reporter_name": {"$regex": q, "$options": "i"}},
            {"location_label": {"$regex": q, "$options": "i"}},
            {"office_notes": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.incidents.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs

@api_router.get("/incidents/mine", response_model=List[Incident])
async def my_incidents(reporter_name: str = Query(...), limit: int = 50):
    docs = await db.incidents.find(
        {"reporter_name": reporter_name}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return docs

@api_router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str, admin: dict = Depends(get_current_admin)):
    doc = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc

@api_router.patch("/incidents/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, payload: IncidentUpdate, admin: dict = Depends(get_current_admin)):
    upd = {k: v for k, v in payload.model_dump().items() if v is not None}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.incidents.update_one({"id": incident_id}, {"$set": upd})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    return doc

# ============ Export ============

@api_router.get("/export/csv")
async def export_csv(since: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {}
    if since:
        query["created_at"] = {"$gte": since}
    docs = await db.incidents.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["दिनांक", "स्थान", "रिपोर्टर", "विवरण", "स्थिति", "तुरंत ज़रूरी", "ऑफिस नोट्स"])
    for d in docs:
        w.writerow([
            d.get("created_at", ""),
            d.get("location_label", ""),
            d.get("reporter_name", ""),
            (d.get("text") or d.get("transcript") or "").replace("\n", " "),
            d.get("status", ""),
            "हाँ" if d.get("is_urgent") else "नहीं",
            (d.get("office_notes") or "").replace("\n", " "),
        ])
    data = buf.getvalue().encode("utf-8-sig")  # BOM so Excel opens Hindi properly
    return StreamingResponse(iter([data]), media_type="text/csv; charset=utf-8",
                             headers={"Content-Disposition": "attachment; filename=suraksha-diary.csv"})

@api_router.get("/export/pdf")
async def export_pdf(since: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {}
    if since:
        query["created_at"] = {"$gte": since}
    docs = await db.incidents.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title="Suraksha Diary")
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', parent=styles['Title'], fontName=HINDI_FONT, fontSize=18)
    body_style = ParagraphStyle('body', parent=styles['Normal'], fontName=HINDI_FONT, fontSize=9, leading=13)
    elements = []
    elements.append(Paragraph("सुरक्षा डायरी — रिपोर्ट लॉग", title_style))
    elements.append(Spacer(1, 12))

    data = [["दिनांक", "स्थान", "रिपोर्टर", "विवरण", "स्थिति", "तुरंत"]]
    for d in docs:
        data.append([
            Paragraph((d.get("created_at") or "")[:19].replace("T", " "), body_style),
            Paragraph(d.get("location_label") or "-", body_style),
            Paragraph(d.get("reporter_name") or "-", body_style),
            Paragraph((d.get("text") or d.get("transcript") or "-")[:200], body_style),
            Paragraph(d.get("status") or "-", body_style),
            Paragraph("हाँ" if d.get("is_urgent") else "नहीं", body_style),
        ])
    t = Table(data, repeatRows=1, colWidths=[85, 70, 70, 200, 60, 40])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), HINDI_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#94A3B8')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": "attachment; filename=suraksha-diary.pdf"})

# ============ Health ============
@api_router.get("/")
async def root():
    return {"message": "Suraksha Diary API", "status": "ok"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
