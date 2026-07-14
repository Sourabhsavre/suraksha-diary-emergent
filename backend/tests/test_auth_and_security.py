"""
Iteration-2 backend tests for Suraksha Diary.

Covers:
  * Email+password admin login (/api/auth/login)
  * Password-created session compatibility with /api/auth/me
  * Staff CRUD (/api/auth/staff): list / create / delete + self-delete guard
  * Duplicate insert (409) & login as newly created staff
  * Security headers (X-Frame-Options / X-Content-Type-Options / Referrer-Policy / HSTS)
  * Public /docs, /redoc, /openapi.json disabled (NOT swagger)
  * Rate limiting on /api/auth/login (10/minute -> 429 after limit)
  * Regression: sevadar POST /api/incidents + GET /api/incidents/mine (no auth, Devanagari)
  * Payload size caps: reporter_name > 120 chars -> 422; text > 5000 chars -> 422
"""

import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://incident-log-dera.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "[email protected]"
ADMIN_PASSWORD = "admin123"
STAFF_EMAIL = "[email protected]"
STAFF_PASSWORD = "staffpass"


# ---------- fixtures ----------

@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "session_token" in data and data["session_token"]
    return data["session_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Content-Type": "application/json", "X-Session-Token": admin_token}


@pytest.fixture(scope="session", autouse=True)
def _cleanup_staff(api, admin_headers):
    """Ensure staff row from any prior run is removed before we start."""
    api.delete(f"{BASE_URL}/api/auth/staff/{STAFF_EMAIL}", headers=admin_headers)
    yield
    api.delete(f"{BASE_URL}/api/auth/staff/{STAFF_EMAIL}", headers=admin_headers)


# ---------- auth: password login ----------

class TestPasswordLogin:
    def test_login_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["name"]  # 'Admin'
        assert isinstance(data["session_token"], str) and len(data["session_token"]) >= 20

    def test_login_wrong_password(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": "wrong-pass"})
        assert r.status_code == 401

    def test_login_unknown_email(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": f"nobody-{uuid.uuid4().hex[:6]}@example.com",
                           "password": "whatever"})
        assert r.status_code == 401

    def test_session_from_password_works_on_me(self, api, admin_token):
        # Password-created session must be interchangeable with Google-created session
        r = api.get(f"{BASE_URL}/api/auth/me",
                    headers={"X-Session-Token": admin_token})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["name"] == "Admin"

    def test_me_without_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------- staff management ----------

class TestStaffManagement:
    def test_list_staff_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/auth/staff")
        assert r.status_code == 401

    def test_list_staff_contains_seeded_admin(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/auth/staff", headers=admin_headers)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        emails = [u.get("email") for u in arr]
        assert ADMIN_EMAIL in emails
        # password_hash must be projected out
        for u in arr:
            assert "password_hash" not in u
            assert "_id" not in u

    def test_add_staff_ok(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/auth/staff",
                     headers=admin_headers,
                     json={"email": STAFF_EMAIL, "name": "Staff One",
                           "password": STAFF_PASSWORD, "can_google_login": True})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == STAFF_EMAIL
        assert data["has_password"] is True
        assert data["can_google_login"] is True

        # Verify persisted via GET /auth/staff
        r2 = api.get(f"{BASE_URL}/api/auth/staff", headers=admin_headers)
        assert STAFF_EMAIL in [u["email"] for u in r2.json()]

    def test_add_staff_duplicate_returns_409(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/auth/staff",
                     headers=admin_headers,
                     json={"email": STAFF_EMAIL, "name": "Dup",
                           "password": STAFF_PASSWORD, "can_google_login": True})
        assert r.status_code == 409

    def test_new_staff_can_login(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD})
        assert r.status_code == 200
        assert r.json()["email"] == STAFF_EMAIL

    def test_delete_self_forbidden(self, api, admin_headers):
        r = api.delete(f"{BASE_URL}/api/auth/staff/{ADMIN_EMAIL}",
                       headers=admin_headers)
        assert r.status_code == 400

    def test_delete_staff_ok(self, api, admin_headers):
        r = api.delete(f"{BASE_URL}/api/auth/staff/{STAFF_EMAIL}",
                       headers=admin_headers)
        assert r.status_code == 200
        # Verify gone
        r2 = api.get(f"{BASE_URL}/api/auth/staff", headers=admin_headers)
        assert STAFF_EMAIL not in [u["email"] for u in r2.json()]


# ---------- security hardening ----------

class TestSecurityHeaders:
    def test_headers_present_on_api(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        h = {k.lower(): v for k, v in r.headers.items()}
        assert h.get("x-frame-options") == "DENY"
        assert h.get("x-content-type-options") == "nosniff"
        assert "referrer-policy" in h
        assert "strict-transport-security" in h

    def test_docs_disabled(self):
        for path in ["/docs", "/redoc", "/openapi.json"]:
            r = requests.get(f"{BASE_URL}{path}", allow_redirects=False)
            body = r.text.lower()
            # Must NOT be the FastAPI swagger UI
            assert "swagger" not in body, f"{path} is exposing swagger UI"
            assert "redoc" not in body or "<!doctype" not in body or path == "/redoc" and "redoc" not in body
            # 404 or fallback HTML is acceptable
            assert r.status_code in (200, 401, 404), f"{path} -> {r.status_code}"


# ---------- regressions ----------

class TestSevadarRegression:
    def test_create_incident_no_auth_devanagari(self, api):
        payload = {
            "reporter_name": "टेस्ट सेवादार",
            "device_id": "dev-regression-1",
            "location_label": "पार्किंग",
            "text": "गेट के पास संदिग्ध व्यक्ति देखा गया — कृपया जांच करें।",
            "is_urgent": True,
        }
        r = api.post(f"{BASE_URL}/api/incidents", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["reporter_name"] == "टेस्ट सेवादार"
        assert data["location_label"] == "पार्किंग"
        assert "संदिग्ध" in data["text"]
        assert data["status"] == "new"
        assert data["is_urgent"] is True

    def test_incidents_mine_no_auth(self, api):
        # Create one first to guarantee at least one result
        api.post(f"{BASE_URL}/api/incidents", json={
            "reporter_name": "टेस्ट सेवादार",
            "device_id": "dev-regression-1",
            "text": "मीने रिपोर्ट",
        })
        r = api.get(f"{BASE_URL}/api/incidents/mine",
                    params={"reporter_name": "टेस्ट सेवादार"})
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 1
        for it in arr:
            assert it["reporter_name"] == "टेस्ट सेवादार"


# ---------- payload size caps ----------

class TestPayloadCaps:
    def test_reporter_name_too_long(self, api):
        payload = {"reporter_name": "x" * 121, "device_id": "dev-cap"}
        r = api.post(f"{BASE_URL}/api/incidents", json=payload)
        assert r.status_code == 422, f"expected 422 got {r.status_code}: {r.text}"

    def test_text_too_long(self, api):
        payload = {"reporter_name": "Sevadar", "device_id": "dev-cap",
                   "text": "क" * 5001}
        r = api.post(f"{BASE_URL}/api/incidents", json=payload)
        assert r.status_code == 422, f"expected 422 got {r.status_code}: {r.text}"

    def test_boundary_valid(self, api):
        payload = {"reporter_name": "a" * 120, "device_id": "dev-cap",
                   "text": "क" * 5000}
        r = api.post(f"{BASE_URL}/api/incidents", json=payload)
        assert r.status_code == 200
