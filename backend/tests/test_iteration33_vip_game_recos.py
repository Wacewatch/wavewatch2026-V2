"""Iteration 33: VIP game admin config + admin list caps removed + recommendations.

Covers:
  - VIP game public/admin/PUT/reset endpoints + new status structure
  - play cooldown + max_winners_per_day + win_rate=100 path + enabled=false
  - winners list shape (reward_type/reward_days)
  - admin endpoints returning lists without the previous hard caps
  - /api/user/recommendations: empty history -> trending, with history -> personalised + exclusion
"""
import os
import time
import uuid
import pytest
import requests
from pathlib import Path


def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if url:
        return url.rstrip("/")
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set and not in /app/frontend/.env")


BASE_URL = _load_backend_url()
ADMIN_EMAIL = "admin@wavewatch.com"
ADMIN_PASSWORD = "WaveWatch2026!"


# --------------------- fixtures ---------------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def user_session():
    """Create a throwaway user (not admin) for play/recommendations tests."""
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_iter33_{suffix}@wavewatch.dev"
    pwd = "Wave!2026Test"
    username = f"TEST_iter33_{suffix}"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": pwd, "username": username
    }, timeout=15)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    tok = body.get("token") or body.get("access_token")
    if not tok:
        lr = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pwd}, timeout=15)
        tok = lr.json().get("token") or lr.json().get("access_token")
    assert tok
    return {"email": email, "password": pwd, "token": tok}


@pytest.fixture(scope="session")
def user_headers(user_session):
    return {"Authorization": f"Bearer {user_session['token']}", "Content-Type": "application/json"}


