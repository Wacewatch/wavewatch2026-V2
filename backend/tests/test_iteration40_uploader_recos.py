"""Iteration 40 — Uploader admin access + Recommendations excludes seen."""
import os
import pytest
import requests

def _load_base():
    v = os.environ.get('REACT_APP_BACKEND_URL')
    if v:
        return v.rstrip('/')
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().rstrip('/')
    except Exception:
        pass
    return ''

BASE = _load_base()
assert BASE, "REACT_APP_BACKEND_URL missing"
ADMIN = {"email": "admin@wavewatch.com", "password": "WaveWatch2026!"}
UPLOADER = {"email": "uploader@wavewatch.com", "password": "Uploader2026!"}


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def uploader_sess():
    return _login(UPLOADER["email"], UPLOADER["password"])


@pytest.fixture(scope="module")
def admin_sess():
    return _login(ADMIN["email"], ADMIN["password"])


# -------- Uploader: ALLOWED endpoints (must return 200/201/2xx) --------

ALLOWED_GET = [
    "/api/admin/enhanced-stats",
    "/api/admin/online-users",
    "/api/admin/watching-now",
]


@pytest.mark.parametrize("path", ALLOWED_GET)
def test_uploader_allowed_get(uploader_sess, path):
    r = uploader_sess.get(f"{BASE}{path}", timeout=30)
    assert r.status_code == 200, f"{path}: {r.status_code} {r.text[:200]}"


def _crud_cycle(sess, base_path, payload, label):
    # CREATE
    r = sess.post(f"{BASE}{base_path}", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"CREATE {base_path}: {r.status_code} {r.text[:200]}"
    body = r.json()
    item_id = body.get("_id") or body.get("id") or (body.get(label) or {}).get("_id")
    if not item_id:
        # some endpoints return {success:true, id:...}
        item_id = body.get("inserted_id")
    assert item_id, f"no id returned by {base_path}: {body}"

    # UPDATE
    r2 = sess.put(f"{BASE}{base_path}/{item_id}", json={"description": "TEST_updated"}, timeout=30)
    assert r2.status_code in (200, 204), f"PUT {base_path}: {r2.status_code} {r2.text[:200]}"

    # DELETE
    r3 = sess.delete(f"{BASE}{base_path}/{item_id}", timeout=30)
    assert r3.status_code in (200, 204), f"DELETE {base_path}: {r3.status_code} {r3.text[:200]}"


def test_uploader_tv_channels_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/tv-channels",
                {"name": "TEST_CH", "category": "test", "country": "FR", "stream_url": "http://x", "is_active": True}, "channel")


def test_uploader_radio_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/radio-stations",
                {"name": "TEST_RS", "genre": "test", "country": "FR", "stream_url": "http://x", "is_active": True}, "station")


def test_uploader_music_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/music",
                {"title": "TEST_M", "artist": "T", "genre": "g", "streaming_url": "http://x"}, "music")


def test_uploader_software_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/software",
                {"name": "TEST_S", "developer": "T", "category": "c", "platform": "p", "download_url": "http://x"}, "software")


def test_uploader_games_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/games",
                {"title": "TEST_G", "developer": "T", "genre": "g", "platform": "p", "download_url": "http://x"}, "game")


def test_uploader_ebooks_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/ebooks",
                {"title": "TEST_E", "author": "T", "category": "c", "language": "fr", "download_url": "http://x"}, "ebook")


def test_uploader_retrogaming_crud(uploader_sess):
    _crud_cycle(uploader_sess, "/api/admin/retrogaming",
                {"name": "TEST_R", "url": "http://x", "category": "c"}, "source")


def test_uploader_can_update_content_request(uploader_sess, admin_sess):
    # Need an existing request - try to fetch from admin
    r = admin_sess.get(f"{BASE}/api/content-requests", timeout=30)
    if r.status_code != 200:
        pytest.skip("no content-requests endpoint")
    reqs = (r.json() or {}).get("requests", [])
    if not reqs:
        pytest.skip("no existing content-requests")
    rid = reqs[0]["_id"]
    r2 = uploader_sess.put(f"{BASE}/api/admin/content-requests/{rid}", json={"status": "pending"}, timeout=30)
    assert r2.status_code in (200, 204), f"PUT content-requests as uploader: {r2.status_code} {r2.text[:200]}"


# -------- Uploader: FORBIDDEN endpoints (must return 403) --------

FORBIDDEN_GET = [
    "/api/admin/users",
    "/api/admin/vip-codes",
]


@pytest.mark.parametrize("path", FORBIDDEN_GET)
def test_uploader_forbidden_get(uploader_sess, path):
    r = uploader_sess.get(f"{BASE}{path}", timeout=30)
    assert r.status_code == 403, f"{path} should be 403, got {r.status_code}"


def test_uploader_forbidden_broadcast(uploader_sess):
    r = uploader_sess.post(f"{BASE}/api/admin/broadcast",
                           json={"subject": "x", "content": "y"}, timeout=30)
    assert r.status_code == 403, f"broadcast should be 403, got {r.status_code}"


def test_uploader_forbidden_vip_code_create(uploader_sess):
    r = uploader_sess.post(f"{BASE}/api/admin/vip-codes",
                           json={"code_type": "vip", "duration_days": 7, "quantity": 1}, timeout=30)
    assert r.status_code == 403, f"vip-codes POST should be 403, got {r.status_code}"


def test_uploader_forbidden_info_banner(uploader_sess):
    r = uploader_sess.put(f"{BASE}/api/admin/info-banner",
                          json={"enabled": False, "title": "x", "message": "y"}, timeout=30)
    assert r.status_code == 403, f"info-banner PUT should be 403, got {r.status_code}"


def test_uploader_forbidden_changelogs(uploader_sess):
    r = uploader_sess.post(f"{BASE}/api/admin/changelogs",
                           json={"version": "0.0.0", "title": "t", "release_date": "2026-01-01", "description": "d"}, timeout=30)
    assert r.status_code == 403, f"changelogs POST should be 403, got {r.status_code}"


# -------- Recommendations exclude seen --------

def test_recommendations_excludes_history(admin_sess):
    # Add a movie to history
    payload = {"content_id": 999999777, "title": "TEST_REC_SEEN", "content_type": "movie", "poster_path": ""}
    rh = admin_sess.post(f"{BASE}/api/user/history", json=payload, timeout=30)
    assert rh.status_code in (200, 201), f"history POST failed: {rh.status_code} {rh.text[:200]}"

    try:
        r = admin_sess.get(f"{BASE}/api/user/recommendations", timeout=60)
        assert r.status_code == 200, f"recommendations: {r.status_code} {r.text[:200]}"
        data = r.json()
        items = data.get("recommendations") or data.get("items") or data
        if isinstance(items, dict):
            # combine all sub-lists
            flat = []
            for v in items.values():
                if isinstance(v, list):
                    flat.extend(v)
            items = flat
        seen_ids = {str(i.get("id") or i.get("content_id") or i.get("tmdb_id")) for i in (items or []) if isinstance(i, dict)}
        assert "999999777" not in seen_ids, f"recommendation contains seen content: {seen_ids & {'999999777'}}"
    finally:
        # cleanup
        # find history entry id and delete
        rh_list = admin_sess.get(f"{BASE}/api/user/history", timeout=30)
        if rh_list.status_code == 200:
            for e in (rh_list.json() or {}).get("history", []):
                if e.get("content_id") == 999999777 or str(e.get("content_id")) == "999999777":
                    eid = e.get("_id") or e.get("id")
                    if eid:
                        admin_sess.delete(f"{BASE}/api/user/history/{eid}/movie", timeout=15)
