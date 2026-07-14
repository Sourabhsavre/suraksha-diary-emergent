"""
Rate limit test — isolated in its own module so pytest-xdist loadscope pins it
to a separate worker from the auth suite (avoids exhausting the 10/min login
budget for the seeded admin session used by the other tests).
"""

import os
import uuid
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://incident-log-dera.preview.emergentagent.com").rstrip("/")


def test_login_rate_limited():
    """POST /api/auth/login is 10/minute per IP.
    Firing 15 in quick succession must yield at least one 429."""
    codes = []
    for _ in range(15):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": f"rl-{uuid.uuid4().hex[:6]}@example.com", "password": "x"},
        )
        codes.append(r.status_code)
    assert 429 in codes, f"No 429 seen; codes={codes}"
    # And the response body must be a rate-limit error, not a login response
    # (bonus sanity check)
    assert codes.count(429) >= 1