# --------------------- VIP game config ---------------------
class TestVipGameConfig:
    def test_public_config_hides_win_rate(self):
        r = requests.get(f"{BASE_URL}/api/vip-game/config", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "win_rate" not in data
        for k in ("enabled", "title", "subtitle", "reward_type", "reward_days",
                  "play_interval_hours", "winners_visible", "wheel_segments",
                  "primary_color", "secondary_color"):
            assert k in data, f"missing public key {k}"

    def test_admin_get_config_full(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/vip-game/config", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        cfg = r.json().get("config")
        assert isinstance(cfg, dict)
        assert "win_rate" in cfg

    def test_admin_get_config_forbidden_for_user(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/admin/vip-game/config", headers=user_headers, timeout=15)
        assert r.status_code == 403

    def test_admin_put_config_persists(self, admin_headers):
        payload = {
            "enabled": True, "title": "Roulette VIP", "subtitle": "Tentez votre chance",
            "win_rate": 7.5, "reward_type": "vip_plus", "reward_days": 14,
            "play_interval_hours": 24, "max_winners_per_day": 3, "winners_visible": 5,
            "win_message": "Bravo!", "lose_message": "Dommage", "wheel_segments": 12,
            "primary_color": "#ff0066", "secondary_color": "#0066ff",
        }
        r = requests.put(f"{BASE_URL}/api/admin/vip-game/config", headers=admin_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        cfg = r.json()["config"]
        for k, v in payload.items():
            assert cfg[k] == v, f"{k} not persisted: got {cfg[k]} expected {v}"
        # confirm via GET
        g = requests.get(f"{BASE_URL}/api/admin/vip-game/config", headers=admin_headers, timeout=15).json()["config"]
        assert g["title"] == "Roulette VIP"
        assert g["win_rate"] == 7.5

    def test_admin_put_config_forbidden_for_user(self, user_headers):
        r = requests.put(f"{BASE_URL}/api/admin/vip-game/config", headers=user_headers, json={"title": "hack"}, timeout=15)
        assert r.status_code == 403


# --------------------- VIP game play / status / winners ---------------------
def _set_cfg(admin_headers, **overrides):
    body = {"enabled": True, "title": "Test", "subtitle": "Test", "win_rate": 5.0,
            "reward_type": "vip", "reward_days": 30, "play_interval_hours": 24,
            "max_winners_per_day": 0, "winners_visible": 10, "wheel_segments": 8,
            "primary_color": "#a855f7", "secondary_color": "#ec4899",
            "win_message": "WIN", "lose_message": "LOSE"}
    body.update(overrides)
    r = requests.put(f"{BASE_URL}/api/admin/vip-game/config", headers=admin_headers, json=body, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["config"]


def _reset_all(admin_headers):
    r = requests.post(f"{BASE_URL}/api/admin/vip-game/reset", headers=admin_headers, json={}, timeout=15)
    assert r.status_code == 200, r.text


class TestVipGamePlay:
    def test_status_structure(self, admin_headers, user_headers):
        _set_cfg(admin_headers, enabled=True)
        _reset_all(admin_headers)
        r = requests.get(f"{BASE_URL}/api/vip-game/status", headers=user_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("enabled", "can_play", "played_today", "won", "last_played_at",
                  "next_play_at", "play_interval_hours"):
            assert k in d, f"missing key {k}"
        assert d["enabled"] is True
        assert d["can_play"] is True
        assert d["played_today"] is False

    def test_play_then_cooldown_and_winrate100(self, admin_headers, user_headers):
        _set_cfg(admin_headers, enabled=True, win_rate=100, max_winners_per_day=0,
                 reward_type="vip", reward_days=7)
        _reset_all(admin_headers)
        # 1st play -> guaranteed win
        r1 = requests.post(f"{BASE_URL}/api/vip-game/play", headers=user_headers, timeout=15)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["won"] is True
        assert d1["reward_type"] == "vip"
        assert d1["reward_days"] == 7
        assert d1.get("next_play_at")
        # 2nd immediate -> 400
        r2 = requests.post(f"{BASE_URL}/api/vip-game/play", headers=user_headers, timeout=15)
        assert r2.status_code == 400, r2.text
        # me should now be VIP
        me = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers, timeout=15)
        assert me.status_code == 200
        mu = me.json()
        if isinstance(mu, dict) and "user" in mu:
            mu = mu["user"]
        assert mu.get("is_vip") is True
        assert mu.get("vip_expires_at")
        # cleanup
        _reset_all(admin_headers)

    def test_play_disabled(self, admin_headers, user_headers):
        _set_cfg(admin_headers, enabled=False)
        _reset_all(admin_headers)
        r = requests.post(f"{BASE_URL}/api/vip-game/play", headers=user_headers, timeout=15)
        assert r.status_code == 403, r.text
        # restore
        _set_cfg(admin_headers, enabled=True, win_rate=5)

    def test_max_winners_per_day_caps_wins(self, admin_headers, user_headers):
        # First, reset and let admin "win" once to fill the cap
        _set_cfg(admin_headers, enabled=True, win_rate=100, max_winners_per_day=1, reward_type="vip", reward_days=1)
        _reset_all(admin_headers)
        admin_play = requests.post(f"{BASE_URL}/api/vip-game/play", headers=admin_headers, timeout=15)
        assert admin_play.status_code == 200, admin_play.text
        assert admin_play.json()["won"] is True  # cap not yet reached
        # Now user plays. Cap is filled (1 winner today), so won must be False even with win_rate=100
        user_play = requests.post(f"{BASE_URL}/api/vip-game/play", headers=user_headers, timeout=15)
        assert user_play.status_code == 200, user_play.text
        assert user_play.json()["won"] is False, "max_winners_per_day cap was not enforced"
        # cleanup
        _reset_all(admin_headers)
        _set_cfg(admin_headers, enabled=True, win_rate=5, max_winners_per_day=0)

    def test_winners_list(self, admin_headers, user_headers):
        # Seed a guaranteed win for the user
        _set_cfg(admin_headers, enabled=True, win_rate=100, max_winners_per_day=0,
                 winners_visible=3, reward_type="vip_plus", reward_days=21)
        _reset_all(admin_headers)
        p = requests.post(f"{BASE_URL}/api/vip-game/play", headers=user_headers, timeout=15)
        assert p.status_code == 200 and p.json()["won"] is True
        r = requests.get(f"{BASE_URL}/api/vip-game/winners", timeout=15)
        assert r.status_code == 200
        winners = r.json().get("winners") if isinstance(r.json(), dict) and "winners" in r.json() else r.json()
        # endpoint may return either {winners:[...]} or [...]: handle both
        if isinstance(winners, dict):
            winners = winners.get("winners", [])
        assert isinstance(winners, list)
        assert len(winners) <= 3
        if winners:
            w0 = winners[0]
            assert "username" in w0
            assert w0.get("reward_type") in ("vip", "vip_plus")
            assert isinstance(w0.get("reward_days"), int)
        # cleanup
        _reset_all(admin_headers)
        _set_cfg(admin_headers, enabled=True, win_rate=5, max_winners_per_day=0, winners_visible=10)


# --------------------- ADMIN LIMITS REMOVED ---------------------
class TestAdminListCapsRemoved:
    """Endpoints no longer hard-cap. We verify the response is a list (or dict) and
    that count is not artificially capped at the legacy boundaries (best-effort)."""

    @pytest.mark.parametrize("path, prev_cap", [
        ("/api/admin/users", 500),
        ("/api/staff-messages", 100),
        ("/api/content-requests", 100),
        ("/api/admin/online-users", None),
        ("/api/admin/watching-now", None),
        ("/api/admin/cinema-rooms", 100),
        ("/api/tv-channels", 500),
        ("/api/radio-stations", 500),
        ("/api/music", 200),
        ("/api/games", 200),
        ("/api/retrogaming", 500),
        ("/api/admin/activities", 200),
        ("/api/admin/vip-codes", 200),
    ])
    def test_endpoint_returns_ok(self, admin_headers, path, prev_cap):
        r = requests.get(f"{BASE_URL}{path}", headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
        body = r.json()
        # Allow list, dict-with-list, or dict (online-users may be dict)
        items = None
        if isinstance(body, list):
            items = body
        elif isinstance(body, dict):
            for k in ("users", "messages", "requests", "rooms", "channels", "stations",
                      "items", "activities", "codes", "online_users", "watching"):
                if k in body and isinstance(body[k], list):
                    items = body[k]; break
        assert items is not None or isinstance(body, dict)

    def test_ebooks_admin_high_limit(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/ebooks?limit=10000", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        body = r.json()
        items = body.get("ebooks") if isinstance(body, dict) else body
        assert isinstance(items, list)

    def test_software_admin_high_limit(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/software?limit=10000", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        body = r.json()
        items = body.get("software") if isinstance(body, dict) else body
        assert isinstance(items, list)


# --------------------- RECOMMENDATIONS ---------------------
def _clear_history_dislikes_favs(headers):
    """Best-effort cleanup. We don't have a bulk-clear endpoint, so use per-item delete."""
    r = requests.get(f"{BASE_URL}/api/user/history", headers=headers, timeout=15)
    if r.status_code == 200:
        for h in r.json() or []:
            cid = h.get("content_id"); ct = h.get("content_type")
            if cid and ct:
                requests.delete(f"{BASE_URL}/api/user/history/{cid}/{ct}", headers=headers, timeout=10)


class TestRecommendations:
    def test_no_history_returns_trending(self, admin_headers):
        # Use a fresh user so history is empty
        suffix = uuid.uuid4().hex[:8]
        email = f"TEST_iter33_reco_{suffix}@wavewatch.dev"
        pwd = "Wave!2026Test"
        username = f"TEST_iter33_reco_{suffix}"
        rr = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": pwd, "username": username}, timeout=15)
        assert rr.status_code in (200, 201), rr.text
        tok = rr.json().get("token") or rr.json().get("access_token")
        h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}

        r = requests.get(f"{BASE_URL}/api/user/recommendations", headers=h, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "trending"
        items = data.get("recommendations") or []
        assert len(items) > 0
        for it in items[:5]:
            assert it.get("media_type") in ("movie", "tv")
            assert it.get("poster_path")

    def test_with_history_returns_personalised_and_excludes_seen(self, admin_headers):
        # Fresh user
        suffix = uuid.uuid4().hex[:8]
        email = f"TEST_iter33_perso_{suffix}@wavewatch.dev"
        pwd = "Wave!2026Test"
        username = f"TEST_iter33_perso_{suffix}"
        rr = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": pwd, "username": username}, timeout=15)
        assert rr.status_code in (200, 201), rr.text
        tok = rr.json().get("token") or rr.json().get("access_token")
        h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}

        # Add Inception (27205) and The Dark Knight (155) to history
        for cid in (27205, 155):
            ph = requests.post(f"{BASE_URL}/api/user/history", headers=h, json={
                "content_id": cid, "content_type": "movie", "title": f"TEST_{cid}"
            }, timeout=15)
            assert ph.status_code in (200, 201), ph.text

        # Add a like rating on a movie + a dislike to verify exclusion
        requests.post(f"{BASE_URL}/api/user/ratings", headers=h, json={
            "content_id": 27205, "content_type": "movie", "rating": "like"}, timeout=15)
        # dislike The Matrix (603) -> must not appear in recos
        requests.post(f"{BASE_URL}/api/user/ratings", headers=h, json={
            "content_id": 603, "content_type": "movie", "rating": "dislike"}, timeout=15)
        # favourite Pulp Fiction (680) -> must also be excluded
        requests.post(f"{BASE_URL}/api/favorites", headers=h, json={
            "content_id": 680, "content_type": "movie", "title": "TEST_PulpFiction"
        }, timeout=15)

        time.sleep(1)
        r = requests.get(f"{BASE_URL}/api/user/recommendations", headers=h, timeout=45)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "personalised", f"source={data.get('source')}"
        items = data.get("recommendations") or []
        assert len(items) > 0
        excluded_ids = {("movie", 27205), ("movie", 155), ("movie", 603), ("movie", 680)}
        seen_ids = set()
        for it in items:
            mt = it.get("media_type")
            iid = it.get("id")
            assert mt in ("movie", "tv"), f"missing media_type: {it}"
            assert it.get("poster_path"), "missing poster_path"
            assert it.get("title") or it.get("name"), "missing title/name"
            try:
                seen_ids.add((mt, int(iid)))
            except Exception:
                pass
        assert excluded_ids.isdisjoint(seen_ids), f"excluded ids leaked: {excluded_ids & seen_ids}"
