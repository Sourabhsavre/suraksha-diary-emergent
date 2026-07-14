# Suraksha Diary (सुरक्षा डायरी) — Product Requirements

## Original Problem
Mobile-first PWA for RSSB Security Sevadars replacing paper reporting notebook. Must work for elderly/illiterate volunteers in Hindi with voice/photo/text, offline queue, and central office dashboard.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor) on Emergent cloud
- **Frontend**: React 19 PWA (Devanagari-first, service worker, IndexedDB offline queue)
- **Integrations**: OpenAI Whisper (Hindi transcription via Emergent LLM key), Web Push (VAPID), Emergent-managed Google Auth (admin only)

## User Personas
1. **Sevadar (field)** — no login, elderly/semi-literate friendly, wizard flow
2. **Office Admin** — Google Sign-In, live dashboard, filters, export

## Core Requirements — Implemented (2026-07-14)
- Sevadar 4-step wizard: name → location (GPS + zone buttons) → capture (voice/photo/text + urgent toggle) → review → success animation
- Auto Whisper Hindi transcription of voice notes stored alongside audio
- "My Reports" list with status pills (नई / देखी जा रही है / सुलझ गई)
- Offline queue in IndexedDB with auto-flush on reconnect + "भेजने के लिए तैयार" indicator
- Admin dashboard: live polling (6s), filters (status/urgent/search), stat cards, detail modal with photo/audio/map/notes/status change
- Web Push subscriptions with VAPID (background alerts)
- CSV + PDF export with Hindi (Noto Sans Devanagari embedded in PDF)
- UTF-8 charset middleware to prevent Devanagari mojibake
- PWA manifest + service worker + Hindi meta

## Backlog / P1
- Admin can manage sevadar name whitelist (currently free-text)
- Bulk assign/resolve
- Reporter self-view via QR code
- Multi-language toggle (English fallback)

## Backlog / P2
- Photo storage in object storage (currently inline data URLs — fine at MVP volume, migrate later)
- Geofencing / zone auto-detect from GPS
- Analytics dashboard (incidents by zone/day heatmap)
- SMS fallback for urgent alerts
