"""
Iteration 37 - Seasonal Events CRUD + active-window logic.

Public endpoints:
  - GET /api/seasonal-events/active   (current event or null)
  - GET /api/seasonal-events          (list all + currently_active flag)

Admin endpoints (require admin auth):
  - GET    /api/admin/seasonal-events
  - POST   /api/admin/seasonal-events
  - PUT    /api/admin/seasonal-events/{event_id}
  - DELETE /api/admin/seasonal-events/{event_id}

Today is May 10, 2026 - none of the 5 default events should be active.
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"

DEFAULT_SLUGS = {"halloween", "christmas", "summer", "valentine", "anniversary"}


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("token") or body.get("access_token")
    assert token, f"no token in login response: {body}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture
def cleanup_event_ids():
    """Track IDs created during a test to ensure cleanup."""
    ids = []
    yield ids
    # Best-effort cleanup using an admin session
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    if r.status_code == 200:
        token = r.json().get("token") or r.json().get("access_token")
        if token:
            s.headers.update({"Authorization": f"Bearer {token}"})
            for eid in ids:
                try:
                    s.delete(f"{BASE_URL}/api/admin/seasonal-events/{eid}", timeout=15)
                except Exception:
                    pass


# ----------------- Public endpoints -----------------

class TestPublicSeasonalEvents:
    def test_active_returns_null_in_may(self):
        """In May 2026 none of the 5 default events overlap the current date."""
        r = requests.get(f"{BASE_URL}/api/seasonal-events/active", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "event" in data
        assert data["event"] is None, f"expected null event in May, got {data['event']}"

    def test_list_returns_all_5_defaults(self):
        r = requests.get(f"{BASE_URL}/api/seasonal-events", timeout=15)
        assert r.status_code == 200, r.text
        events = r.json().get("events", [])
        slugs = {e.get("slug") for e in events}
        # All defaults must exist
        missing = DEFAULT_SLUGS - slugs
        assert not missing, f"missing default events: {missing}"
        # All defaults must have currently_active=False today (May 10, 2026)
        for e in events:
            if e.get("slug") in DEFAULT_SLUGS:
                assert e.get("currently_active") is False, (
                    f"default {e.get('slug')} should not be currently_active in May, "
                    f"got {e.get('currently_active')}"
                )
        # Validate response shape on at least one item
        sample = next(e for e in events if e.get("slug") == "halloween")
        for key in ("id", "name", "slug", "icon", "color", "auto_theme",
                    "xp_multiplier", "month_start", "day_start",
                    "month_end", "day_end", "currently_active"):
            assert key in sample, f"missing key {key} in event payload"


# ----------------- Admin auth gating -----------------

class TestAdminAuthGating:
    def test_admin_list_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/seasonal-events", timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_admin_create_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/seasonal-events",
            json={"name": "x", "slug": "x", "month_start": 1, "day_start": 1,
                  "month_end": 1, "day_end": 2},
            timeout=15,
        )
        assert r.status_code in (401, 403)

    def test_admin_delete_requires_auth(self):
        r = requests.delete(
            f"{BASE_URL}/api/admin/seasonal-events/evt_does_not_exist", timeout=15,
        )
        assert r.status_code in (401, 403)


# ----------------- Admin CRUD -----------------

class TestAdminCRUD:
    def test_admin_list_with_auth(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/seasonal-events", timeout=15)
        assert r.status_code == 200, r.text
        events = r.json().get("events", [])
        # 5 defaults must exist
        slugs = {e.get("slug") for e in events}
        assert DEFAULT_SLUGS.issubset(slugs), f"defaults missing: {DEFAULT_SLUGS - slugs}"
        # Each must have currently_active flag
        for e in events:
            assert "currently_active" in e

    def test_create_event_covering_may_makes_active(self, admin_session, cleanup_event_ids):
        suffix = uuid.uuid4().hex[:6]
        payload = {
            "name": f"TEST_MayEvent_{suffix}",
            "slug": f"test_may_{suffix}",
            "description": "Test event covering May 10",
            "icon": "Sparkles",
            "color": "#a855f7",
            "auto_theme": "neon",
            "month_start": 5, "day_start": 1,
            "month_end": 5, "day_end": 31,
            "xp_multiplier": 2.0,
            "bonus_genres": [28, 12],
            "bonus_content_types": ["movie", "tv"],
            "active": True,
        }
        r = admin_session.post(
            f"{BASE_URL}/api/admin/seasonal-events", json=payload, timeout=20,
        )
        assert r.status_code == 200, r.text
        evt = r.json().get("event")
        assert evt and evt.get("id"), f"missing id in create response: {r.json()}"
        eid = evt["id"]
        cleanup_event_ids.append(eid)
        # Confirm field values
        assert evt["name"] == payload["name"]
        assert evt["slug"] == payload["slug"]
        assert evt["xp_multiplier"] == 2.0
        assert evt["auto_theme"] == "neon"

        # Public active endpoint must now return this event
        r2 = requests.get(f"{BASE_URL}/api/seasonal-events/active", timeout=15)
        assert r2.status_code == 200
        active = r2.json().get("event")
        assert active is not None, "active endpoint should return our May event"
        assert active.get("id") == eid or active.get("slug") == payload["slug"], (
            f"active event mismatch: {active}"
        )

    def test_update_event_persists(self, admin_session, cleanup_event_ids):
        suffix = uuid.uuid4().hex[:6]
        create_payload = {
            "name": f"TEST_UpdateEvt_{suffix}",
            "slug": f"test_upd_{suffix}",
            "description": "Original",
            "icon": "Star",
            "color": "#ff0000",
            "auto_theme": None,
            "month_start": 1, "day_start": 1,
            "month_end": 1, "day_end": 31,
            "xp_multiplier": 1.0,
            "bonus_genres": [],
            "bonus_content_types": ["movie"],
            "active": True,
        }
        r = admin_session.post(
            f"{BASE_URL}/api/admin/seasonal-events",
            json=create_payload, timeout=20,
        )
        assert r.status_code == 200, r.text
        eid = r.json()["event"]["id"]
        cleanup_event_ids.append(eid)

        update_payload = {**create_payload,
                          "name": f"TEST_Updated_{suffix}",
                          "xp_multiplier": 4.0,
                          "description": "Updated description"}
        r2 = admin_session.put(
            f"{BASE_URL}/api/admin/seasonal-events/{eid}",
            json=update_payload, timeout=20,
        )
        assert r2.status_code == 200, r2.text
        assert r2.json().get("ok") is True

        # Verify via admin list
        r3 = admin_session.get(f"{BASE_URL}/api/admin/seasonal-events", timeout=15)
        events = r3.json().get("events", [])
        target = next((e for e in events if e.get("id") == eid), None)
        assert target is not None, "updated event not found in list"
        assert target["name"] == update_payload["name"]
        assert target["xp_multiplier"] == 4.0
        assert target["description"] == "Updated description"

    def test_update_nonexistent_returns_404(self, admin_session):
        r = admin_session.put(
            f"{BASE_URL}/api/admin/seasonal-events/evt_does_not_exist_xyz",
            json={
                "name": "x", "slug": "x",
                "month_start": 1, "day_start": 1,
                "month_end": 1, "day_end": 2,
            },
            timeout=15,
        )
        assert r.status_code == 404, r.text

    def test_delete_event_removes_from_active(self, admin_session):
        suffix = uuid.uuid4().hex[:6]
        payload = {
            "name": f"TEST_DeleteEvt_{suffix}",
            "slug": f"test_del_{suffix}",
            "description": "Will be deleted",
            "icon": "Trash",
            "color": "#000000",
            "auto_theme": None,
            "month_start": 5, "day_start": 1,
            "month_end": 5, "day_end": 31,
            "xp_multiplier": 1.5,
            "bonus_genres": [],
            "bonus_content_types": [],
            "active": True,
        }
        r = admin_session.post(
            f"{BASE_URL}/api/admin/seasonal-events", json=payload, timeout=20,
        )
        assert r.status_code == 200, r.text
        eid = r.json()["event"]["id"]

        # Confirm event covers May => active
        r2 = requests.get(f"{BASE_URL}/api/seasonal-events/active", timeout=15)
        assert r2.status_code == 200
        active = r2.json().get("event")
        assert active is not None
        active_id = active.get("id")

        # Delete the event
        r3 = admin_session.delete(
            f"{BASE_URL}/api/admin/seasonal-events/{eid}", timeout=15,
        )
        assert r3.status_code == 200, r3.text
        assert r3.json().get("ok") is True

        # If it was the active one, /active should now return null (no other May default)
        if active_id == eid:
            r4 = requests.get(f"{BASE_URL}/api/seasonal-events/active", timeout=15)
            assert r4.status_code == 200
            assert r4.json().get("event") is None, (
                f"after deleting only-May event, active should be null, "
                f"got {r4.json().get('event')}"
            )

        # Confirm not in admin list anymore
        r5 = admin_session.get(f"{BASE_URL}/api/admin/seasonal-events", timeout=15)
        slugs = [e.get("slug") for e in r5.json().get("events", [])]
        assert payload["slug"] not in slugs


# ----------------- Inactive flag honoured -----------------

class TestActiveFlagLogic:
    def test_inactive_event_not_returned_by_active_endpoint(self, admin_session, cleanup_event_ids):
        """active=False event covering current date must NOT be the active one."""
        suffix = uuid.uuid4().hex[:6]
        payload = {
            "name": f"TEST_InactiveMay_{suffix}",
            "slug": f"test_inactive_{suffix}",
            "description": "May event but inactive flag",
            "icon": "Sparkles",
            "color": "#666666",
            "auto_theme": None,
            "month_start": 5, "day_start": 1,
            "month_end": 5, "day_end": 31,
            "xp_multiplier": 1.0,
            "bonus_genres": [],
            "bonus_content_types": [],
            "active": False,
        }
        r = admin_session.post(
            f"{BASE_URL}/api/admin/seasonal-events", json=payload, timeout=20,
        )
        assert r.status_code == 200, r.text
        eid = r.json()["event"]["id"]
        cleanup_event_ids.append(eid)

        r2 = requests.get(f"{BASE_URL}/api/seasonal-events/active", timeout=15)
        assert r2.status_code == 200
        active = r2.json().get("event")
        # Either null, or some other event - never our inactive one
        if active:
            assert active.get("id") != eid, "inactive event should not be returned"
