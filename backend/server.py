from dotenv import load_dotenv
load_dotenv()

import os
import re
import bcrypt
import jwt
import secrets
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any
from fastapi import FastAPI, HTTPException, Request, Response, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from contextlib import asynccontextmanager

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@wavewatch.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "WaveWatch2026!")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
ENV = os.environ.get("ENV", "development").lower()
IS_PROD = ENV == "production"
# Allowed CORS origins - support multiple via comma-separated FRONTEND_URL
_raw_origins = os.environ.get("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except:
                self.disconnect(user_id)

    async def broadcast(self, message: dict, exclude: str = None):
        for uid, ws in list(self.active_connections.items()):
            if uid != exclude:
                try:
                    await ws.send_json(message)
                except:
                    self.disconnect(uid)

ws_manager = ConnectionManager()

# Password helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# JWT helpers
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    cookie_kwargs = {
        "httponly": True,
        "secure": IS_PROD,
        "samesite": "none" if IS_PROD else "lax",
        "path": "/",
    }
    response.set_cookie(key="access_token", value=access_token, max_age=86400, **cookie_kwargs)
    response.set_cookie(key="refresh_token", value=refresh_token, max_age=604800, **cookie_kwargs)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifie")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expire")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

def serialize_user(user: dict) -> dict:
    u = {**user}
    if "_id" in u:
        u["_id"] = str(u["_id"])
    u.pop("password_hash", None)
    # Grade hierarchy: admin > uploader (gets VIP+VIP+ perks) > VIP+ > VIP > member
    if u.get("is_uploader") or u.get("is_admin"):
        u["is_vip"] = True
        u["is_vip_plus"] = True
    return u

# Seed admin
async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "username": "Admin",
            "role": "admin",
            "is_admin": True,
            "is_vip": True,
            "is_vip_plus": True,
            "is_uploader": True,
            "show_adult_content": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "active"
        })
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {ADMIN_EMAIL}\n- Password: {ADMIN_PASSWORD}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n")

# Seed default content
async def seed_default_content():
    # Seed TV channels if empty
    if await db.tv_channels.count_documents({}) == 0:
        default_channels = [
            {"name": "TF1", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/TF1_logo_2013.png/200px-TF1_logo_2013.png", "stream_url": "", "category": "Generaliste", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "France 2", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/France_2_logo.png/200px-France_2_logo.png", "stream_url": "", "category": "Generaliste", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "France 3", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/France_3_logo.png/200px-France_3_logo.png", "stream_url": "", "category": "Generaliste", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Canal+", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Canal%2B_logo.png/200px-Canal%2B_logo.png", "stream_url": "", "category": "Premium", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "M6", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/M6_logo_2020.png/200px-M6_logo_2020.png", "stream_url": "", "category": "Generaliste", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Arte", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Arte_logo.png/200px-Arte_logo.png", "stream_url": "", "category": "Culture", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "BFM TV", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/BFMTV_logo.png/200px-BFMTV_logo.png", "stream_url": "", "category": "Info", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "TMC", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/TMC_logo_2016.png/200px-TMC_logo_2016.png", "stream_url": "", "category": "Generaliste", "country": "FR", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.tv_channels.insert_many(default_channels)
    # Seed radio stations if empty
    if await db.radio_stations.count_documents({}) == 0:
        default_radios = [
            {"name": "NRJ", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/NRJ_logo.png/200px-NRJ_logo.png", "stream_url": "https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3", "genre": "Pop/Dance", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Skyrock", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Skyrock_logo.png/200px-Skyrock_logo.png", "stream_url": "https://icecast.skyrock.net/s/natio_mp3_128k", "genre": "Rap/Hip-Hop", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Fun Radio", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Fun_Radio_logo.png/200px-Fun_Radio_logo.png", "stream_url": "https://streaming.radio.funradio.fr/fun-1-44-128", "genre": "Dance/Electro", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "RTL", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/RTL_logo.png/200px-RTL_logo.png", "stream_url": "", "genre": "Generaliste", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "France Inter", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/France_Inter_logo.png/200px-France_Inter_logo.png", "stream_url": "https://icecast.radiofrance.fr/franceinter-hifi.aac", "genre": "Generaliste", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.radio_stations.insert_many(default_radios)
    # Seed platform reviews if empty
    if await db.platform_reviews.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        default_reviews = [
            {"user_id": "seed_user_1", "username": "CinePhile75", "is_admin": False, "is_vip": True, "is_vip_plus": False, "is_uploader": False, "contenu_score": 9, "fonctionnalites_score": 8, "design_score": 9, "message": "Super plateforme ! Le catalogue est immense et la qualite toujours au rendez-vous. J'adore les collections thematiques.", "created_at": now},
            {"user_id": "seed_user_2", "username": "MovieLover92", "is_admin": False, "is_vip": False, "is_vip_plus": False, "is_uploader": False, "contenu_score": 8, "fonctionnalites_score": 9, "design_score": 8, "message": "Le design est magnifique et tres intuitif. Les themes personnalisables sont un vrai plus !", "created_at": now},
            {"user_id": "seed_user_3", "username": "SeriesAddict", "is_admin": False, "is_vip": True, "is_vip_plus": True, "is_uploader": False, "contenu_score": 10, "fonctionnalites_score": 9, "design_score": 10, "message": "La meilleure plateforme de streaming que j'ai testee. Le suivi des series avec les notifications est genial.", "created_at": now},
            {"user_id": "seed_user_4", "username": "AnimeFan_FR", "is_admin": False, "is_vip": False, "is_vip_plus": False, "is_uploader": False, "contenu_score": 9, "fonctionnalites_score": 8, "design_score": 9, "message": "Enfin une plateforme avec un vrai catalogue anime ! Les sous-titres francais sont toujours disponibles.", "created_at": now},
            {"user_id": "seed_user_5", "username": "TechReviewer", "is_admin": False, "is_vip": True, "is_vip_plus": False, "is_uploader": True, "contenu_score": 8, "fonctionnalites_score": 10, "design_score": 8, "message": "Fonctionnalites impressionnantes : playlists, retrogaming, radio... C'est bien plus qu'un simple site de streaming.", "created_at": now},
            {"user_id": "seed_user_6", "username": "NightOwl", "is_admin": False, "is_vip": False, "is_vip_plus": False, "is_uploader": False, "contenu_score": 9, "fonctionnalites_score": 8, "design_score": 9, "message": "Le mode sombre est parfait pour les sessions nocturnes. Bravo pour le travail sur l'interface !", "created_at": now},
        ]
        await db.platform_reviews.insert_many(default_reviews)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.favorites.create_index([("user_id", 1), ("content_id", 1), ("content_type", 1)], unique=True)
    await db.watch_history.create_index([("user_id", 1), ("content_id", 1), ("content_type", 1)], unique=True)
    await db.playlists.create_index("user_id")
    await db.feedback.create_index("created_at")
    await db.staff_messages.create_index("user_id")
    await db.content_requests.create_index("user_id")
    await seed_admin()
    await seed_default_content()
    yield

app = FastAPI(title="WaveWatch API", lifespan=lifespan)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if IS_PROD:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Password policy
PASSWORD_MIN_LEN = 8
def validate_password_strength(pw: str):
    if len(pw) < PASSWORD_MIN_LEN:
        raise HTTPException(status_code=400, detail=f"Le mot de passe doit contenir au moins {PASSWORD_MIN_LEN} caracteres")
    if not re.search(r"[A-Z]", pw):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins une majuscule")
    if not re.search(r"[0-9]", pw):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins un chiffre")

# Pydantic models
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def _uname(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 32:
            raise ValueError("Le nom d'utilisateur doit contenir entre 2 et 32 caracteres")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class FeedbackRequest(BaseModel):
    content: int
    functionality: int
    design: int
    message: Optional[str] = None

class StaffMessageRequest(BaseModel):
    subject: str
    message: str

class ContentRequestModel(BaseModel):
    title: str
    content_type: str
    description: Optional[str] = None

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    is_public: Optional[bool] = False

class PlaylistItemAdd(BaseModel):
    content_id: Any  # Accept int or string for universal content
    content_type: str  # movie, tv, actor, episode, music, game, ebook, software, tv_channel, radio
    title: str
    poster_path: Optional[str] = None
    metadata: Optional[dict] = None

class FavoriteToggle(BaseModel):
    content_id: Any  # Accept int or string for universal favorites
    content_type: str
    title: str
    poster_path: Optional[str] = None
    metadata: Optional[dict] = None

class SiteSettingUpdate(BaseModel):
    setting_key: str
    setting_value: Any

class UserRoleUpdate(BaseModel):
    role: Optional[str] = None
    is_vip: Optional[bool] = None
    is_vip_plus: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_uploader: Optional[bool] = None

# ==================== AUTH ====================
@app.post("/api/auth/register")
async def register(req: RegisterRequest, request: Request, response: Response):
    email = req.email.strip().lower()
    # Rate-limit register by IP (max 5 registrations / hour)
    ip = request.client.host if request.client else "unknown"
    rl_key = f"register:{ip}"
    rl = await db.register_attempts.find_one({"identifier": rl_key})
    now = datetime.now(timezone.utc)
    if rl:
        window_start = datetime.fromisoformat(rl.get("window_start", now.isoformat()))
        if (now - window_start).total_seconds() < 3600:
            if rl.get("count", 0) >= 5:
                raise HTTPException(status_code=429, detail="Trop de comptes crees depuis cette IP. Reessayez plus tard.")
        else:
            await db.register_attempts.delete_one({"identifier": rl_key})
    # Password policy
    validate_password_strength(req.password)
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est deja utilise")
    user_doc = {
        "email": email,
        "username": req.username.strip(),
        "password_hash": hash_password(req.password),
        "role": "user",
        "is_admin": False,
        "is_vip": False,
        "is_vip_plus": False,
        "is_uploader": False,
        "show_adult_content": False,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "vip_expires_at": None
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    # Record rate-limit attempt
    await db.register_attempts.update_one(
        {"identifier": rl_key},
        {"$inc": {"count": 1}, "$setOnInsert": {"window_start": now.isoformat()}},
        upsert=True
    )
    user_doc["_id"] = user_id
    return {"user": serialize_user(user_doc), "token": access}

@app.post("/api/auth/login")
async def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("locked_until")
        if lockout_until and datetime.now(timezone.utc) < datetime.fromisoformat(lockout_until):
            raise HTTPException(status_code=429, detail="Trop de tentatives. Reessayez dans 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": serialize_user(user), "token": access}

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Deconnexion reussie"}

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": serialize_user(user)}

@app.post("/api/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access, httponly=True, secure=IS_PROD, samesite="none" if IS_PROD else "lax", max_age=86400, path="/")
        return {"token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ==================== TMDB PROXY ====================
async def tmdb_fetch(endpoint: str, params: dict = None):
    if not params:
        params = {}
    params["api_key"] = TMDB_API_KEY
    params.setdefault("language", "fr-FR")
    url = f"{TMDB_BASE}{endpoint}"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return {"results": [], "total_pages": 0, "total_results": 0, "page": 1}
        return resp.json()

@app.get("/api/tmdb/trending/movies")
async def tmdb_trending_movies():
    return await tmdb_fetch("/trending/movie/week")

@app.get("/api/tmdb/trending/tv")
async def tmdb_trending_tv():
    return await tmdb_fetch("/trending/tv/week")

@app.get("/api/tmdb/trending/anime")
async def tmdb_trending_anime():
    data = await tmdb_fetch("/discover/tv", {"with_genres": "16", "with_origin_country": "JP", "sort_by": "popularity.desc"})
    return data

@app.get("/api/tmdb/popular/movies")
async def tmdb_popular_movies(page: int = 1):
    return await tmdb_fetch("/movie/popular", {"page": str(page)})

@app.get("/api/tmdb/popular/tv")
async def tmdb_popular_tv(page: int = 1):
    return await tmdb_fetch("/tv/popular", {"page": str(page)})

@app.get("/api/tmdb/popular/anime")
async def tmdb_popular_anime(page: int = 1):
    return await tmdb_fetch("/discover/tv", {"with_genres": "16", "sort_by": "popularity.desc", "page": str(page)})

@app.get("/api/tmdb/upcoming/movies")
async def tmdb_upcoming_movies(page: int = 1):
    return await tmdb_fetch("/movie/upcoming", {"page": str(page)})

@app.get("/api/tmdb/movie/{movie_id}")
async def tmdb_movie_details(movie_id: int):
    return await tmdb_fetch(f"/movie/{movie_id}", {"append_to_response": "credits,videos,similar,reviews,watch/providers,release_dates"})

@app.get("/api/tmdb/movie/{movie_id}/release-dates")
async def tmdb_movie_release_dates(movie_id: int):
    return await tmdb_fetch(f"/movie/{movie_id}/release_dates")

@app.get("/api/tmdb/movie/{movie_id}/images")
async def tmdb_movie_images(movie_id: int):
    return await tmdb_fetch(f"/movie/{movie_id}/images", {"include_image_language": "fr,en,null"})

@app.get("/api/tmdb/tv/{tv_id}")
async def tmdb_tv_details(tv_id: int):
    return await tmdb_fetch(f"/tv/{tv_id}", {"append_to_response": "credits,videos,similar,reviews,watch/providers,content_ratings"})

@app.get("/api/tmdb/tv/{tv_id}/season/{season_number}")
async def tmdb_tv_season(tv_id: int, season_number: int):
    return await tmdb_fetch(f"/tv/{tv_id}/season/{season_number}")

@app.get("/api/tmdb/tv/{tv_id}/season/{season_number}/episode/{episode_number}")
async def tmdb_tv_episode(tv_id: int, season_number: int, episode_number: int):
    return await tmdb_fetch(f"/tv/{tv_id}/season/{season_number}/episode/{episode_number}", {"append_to_response": "credits,videos"})

@app.get("/api/tmdb/tv/{tv_id}/images")
async def tmdb_tv_images(tv_id: int):
    return await tmdb_fetch(f"/tv/{tv_id}/images", {"include_image_language": "fr,en,null"})

@app.get("/api/tmdb/tv/{tv_id}/content_ratings")
async def tmdb_tv_content_ratings(tv_id: int):
    return await tmdb_fetch(f"/tv/{tv_id}/content_ratings")

@app.get("/api/tmdb/search")
async def tmdb_search(q: str, page: int = 1):
    return await tmdb_fetch("/search/multi", {"query": q, "page": str(page)})

@app.get("/api/tmdb/search/movies")
async def tmdb_search_movies(q: str, page: int = 1):
    return await tmdb_fetch("/search/movie", {"query": q, "page": str(page)})

@app.get("/api/tmdb/search/tv")
async def tmdb_search_tv(q: str, page: int = 1):
    return await tmdb_fetch("/search/tv", {"query": q, "page": str(page)})

@app.get("/api/tmdb/search/person")
async def tmdb_search_person(q: str, page: int = 1):
    return await tmdb_fetch("/search/person", {"query": q, "page": str(page)})

@app.get("/api/tmdb/genres/{media_type}")
async def tmdb_genres(media_type: str):
    return await tmdb_fetch(f"/genre/{media_type}/list")

@app.get("/api/tmdb/discover/{media_type}")
async def tmdb_discover(media_type: str, page: int = 1, genre: Optional[int] = None, sort_by: str = "popularity.desc",
                        provider: Optional[int] = None, year: Optional[int] = None, vote_avg: Optional[float] = None,
                        include_adult: bool = False):
    params = {"page": str(page), "sort_by": sort_by, "watch_region": "FR", "include_adult": str(include_adult).lower()}
    if genre:
        params["with_genres"] = str(genre)
    if provider:
        params["with_watch_providers"] = str(provider)
    if year:
        if media_type == "movie":
            params["primary_release_year"] = str(year)
        else:
            params["first_air_date_year"] = str(year)
    if vote_avg:
        params["vote_average.gte"] = str(vote_avg)
        params["vote_count.gte"] = "50"
    return await tmdb_fetch(f"/discover/{media_type}", params)

@app.get("/api/tmdb/providers/{media_type}")
async def tmdb_watch_providers(media_type: str):
    return await tmdb_fetch(f"/watch/providers/{media_type}", {"watch_region": "FR"})

@app.get("/api/tmdb/similar/movies/{movie_id}")
async def tmdb_similar_movies(movie_id: int):
    return await tmdb_fetch(f"/movie/{movie_id}/similar")

@app.get("/api/tmdb/similar/tv/{tv_id}")
async def tmdb_similar_tv(tv_id: int):
    return await tmdb_fetch(f"/tv/{tv_id}/similar")

@app.get("/api/tmdb/collection/{collection_id}")
async def tmdb_collection(collection_id: int):
    return await tmdb_fetch(f"/collection/{collection_id}")

@app.get("/api/tmdb/person/{person_id}")
async def tmdb_person(person_id: int):
    return await tmdb_fetch(f"/person/{person_id}", {"append_to_response": "movie_credits,tv_credits,images"})

@app.get("/api/tmdb/person/{person_id}/credits")
async def tmdb_person_credits(person_id: int):
    return await tmdb_fetch(f"/person/{person_id}/combined_credits")

@app.get("/api/tmdb/popular/persons")
async def tmdb_popular_persons(page: int = 1):
    return await tmdb_fetch("/person/popular", {"page": str(page)})

@app.get("/api/tmdb/collections/search")
async def tmdb_search_collections(q: str, page: int = 1):
    return await tmdb_fetch("/search/collection", {"query": q, "page": str(page)})

@app.get("/api/tmdb/on-the-air")
async def tmdb_on_the_air(page: int = 1):
    return await tmdb_fetch("/tv/on_the_air", {"page": str(page)})

@app.get("/api/tmdb/upcoming/tv")
async def tmdb_upcoming_tv(page: int = 1):
    return await tmdb_fetch("/tv/on_the_air", {"page": str(page)})

# ==================== FAVORITES ====================
@app.get("/api/user/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"favorites": favs}

@app.post("/api/user/favorites")
async def toggle_favorite(req: FavoriteToggle, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["_id"], "content_id": req.content_id, "content_type": req.content_type})
    if existing:
        await db.favorites.delete_one({"_id": existing["_id"]})
        return {"action": "removed", "is_favorite": False}
    await db.favorites.insert_one({
        "user_id": user["_id"],
        "content_id": req.content_id,
        "content_type": req.content_type,
        "title": req.title,
        "poster_path": req.poster_path,
        "metadata": req.metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"action": "added", "is_favorite": True}

@app.get("/api/user/favorites/check")
async def check_favorite(content_id: str = Query(...), content_type: str = Query(...), user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["_id"], "content_id": content_id, "content_type": content_type})
    if not existing:
        try:
            existing = await db.favorites.find_one({"user_id": user["_id"], "content_id": int(content_id), "content_type": content_type})
        except:
            pass
    return {"is_favorite": existing is not None}

# ==================== WATCH HISTORY ====================
@app.get("/api/user/history")
async def get_history(user: dict = Depends(get_current_user)):
    history = await db.watch_history.find({"user_id": user["_id"]}, {"_id": 0}).sort("watched_at", -1).to_list(500)
    return {"history": history}

@app.post("/api/user/history")
async def add_to_history(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    await db.watch_history.update_one(
        {"user_id": user["_id"], "content_id": body["content_id"], "content_type": body["content_type"]},
        {"$set": {
            "title": body.get("title", ""),
            "poster_path": body.get("poster_path"),
            "metadata": body.get("metadata", {}),
            "watched_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True}

@app.post("/api/user/history/batch")
async def batch_upsert_history(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    items = body.get("items", [])
    for item in items:
        await db.watch_history.update_one(
            {"user_id": user["_id"], "content_id": item["content_id"], "content_type": item["content_type"]},
            {"$set": {
                "title": item.get("title", ""),
                "poster_path": item.get("poster_path"),
                "metadata": item.get("metadata", {}),
                "watched_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    return {"success": True, "count": len(items)}

@app.delete("/api/user/history/{content_id}/{content_type}")
async def remove_from_history(content_id: int, content_type: str, user: dict = Depends(get_current_user)):
    await db.watch_history.delete_one({"user_id": user["_id"], "content_id": content_id, "content_type": content_type})
    return {"message": "Retire de l'historique"}


# ==================== PLAYLISTS ====================
@app.get("/api/playlists")
async def get_playlists(user: dict = Depends(get_current_user)):
    playlists = await db.playlists.find({"user_id": user["_id"]}).to_list(100)
    for p in playlists:
        p["_id"] = str(p["_id"])
    return {"playlists": playlists}

@app.post("/api/playlists")
async def create_playlist(req: PlaylistCreate, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["_id"],
        "username": user.get("username", "User"),
        "name": req.name,
        "description": req.description,
        "is_public": req.is_public,
        "items": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.playlists.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"playlist": doc}

@app.get("/api/playlists/{playlist_id}")
async def get_playlist(playlist_id: str):
    playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    playlist["_id"] = str(playlist["_id"])
    
    # Récupérer les infos de l'utilisateur créateur pour afficher les badges
    if playlist.get("user_id"):
        owner = await db.users.find_one({"_id": ObjectId(playlist["user_id"]) if isinstance(playlist["user_id"], str) else playlist["user_id"]})
        if owner:
            playlist["user_info"] = {
                "username": owner.get("username"),
                "is_admin": owner.get("is_admin", False),
                "is_vip": owner.get("is_vip", False),
                "is_vip_plus": owner.get("is_vip_plus", False),
                "is_uploader": owner.get("is_uploader", False)
            }
            playlist["username"] = owner.get("username")
    
    return {"playlist": playlist}

@app.put("/api/playlists/{playlist_id}/customize")
async def customize_playlist(playlist_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Personnaliser une playlist (couleurs, animations, couverture, icone, nom, description)"""
    playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id), "user_id": user["_id"]})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee ou non autorisee")
    
    data = await request.json()
    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if "color" in data:
        updates["color"] = data["color"]
    if "gradient" in data:
        updates["gradient"] = data["gradient"]
    if "animation" in data:
        updates["animation"] = data["animation"]
    if "icon" in data:
        updates["icon"] = data["icon"]
    if "name" in data and data["name"]:
        updates["name"] = data["name"]
    if "description" in data:
        updates["description"] = data["description"]
    if "is_public" in data:
        updates["is_public"] = data["is_public"]
    
    # Image de couverture (VIP uniquement)
    if "cover_url" in data:
        if data["cover_url"] and not user.get("is_vip") and not user.get("is_vip_plus") and not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Fonctionnalite reservee aux VIP")
        updates["cover_url"] = data["cover_url"]
    
    await db.playlists.update_one({"_id": ObjectId(playlist_id)}, {"$set": updates})
    return {"success": True, "message": "Playlist personnalisee"}

# Compatibilité avec l'ancien endpoint
@app.put("/api/playlists/{playlist_id}/colors")
async def update_playlist_colors(playlist_id: str, request: Request, user: dict = Depends(get_current_user)):
    return await customize_playlist(playlist_id, request, user)

@app.post("/api/playlists/{playlist_id}/items")
async def add_playlist_item(playlist_id: str, req: PlaylistItemAdd, user: dict = Depends(get_current_user)):
    playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id), "user_id": user["_id"]})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    item = {"content_id": req.content_id, "content_type": req.content_type, "title": req.title, "poster_path": req.poster_path, "metadata": req.metadata or {}, "added_at": datetime.now(timezone.utc).isoformat()}
    await db.playlists.update_one({"_id": ObjectId(playlist_id)}, {"$push": {"items": item}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@app.delete("/api/playlists/{playlist_id}/items/{content_id}")
async def remove_playlist_item(playlist_id: str, content_id: str, user: dict = Depends(get_current_user)):
    # Try both string and int match for universal content support
    await db.playlists.update_one(
        {"_id": ObjectId(playlist_id), "user_id": user["_id"]},
        {"$pull": {"items": {"content_id": content_id}}}
    )
    try:
        cid_int = int(content_id)
        await db.playlists.update_one(
            {"_id": ObjectId(playlist_id), "user_id": user["_id"]},
            {"$pull": {"items": {"content_id": cid_int}}}
        )
    except:
        pass
    return {"success": True}

@app.delete("/api/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, user: dict = Depends(get_current_user)):
    await db.playlists.delete_one({"_id": ObjectId(playlist_id), "user_id": user["_id"]})
    return {"success": True}

@app.get("/api/playlists/public/discover")
async def discover_playlists(page: int = 1):
    skip = (page - 1) * 20
    playlists = await db.playlists.find({"is_public": True}).sort("updated_at", -1).skip(skip).limit(20).to_list(20)
    for p in playlists:
        p["_id"] = str(p["_id"])
    total = await db.playlists.count_documents({"is_public": True})
    return {"playlists": playlists, "total": total}

# ==================== FEEDBACK ====================
@app.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest, request: Request, user: dict = Depends(get_optional_user)):
    doc = {
        "content": req.content,
        "functionality": req.functionality,
        "design": req.design,
        "message": req.message,
        "user_id": user["_id"] if user else None,
        "username": user.get("username") if user else "Anonyme",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feedback.insert_one(doc)
    return {"success": True}

@app.get("/api/feedback/stats")
async def get_feedback_stats():
    pipeline = [
        {"$group": {
            "_id": None,
            "content": {"$avg": "$content"},
            "functionality": {"$avg": "$functionality"},
            "design": {"$avg": "$design"},
            "totalFeedback": {"$sum": 1}
        }}
    ]
    result = await db.feedback.aggregate(pipeline).to_list(1)
    stats = result[0] if result else {"content": 0, "functionality": 0, "design": 0, "totalFeedback": 0}
    stats.pop("_id", None)
    guestbook = await db.feedback.find({"message": {"$nin": [None, ""]}}, {"_id": 0, "message": 1, "username": 1, "created_at": 1}).sort("created_at", -1).limit(20).to_list(20)
    return {"stats": stats, "guestbookMessages": guestbook}

# ==================== STAFF MESSAGES ====================
@app.post("/api/staff-messages")
async def send_staff_message(req: StaffMessageRequest, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["_id"],
        "username": user.get("username", "User"),
        "email": user.get("email"),
        "subject": req.subject,
        "message": req.message,
        "status": "pending",
        "reply": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.staff_messages.insert_one(doc)
    return {"success": True}

@app.get("/api/staff-messages")
async def get_staff_messages(user: dict = Depends(get_current_user)):
    if user.get("is_admin"):
        messages = await db.staff_messages.find().sort("created_at", -1).to_list(100)
    else:
        messages = await db.staff_messages.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(100)
    for m in messages:
        m["_id"] = str(m["_id"])
    return {"messages": messages}

@app.post("/api/staff-messages/reply")
async def reply_staff_message(request: Request, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    body = await request.json()
    await db.staff_messages.update_one(
        {"_id": ObjectId(body["message_id"])},
        {"$set": {"reply": body["reply"], "status": "replied", "replied_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

# ==================== CONTENT REQUESTS ====================
@app.post("/api/content-requests")
async def create_content_request(req: ContentRequestModel, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["_id"],
        "username": user.get("username", "User"),
        "title": req.title,
        "content_type": req.content_type,
        "description": req.description,
        "votes": 0,
        "voters": [],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.content_requests.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"request": doc}

@app.get("/api/content-requests")
async def get_content_requests(status: str = "all"):
    query = {} if status == "all" else {"status": status}
    requests = await db.content_requests.find(query).sort("votes", -1).to_list(100)
    for r in requests:
        r["_id"] = str(r["_id"])
    return {"requests": requests}

@app.post("/api/content-requests/votes")
async def vote_content_request(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    req_id = body["request_id"]
    cr = await db.content_requests.find_one({"_id": ObjectId(req_id)})
    if not cr:
        raise HTTPException(status_code=404, detail="Request not found")
    if user["_id"] in cr.get("voters", []):
        return {"success": False, "message": "Deja vote"}
    await db.content_requests.update_one(
        {"_id": ObjectId(req_id)},
        {"$inc": {"votes": 1}, "$push": {"voters": user["_id"]}}
    )
    return {"success": True}

# ==================== ADMIN ====================
@app.get("/api/admin/users")
async def admin_get_users(user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    users = await db.users.find({}, {"password_hash": 0}).to_list(500)
    for u in users:
        u["_id"] = str(u["_id"])
    return {"users": users}

@app.put("/api/admin/users/{user_id}")
async def admin_update_user(user_id: str, req: UserRoleUpdate, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    update = {}
    if req.role is not None:
        update["role"] = req.role
    if req.is_vip is not None:
        update["is_vip"] = req.is_vip
    if req.is_vip_plus is not None:
        update["is_vip_plus"] = req.is_vip_plus
    if req.is_admin is not None:
        update["is_admin"] = req.is_admin
    if req.is_uploader is not None:
        update["is_uploader"] = req.is_uploader
    if update:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    return {"success": True}

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"success": True}

@app.get("/api/admin/stats")
async def admin_stats(user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    total_users = await db.users.count_documents({})
    vip_users = await db.users.count_documents({"is_vip": True})
    total_feedback = await db.feedback.count_documents({})
    total_requests = await db.content_requests.count_documents({})
    total_playlists = await db.playlists.count_documents({})
    return {
        "total_users": total_users,
        "vip_users": vip_users,
        "total_feedback": total_feedback,
        "total_requests": total_requests,
        "total_playlists": total_playlists
    }

@app.get("/api/admin/site-settings/{key}")
async def get_site_setting(key: str):
    setting = await db.site_settings.find_one({"setting_key": key}, {"_id": 0})
    if not setting:
        return {"setting_key": key, "setting_value": {}}
    return setting

@app.put("/api/admin/site-settings")
async def update_site_setting(req: SiteSettingUpdate, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    await db.site_settings.update_one(
        {"setting_key": req.setting_key},
        {"$set": {"setting_value": req.setting_value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"success": True}

# ==================== USER PROFILE ====================
@app.put("/api/user/profile")
async def update_profile(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    allowed_fields = ["username", "show_adult_content", "avatar_url", "bio", "location",
                      "birth_date", "auto_mark_watched", "hide_spoilers", "hide_watched_content",
                      "allow_messages"]
    update = {k: body[k] for k in allowed_fields if k in body}
    if update:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return {"user": updated}

@app.put("/api/user/change-password")
async def change_password(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    new_password = body.get("new_password", "")
    validate_password_strength(new_password)
    full_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    current = body.get("current_password", "")
    if current and not verify_password(current, full_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"password_hash": hash_password(new_password)}})
    return {"message": "Mot de passe modifie"}

@app.post("/api/user/remove-privileges")
async def remove_privileges(request: Request, user: dict = Depends(get_current_user)):
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {
        "is_vip": False, "is_vip_plus": False, "is_admin": False, "is_uploader": False, "is_beta": False
    }})
    return {"message": "Privileges supprimes"}

@app.delete("/api/user/account")
async def delete_account(user: dict = Depends(get_current_user)):
    uid = user["_id"]
    await db.favorites.delete_many({"user_id": uid})
    await db.watch_history.delete_many({"user_id": uid})
    await db.playlists.delete_many({"user_id": uid})
    await db.user_ratings.delete_many({"user_id": uid})
    await db.users.delete_one({"_id": ObjectId(uid)})
    return {"message": "Compte supprime"}

# --- Online users tracking ---
@app.post("/api/user/heartbeat")
async def user_heartbeat(user: dict = Depends(get_current_user)):
    await db.online_users.update_one(
        {"user_id": user["_id"]},
        {"$set": {"user_id": user["_id"], "username": user.get("username"), "last_seen": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"ok": True}

@app.get("/api/admin/online-users")
async def get_online_users(user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin requis")
    cutoff_5min = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    cutoff_1h = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    cutoff_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    online_now = await db.online_users.count_documents({"last_seen": {"$gte": cutoff_5min}})
    last_hour = await db.online_users.count_documents({"last_seen": {"$gte": cutoff_1h}})
    last_24h = await db.online_users.count_documents({"last_seen": {"$gte": cutoff_24h}})
    return {"online_now": online_now, "last_hour": last_hour, "last_24h": last_24h}

# --- Admin edit user full form ---
@app.get("/api/admin/users/{user_id}")
async def get_single_user(user_id: str, admin: dict = Depends(get_current_user)):
    if not admin.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin requis")
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    u["_id"] = str(u["_id"])
    return u

# --- User favorites and history batch check for ContentCard overlays ---
@app.get("/api/user/status-batch")
async def get_user_status_batch(user: dict = Depends(get_current_user)):
    uid = user["_id"]
    favorites = await db.favorites.find({"user_id": uid}, {"content_id": 1, "content_type": 1, "_id": 0}).to_list(5000)
    history = await db.watch_history.find({"user_id": uid}, {"content_id": 1, "content_type": 1, "_id": 0}).to_list(5000)
    fav_set = [{"id": f["content_id"], "type": f["content_type"]} for f in favorites]
    watched_set = [{"id": h["content_id"], "type": h["content_type"]} for h in history]
    return {"favorites": fav_set, "watched": watched_set}

@app.get("/api/user/stats")
async def get_user_stats(user: dict = Depends(get_current_user)):
    fav_count = await db.favorites.count_documents({"user_id": user["_id"]})
    history_count = await db.watch_history.count_documents({"user_id": user["_id"]})
    playlist_count = await db.playlists.count_documents({"user_id": user["_id"]})
    return {"favorites": fav_count, "watched": history_count, "playlists": playlist_count}

# ==================== TV CHANNELS / RADIO ====================
@app.get("/api/tv-channels")
async def get_tv_channels():
    channels = await db.tv_channels.find().to_list(500)
    for c in channels:
        c["_id"] = str(c["_id"])
        c.setdefault("likes", 0)
        c.setdefault("dislikes", 0)
    return {"channels": channels}

@app.get("/api/radio-stations")
async def get_radio_stations():
    stations = await db.radio_stations.find().to_list(500)
    for s in stations:
        s["_id"] = str(s["_id"])
        s.setdefault("likes", 0)
        s.setdefault("dislikes", 0)
    return {"stations": stations}

# ---- Votes (likes / dislikes) on TV channels and radio ----
async def _toggle_vote(collection_name: str, item_id: str, user_id: str, vote: str):
    """vote in {'like','dislike','none'}. Returns final counts."""
    col = db[collection_name]
    votes_col = db.media_votes  # stores {user_id, target_collection, target_id, vote}
    key = {"user_id": user_id, "target_collection": collection_name, "target_id": item_id}
    existing = await votes_col.find_one(key)
    prev = existing.get("vote") if existing else None
    # If same vote -> remove
    if prev == vote:
        await votes_col.delete_one(key)
        new_vote = None
    else:
        await votes_col.update_one(key, {"$set": {**key, "vote": vote, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        new_vote = vote
    # Recompute inc deltas
    inc = {}
    if prev == "like":
        inc["likes"] = inc.get("likes", 0) - 1
    if prev == "dislike":
        inc["dislikes"] = inc.get("dislikes", 0) - 1
    if new_vote == "like":
        inc["likes"] = inc.get("likes", 0) + 1
    if new_vote == "dislike":
        inc["dislikes"] = inc.get("dislikes", 0) + 1
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": item_id}
    if inc:
        await col.update_one(query, {"$inc": inc})
    doc = await col.find_one(query)
    return {
        "likes": int((doc or {}).get("likes", 0)),
        "dislikes": int((doc or {}).get("dislikes", 0)),
        "user_vote": new_vote,
    }

class VoteRequest(BaseModel):
    vote: str  # "like" or "dislike"

@app.post("/api/tv-channels/{channel_id}/vote")
async def vote_tv_channel(channel_id: str, req: VoteRequest, user: dict = Depends(get_current_user)):
    if req.vote not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="Vote invalide")
    return await _toggle_vote("tv_channels", channel_id, user["_id"], req.vote)

@app.post("/api/radio-stations/{station_id}/vote")
async def vote_radio_station(station_id: str, req: VoteRequest, user: dict = Depends(get_current_user)):
    if req.vote not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="Vote invalide")
    return await _toggle_vote("radio_stations", station_id, user["_id"], req.vote)

@app.get("/api/media-votes/mine")
async def get_my_media_votes(user: dict = Depends(get_current_user)):
    """Return current user's votes on tv_channels and radio_stations."""
    votes = await db.media_votes.find({"user_id": user["_id"]}, {"_id": 0}).to_list(2000)
    return {"votes": votes}

# ==================== INFO BANNER (homepage) ====================
@app.get("/api/info-banner")
async def get_info_banner():
    """Public endpoint - returns active info panel configuration."""
    setting = await db.site_settings.find_one({"setting_key": "info_banner"}, {"_id": 0})
    banner = (setting or {}).get("setting_value") or {}
    if not banner.get("enabled"):
        return {"banner": None}
    # Must have at least some content to render
    if not any([banner.get("title"), banner.get("subtitle"), banner.get("message"), banner.get("image_url")]):
        return {"banner": None}
    return {"banner": banner}

class InfoBannerUpdate(BaseModel):
    enabled: bool = False
    title: Optional[str] = ""
    subtitle: Optional[str] = ""
    badge: Optional[str] = ""
    message: Optional[str] = ""
    variant: Optional[str] = "info"  # info | success | warning | danger | promo | announce
    image_url: Optional[str] = ""
    tags: Optional[List[str]] = None
    link_url: Optional[str] = ""
    link_label: Optional[str] = ""
    link2_url: Optional[str] = ""
    link2_label: Optional[str] = ""
    footer_text: Optional[str] = ""
    dismissible: Optional[bool] = True
    version: Optional[int] = 1  # bump to force re-show

@app.put("/api/admin/info-banner")
async def update_info_banner(req: InfoBannerUpdate, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    value = req.model_dump()
    # Bump version when content changes or enabling
    existing = await db.site_settings.find_one({"setting_key": "info_banner"})
    prev = (existing or {}).get("setting_value") or {}
    content_changed = any(prev.get(k) != value.get(k) for k in ("title", "subtitle", "badge", "message", "variant", "image_url", "tags", "link_url", "link_label", "link2_url", "link2_label", "footer_text"))
    prev_version = int(prev.get("version", 0) or 0)
    if content_changed or (not prev.get("enabled") and value.get("enabled")):
        value["version"] = prev_version + 1
    else:
        # Preserve highest version (never downgrade)
        value["version"] = max(int(value.get("version") or 0), prev_version, 1)
    await db.site_settings.update_one(
        {"setting_key": "info_banner"},
        {"$set": {"setting_value": value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"success": True, "banner": value}

@app.get("/api/admin/info-banner")
async def get_info_banner_admin(user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    setting = await db.site_settings.find_one({"setting_key": "info_banner"}, {"_id": 0})
    banner = (setting or {}).get("setting_value") or {"enabled": False, "title": "", "subtitle": "", "badge": "", "message": "", "variant": "info", "image_url": "", "tags": [], "link_url": "", "link_label": "", "link2_url": "", "link2_label": "", "footer_text": "", "dismissible": True, "version": 1}
    return {"banner": banner}

# ==================== EBOOKS / SOFTWARE ====================
@app.get("/api/ebooks")
async def get_ebooks(page: int = 1, category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    skip = (page - 1) * 20
    ebooks = await db.ebooks.find(query).sort("created_at", -1).skip(skip).limit(20).to_list(20)
    for e in ebooks:
        e["_id"] = str(e["_id"])
    total = await db.ebooks.count_documents(query)
    if not ebooks:
        ebooks = [
            {"id": 1, "title": "Le Petit Prince", "author": "Antoine de Saint-Exupery", "cover": "/placeholder.svg?height=400&width=300", "category": "Classique", "description": "Un classique de la litterature francaise.", "reading_url": ""},
            {"id": 2, "title": "Les Miserables", "author": "Victor Hugo", "cover": "/placeholder.svg?height=400&width=300", "category": "Classique", "description": "Le chef-d'oeuvre de Victor Hugo.", "reading_url": ""},
            {"id": 3, "title": "Dune", "author": "Frank Herbert", "cover": "/placeholder.svg?height=400&width=300", "category": "Science-Fiction", "description": "Le roman de science-fiction le plus vendu au monde.", "reading_url": ""},
        ]
        total = len(ebooks)
    return {"ebooks": ebooks, "total": total}

@app.get("/api/software")
async def get_software(page: int = 1, category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    skip = (page - 1) * 20
    software = await db.software.find(query).sort("created_at", -1).skip(skip).limit(20).to_list(20)
    for s in software:
        s["_id"] = str(s["_id"])
    total = await db.software.count_documents(query)
    if not software:
        software = [
            {"id": 1, "name": "VLC Media Player", "version": "3.0.20", "icon": "/placeholder.svg?height=100&width=100", "category": "Multimedia", "description": "Lecteur multimedia libre et open source.", "download_url": "https://www.videolan.org/vlc/", "platform": "Windows, Mac, Linux"},
            {"id": 2, "name": "LibreOffice", "version": "7.6", "icon": "/placeholder.svg?height=100&width=100", "category": "Bureautique", "description": "Suite bureautique libre.", "download_url": "https://fr.libreoffice.org/", "platform": "Windows, Mac, Linux"},
            {"id": 3, "name": "GIMP", "version": "2.10", "icon": "/placeholder.svg?height=100&width=100", "category": "Graphisme", "description": "Editeur d'images libre.", "download_url": "https://www.gimp.org/", "platform": "Windows, Mac, Linux"},
        ]
        total = len(software)
    return {"software": software, "total": total}

# ==================== VIP GAME ====================
@app.get("/api/vip-game/status")
async def vip_game_status(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    played = await db.vip_games.find_one({"user_id": user["_id"], "date": today})
    return {"played_today": played is not None, "won": played.get("won", False) if played else False}

@app.post("/api/vip-game/play")
async def play_vip_game(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    played = await db.vip_games.find_one({"user_id": user["_id"], "date": today})
    if played:
        raise HTTPException(status_code=400, detail="Vous avez deja joue aujourd'hui")
    import random
    won = random.random() < 0.05  # 5% chance
    result = {"user_id": user["_id"], "date": today, "won": won, "played_at": datetime.now(timezone.utc).isoformat()}
    await db.vip_games.insert_one(result)
    if won:
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$set": {"is_vip": True, "vip_expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()}}
        )
    return {"won": won, "message": "Felicitations ! Vous avez gagne le VIP pour 30 jours !" if won else "Pas de chance aujourd'hui, reessayez demain !"}

@app.get("/api/vip-game/winners")
async def vip_game_winners():
    winners = await db.vip_games.find({"won": True}).sort("played_at", -1).limit(10).to_list(10)
    result = []
    for w in winners:
        user = await db.users.find_one({"_id": ObjectId(w["user_id"]) if isinstance(w["user_id"], str) else w["user_id"]}, {"username": 1})
        result.append({"username": user.get("username", "Anonyme") if user else "Anonyme", "date": w["date"]})
    return {"winners": result}

# ==================== RETROGAMING SOURCES ====================
@app.get("/api/retrogaming")
async def get_retrogaming():
    sources = await db.retrogaming_sources.find().to_list(500)
    for s in sources:
        s["_id"] = str(s["_id"])
    # Also check old collection name
    if not sources:
        sources = await db.retrogaming.find().to_list(500)
        for s in sources:
            s["_id"] = str(s["_id"])
    return {"sources": sources, "games": sources}

# ==================== DOWNLOAD LINKS (Supabase WWembed) ====================
# Service role key stays on the backend. Frontend NEVER sees Supabase.

async def _supabase_get(path: str, params: dict = None):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=503, detail="Supabase non configuré")
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }
    url = f"{SUPABASE_URL}/rest/v1{path}"
    async with httpx.AsyncClient(timeout=15) as hc:
        r = await hc.get(url, headers=headers, params=params or {})
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Supabase error {r.status_code}")
        return r.json()

# Small TMDB enrichment cache (in-memory, 10 min)
_tmdb_cache: dict[str, tuple[float, dict]] = {}
async def _tmdb_meta(tmdb_id: int, media_type: str):
    import time
    key = f"{media_type}:{tmdb_id}"
    now = time.time()
    cached = _tmdb_cache.get(key)
    if cached and (now - cached[0] < 600):
        return cached[1]
    if media_type not in ("movie", "tv") or not tmdb_id:
        return {}
    try:
        data = await tmdb_fetch(f"/{media_type}/{tmdb_id}")
        meta = {
            "title": data.get("title") or data.get("name") or "",
            "poster_path": data.get("poster_path"),
            "backdrop_path": data.get("backdrop_path"),
            "vote_average": data.get("vote_average"),
            "release_date": data.get("release_date") or data.get("first_air_date"),
            "overview": data.get("overview"),
        }
        _tmdb_cache[key] = (now, meta)
        return meta
    except Exception:
        return {}

async def _enrich_links(items: list) -> list:
    """Attach TMDB poster/title to each download link."""
    import asyncio
    unique = {}
    for it in items:
        tid = it.get("tmdb_id"); mt = it.get("media_type")
        if tid and mt and (tid, mt) not in unique:
            unique[(tid, mt)] = None
    # Fetch in parallel
    async def fetch_one(tid, mt):
        unique[(tid, mt)] = await _tmdb_meta(tid, mt)
    await asyncio.gather(*[fetch_one(t, m) for (t, m) in unique.keys()])
    for it in items:
        meta = unique.get((it.get("tmdb_id"), it.get("media_type")), {}) or {}
        it["title"] = meta.get("title") or it.get("release_name") or it.get("ww_id") or ""
        it["poster_path"] = meta.get("poster_path")
        it["backdrop_path"] = meta.get("backdrop_path")
        it["vote_average"] = meta.get("vote_average")
    return items

def _download_link_filters(quality: Optional[str] = None, media_type: Optional[str] = None,
                           language: Optional[str] = None, q: Optional[str] = None):
    """Build PostgREST filter params."""
    params = {
        "is_active": "eq.true",
        "is_valid": "eq.true",
        "status": "eq.approved",
    }
    if quality:
        params["quality"] = f"eq.{quality}"
    if media_type and media_type in ("movie", "tv"):
        params["media_type"] = f"eq.{media_type}"
    if language:
        params["language"] = f"eq.{language}"
    if q:
        # Search in release_name or source_name
        params["or"] = f"(release_name.ilike.*{q}*,source_name.ilike.*{q}*,ww_id.ilike.*{q}*)"
    return params

@app.get("/api/download-links/recent")
async def get_recent_download_links(limit: int = 12):
    """Return the N most recent UNIQUE (tmdb_id, media_type) download links, enriched with TMDB poster."""
    limit = max(1, min(int(limit or 12), 50))
    # Fetch more than limit to allow deduplication, order by created_at desc
    params = _download_link_filters()
    params["select"] = "tmdb_id,media_type,ww_id,source_name,quality,resolution,language,release_name,season_number,episode_number,codec_video,codec_audio,subtitle,created_at"
    params["order"] = "created_at.desc"
    params["limit"] = str(limit * 5)
    rows = await _supabase_get("/download_links", params)
    # Deduplicate by (tmdb_id, media_type), keep first (most recent)
    seen = set()
    unique_items = []
    for r in rows:
        k = (r.get("tmdb_id"), r.get("media_type"))
        if k in seen:
            continue
        seen.add(k)
        unique_items.append(r)
        if len(unique_items) >= limit:
            break
    await _enrich_links(unique_items)
    return {"items": unique_items, "count": len(unique_items)}

# ---- Cached Supabase full-fetch loop (for grouping) ----
_dl_cache: dict = {}
async def _fetch_all_download_links(filter_params: dict, max_rows: int = 20000):
    """Fetch ALL matching rows via Supabase with pagination. Returns list of dicts."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    all_rows: list = []
    page_size = 1000
    offset = 0
    base_qs = "&".join([f"{k}={v}" for k, v in filter_params.items()])
    async with httpx.AsyncClient(timeout=30) as hc:
        while offset < max_rows:
            url = f"{SUPABASE_URL}/rest/v1/download_links?{base_qs}"
            r = await hc.get(url, headers={**headers, "Range-Unit": "items", "Range": f"{offset}-{offset + page_size - 1}"})
            if r.status_code >= 400:
                break
            batch = r.json()
            if not batch:
                break
            all_rows.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size
    return all_rows

def _compress_range(sorted_nums: list) -> str:
    """Return compressed representation: [1,2,3,5,6,7,10] -> 'E1-3, E5-7, E10'."""
    if not sorted_nums:
        return ""
    runs = []
    start = prev = sorted_nums[0]
    for n in sorted_nums[1:]:
        if n == prev + 1:
            prev = n
        else:
            runs.append((start, prev))
            start = prev = n
    runs.append((start, prev))
    parts = []
    for a, b in runs:
        parts.append(f"E{a}" if a == b else f"E{a}-{b}")
    return ", ".join(parts)

@app.get("/api/download-links/media-types")
async def list_media_types():
    """Return distinct media_type values from Supabase for the filter dropdown."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"types": []}
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    async with httpx.AsyncClient(timeout=15) as hc:
        # Fetch only the media_type column for all rows, distinct in Python
        r = await hc.get(f"{SUPABASE_URL}/rest/v1/download_links?select=media_type&is_active=eq.true&is_valid=eq.true&status=eq.approved", headers={**headers, "Range-Unit": "items", "Range": "0-20000"})
        if r.status_code >= 400:
            return {"types": []}
        data = r.json() or []
    types = sorted({(d.get("media_type") or "").strip() for d in data if d.get("media_type")})
    return {"types": types}

@app.get("/api/download-links")
async def list_download_links(
    page: int = 1,
    limit: int = 24,
    quality: Optional[str] = None,
    media_type: Optional[str] = None,
    language: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = "created_at.desc",
    uploader: Optional[str] = None,
    group: bool = True,
):
    """Full paginated list. When group=True (default), TV episodes from same (show, season) are merged into one entry with episode range."""
    page = max(1, int(page or 1))
    limit = max(1, min(int(limit or 24), 60))
    params = _download_link_filters(quality=quality, media_type=media_type, language=language, q=q)
    if uploader:
        params["select"] = "id,tmdb_id,media_type,ww_id,source_name,source_url,quality,resolution,language,release_name,season_number,episode_number,codec_video,codec_audio,subtitle,file_size,is_verified,created_at,submitted_by,profiles!inner(username,role)"
        params["profiles.username"] = f"eq.{uploader}"
    else:
        params["select"] = "id,tmdb_id,media_type,ww_id,source_name,source_url,quality,resolution,language,release_name,season_number,episode_number,codec_video,codec_audio,subtitle,file_size,is_verified,created_at,submitted_by,profiles(username,role)"
    if sort not in ("created_at.desc", "created_at.asc", "profiles(username).asc", "profiles(username).desc", "quality.asc", "quality.desc"):
        sort = "created_at.desc"
    params["order"] = sort

    # Fetch all matching rows (cached briefly per filter combination)
    import time, hashlib, json as _json
    cache_key = hashlib.md5(_json.dumps(params, sort_keys=True).encode()).hexdigest() + f":group={group}"
    now = time.time()
    cached = _dl_cache.get(cache_key)
    if cached and now - cached[0] < 30:
        groups = cached[1]
    else:
        rows = await _fetch_all_download_links(params)
        # Flatten profile
        for r in rows:
            prof = r.pop("profiles", None) or {}
            r["uploader_username"] = prof.get("username") or "Anonyme"
            r["uploader_role"] = prof.get("role") or "user"

        if group:
            # Group TV by (tmdb_id, season_number); movies stay individual
            grouped: dict = {}
            order_counter = 0
            for r in rows:
                mt = r.get("media_type")
                tid = r.get("tmdb_id")
                if mt == "tv" and r.get("season_number") is not None:
                    key = ("tv", tid, r["season_number"])
                else:
                    # Each movie (or tv without season) is its own group, still unique by row
                    key = (mt, tid, r.get("id"))
                g = grouped.get(key)
                if not g:
                    g = {
                        "key": str(key),
                        "group_type": "tv_season" if key[0] == "tv" else "movie",
                        "tmdb_id": tid,
                        "media_type": mt,
                        "season_number": r.get("season_number"),
                        "episode_numbers": set(),
                        "items": [],
                        "latest_created_at": r.get("created_at"),
                        "earliest_created_at": r.get("created_at"),
                        "qualities": set(),
                        "languages": set(),
                        "uploaders": set(),
                        "uploader_roles": {},
                        "resolutions": set(),
                        "_order": order_counter,
                    }
                    grouped[key] = g
                    order_counter += 1
                g["items"].append(r)
                if r.get("episode_number") is not None:
                    g["episode_numbers"].add(r["episode_number"])
                if r.get("quality"):
                    g["qualities"].add(r["quality"])
                if r.get("language"):
                    g["languages"].add(r["language"])
                if r.get("uploader_username"):
                    g["uploaders"].add(r["uploader_username"])
                    g["uploader_roles"][r["uploader_username"]] = r.get("uploader_role", "user")
                if r.get("resolution"):
                    g["resolutions"].add(r["resolution"])
                if r.get("created_at") and r["created_at"] > g["latest_created_at"]:
                    g["latest_created_at"] = r["created_at"]
                if r.get("created_at") and r["created_at"] < g["earliest_created_at"]:
                    g["earliest_created_at"] = r["created_at"]

            # Serialize groups
            results = []
            for g in grouped.values():
                eps_sorted = sorted(g["episode_numbers"])
                sample = g["items"][0]
                # Pick the most represented uploader
                top_uploader = max(g["uploaders"], key=lambda u: sum(1 for it in g["items"] if it.get("uploader_username") == u)) if g["uploaders"] else "Anonyme"
                results.append({
                    "key": g["key"],
                    "group_type": g["group_type"],
                    "tmdb_id": g["tmdb_id"],
                    "media_type": g["media_type"],
                    "season_number": g["season_number"],
                    "episode_count": len(eps_sorted),
                    "episode_range": _compress_range(eps_sorted) if eps_sorted else None,
                    "episode_min": eps_sorted[0] if eps_sorted else None,
                    "episode_max": eps_sorted[-1] if eps_sorted else None,
                    "qualities": sorted(g["qualities"]),
                    "languages": sorted(g["languages"]),
                    "resolutions": sorted(g["resolutions"]),
                    "uploader_username": top_uploader,
                    "uploader_role": g["uploader_roles"].get(top_uploader, "user"),
                    "uploaders_count": len(g["uploaders"]),
                    "latest_created_at": g["latest_created_at"],
                    "earliest_created_at": g["earliest_created_at"],
                    # Keep a representative item for fallback display
                    "id": sample.get("id"),
                    "ww_id": sample.get("ww_id"),
                    "source_name": sample.get("source_name"),
                    "source_url": sample.get("source_url"),
                    "release_name": sample.get("release_name"),
                    "created_at": g["latest_created_at"],
                    "quality": sorted(g["qualities"])[0] if g["qualities"] else None,
                    "resolution": sorted(g["resolutions"])[0] if g["resolutions"] else None,
                    "language": sorted(g["languages"])[0] if g["languages"] else None,
                    "_order": g["_order"],
                })
            # Sort groups: keep original row order (most recent first)
            results.sort(key=lambda x: x["_order"])
            for r in results:
                r.pop("_order", None)
            groups = results
        else:
            groups = rows
        _dl_cache[cache_key] = (now, groups)

    total = len(groups)
    start = (page - 1) * limit
    page_items = groups[start:start + limit]
    # Enrich only the page items
    await _enrich_links(page_items)
    return {"items": page_items, "page": page, "limit": limit, "total": total, "has_more": start + limit < total, "grouped": group}

@app.get("/api/download-links/uploaders")
async def list_uploaders():
    """Return list of unique uploaders with their submission count, for filter dropdown."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"uploaders": []}
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    async with httpx.AsyncClient(timeout=20) as hc:
        # Get all profiles that have at least one upload
        r = await hc.get(f"{SUPABASE_URL}/rest/v1/profiles?select=username,role&role=in.(uploader,admin)&order=username.asc", headers=headers)
        if r.status_code >= 400:
            return {"uploaders": []}
        profiles = r.json() or []
    return {"uploaders": [{"username": p.get("username"), "role": p.get("role")} for p in profiles if p.get("username")]}

@app.get("/api/download-links/for-content")
async def get_links_for_content(tmdb_id: int, media_type: str, season: Optional[int] = None, episode: Optional[int] = None):
    """All download links for a specific TMDB content (used on movie/tv detail page)."""
    if media_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type invalide")
    params = _download_link_filters(media_type=media_type)
    params["tmdb_id"] = f"eq.{tmdb_id}"
    if season is not None:
        params["season_number"] = f"eq.{season}"
    if episode is not None:
        params["episode_number"] = f"eq.{episode}"
    params["order"] = "created_at.desc"
    params["limit"] = "100"
    rows = await _supabase_get("/download_links", params)
    return {"items": rows, "count": len(rows)}

# ---- Admin : download links module config ----
class DownloadLinksModuleConfig(BaseModel):
    enabled: bool = True
    title: Optional[str] = "Derniers liens de téléchargement"
    subtitle: Optional[str] = ""
    limit: Optional[int] = 12
    show_quality_badge: Optional[bool] = True

@app.get("/api/download-links/config")
async def get_download_links_config():
    setting = await db.site_settings.find_one({"setting_key": "download_links_module"}, {"_id": 0})
    cfg = (setting or {}).get("setting_value") or {"enabled": True, "title": "Derniers liens de téléchargement", "subtitle": "", "limit": 12, "show_quality_badge": True}
    return {"config": cfg}

@app.put("/api/admin/download-links/config")
async def update_download_links_config(req: DownloadLinksModuleConfig, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    value = req.model_dump()
    value["limit"] = max(4, min(int(value.get("limit") or 12), 30))
    await db.site_settings.update_one(
        {"setting_key": "download_links_module"},
        {"$set": {"setting_value": value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"success": True, "config": value}

@app.get("/api/admin/download-links/stats")
async def admin_download_links_stats(user: dict = Depends(get_current_user)):
    """Quick admin stats: total links, by media_type, last 24h count."""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    # Use Supabase count via head+prefer count=exact
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=503, detail="Supabase non configuré")
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Prefer": "count=exact",
        "Range-Unit": "items",
        "Range": "0-0",
    }
    async with httpx.AsyncClient(timeout=15) as hc:
        r_total = await hc.get(f"{SUPABASE_URL}/rest/v1/download_links?is_active=eq.true&is_valid=eq.true", headers=headers)
        total = int(r_total.headers.get("content-range", "*/0").split("/")[-1] or 0)
        # Last 24h
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        r_24h = await hc.get(f"{SUPABASE_URL}/rest/v1/download_links?is_active=eq.true&created_at=gte.{cutoff}", headers=headers)
        last_24h = int(r_24h.headers.get("content-range", "*/0").split("/")[-1] or 0)
    return {"total": total, "last_24h": last_24h}

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "WaveWatch", "version": "2026"}


# ==================== UNIVERSAL SEARCH ====================
@app.get("/api/search/all")
async def universal_search(q: str = ""):
    if not q or len(q) < 2:
        return {"results": []}
    results = []
    regex = {"$regex": q, "$options": "i"}
    
    # Search TV channels
    channels = await db.tv_channels.find({"$or": [{"name": regex}, {"category": regex}, {"country": regex}]}).to_list(20)
    for c in channels:
        results.append({
            "type": "tv_channel", 
            "title": c.get("name"), 
            "subtitle": c.get("category", ""),
            "image": c.get("logo_url"),
            "_id": str(c["_id"]),
            "data": {**c, "_id": str(c["_id"])}
        })
    
    # Search music
    music = await db.music_content.find({"$or": [{"title": regex}, {"artist": regex}, {"genre": regex}], "is_active": {"$ne": False}}).to_list(20)
    for m in music:
        results.append({
            "type": "music", 
            "title": m.get("title"), 
            "subtitle": m.get("artist", ""),
            "image": m.get("thumbnail_url"),
            "_id": str(m["_id"]),
            "data": {**m, "_id": str(m["_id"])}
        })
    
    # Search games
    games = await db.games.find({"$or": [{"title": regex}, {"genre": regex}, {"developer": regex}], "is_active": {"$ne": False}}).to_list(20)
    for g in games:
        results.append({
            "type": "game", 
            "title": g.get("title"), 
            "subtitle": g.get("genre", ""),
            "image": g.get("cover_url"),
            "_id": str(g["_id"]),
            "data": {**g, "_id": str(g["_id"])}
        })
    
    # Search software
    software = await db.software.find({"$or": [{"name": regex}, {"category": regex}, {"developer": regex}], "is_active": {"$ne": False}}).to_list(20)
    for s in software:
        results.append({
            "type": "software", 
            "title": s.get("name"), 
            "subtitle": s.get("category", ""),
            "image": s.get("icon_url"),
            "_id": str(s["_id"]),
            "data": {**s, "_id": str(s["_id"])}
        })
    
    # Search ebooks
    ebooks = await db.ebooks.find({"$or": [{"title": regex}, {"author": regex}, {"category": regex}], "is_active": {"$ne": False}}).to_list(20)
    for e in ebooks:
        results.append({
            "type": "ebook", 
            "title": e.get("title"), 
            "subtitle": e.get("author", ""),
            "image": e.get("cover_url"),
            "_id": str(e["_id"]),
            "data": {**e, "_id": str(e["_id"])}
        })
    
    # Search radio stations
    radios = await db.radio_stations.find({"$or": [{"name": regex}, {"genre": regex}]}).to_list(20)
    for r in radios:
        results.append({
            "type": "radio", 
            "title": r.get("name"), 
            "subtitle": r.get("genre", ""),
            "image": r.get("logo_url"),
            "_id": str(r["_id"]),
            "data": {**r, "_id": str(r["_id"])}
        })
    
    return {"results": results}

# ==================== SERIES MARK ALL WATCHED ====================
@app.post("/api/user/history/series/{series_id}/mark-all")
async def mark_series_all_watched(series_id: int, user: dict = Depends(get_current_user)):
    tmdb_key = os.environ.get("TMDB_API_KEY")
    if not tmdb_key:
        raise HTTPException(status_code=500, detail="TMDB key missing")
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://api.themoviedb.org/3/tv/{series_id}?api_key={tmdb_key}&language=fr-FR", timeout=10.0)
        show = resp.json()
        show_name = show.get("name", "")
        poster = show.get("poster_path", "")
        entries = []
        for season in show.get("seasons", []):
            snum = season.get("season_number", 0)
            if snum == 0:
                continue
            season_resp = await client.get(f"https://api.themoviedb.org/3/tv/{series_id}/season/{snum}?api_key={tmdb_key}&language=fr-FR", timeout=10.0)
            season_data = season_resp.json()
            for ep in season_data.get("episodes", []):
                epnum = ep.get("episode_number", 0)
                ep_id = int(f"{series_id}{snum}{epnum}")
                entries.append({
                    "user_id": user["_id"], "content_id": ep_id, "content_type": "episode",
                    "title": f"{show_name} S{snum}E{epnum}", "poster_path": poster,
                    "watched_at": datetime.now(timezone.utc).isoformat()
                })
        # Also mark the series itself
        entries.append({
            "user_id": user["_id"], "content_id": series_id, "content_type": "tv",
            "title": show_name, "poster_path": poster,
            "watched_at": datetime.now(timezone.utc).isoformat()
        })
        # Batch upsert
        for e in entries:
            await db.watch_history.update_one(
                {"user_id": e["user_id"], "content_id": e["content_id"], "content_type": e["content_type"]},
                {"$set": e}, upsert=True
            )
    return {"message": f"{len(entries)} elements marques comme vus", "count": len(entries)}

# ==================== SERIES RESUME ====================
@app.get("/api/user/series/{series_id}/progress")
async def get_series_progress(series_id: int, user: dict = Depends(get_current_user)):
    history = await db.watch_history.find({"user_id": user["_id"], "content_type": "episode"}).to_list(5000)
    watched_eps = set()
    for h in history:
        cid = str(h.get("content_id", ""))
        if cid.startswith(str(series_id)):
            watched_eps.add(cid)
    # Find the next unwatched episode
    tmdb_key = os.environ.get("TMDB_API_KEY")
    if not tmdb_key:
        return {"next_season": 1, "next_episode": 1, "total_watched": len(watched_eps)}
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://api.themoviedb.org/3/tv/{series_id}?api_key={tmdb_key}&language=fr-FR", timeout=10.0)
        show = resp.json()
        for season in show.get("seasons", []):
            snum = season.get("season_number", 0)
            if snum == 0:
                continue
            for epnum in range(1, season.get("episode_count", 0) + 1):
                ep_id = str(int(f"{series_id}{snum}{epnum}"))
                if ep_id not in watched_eps:
                    return {"next_season": snum, "next_episode": epnum, "total_watched": len(watched_eps)}
    return {"next_season": None, "next_episode": None, "total_watched": len(watched_eps), "completed": True}

# ==================== CINEMA ROOMS ====================
class CinemaRoomCreate(BaseModel):
    name: str
    movie_title: str
    date: Optional[str] = ""
    time: Optional[str] = ""
    capacity: Optional[int] = 50

@app.get("/api/admin/cinema-rooms")
async def get_cinema_rooms(user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    rooms = await db.cinema_rooms.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"rooms": rooms}

@app.post("/api/admin/cinema-rooms")
async def create_cinema_room(req: CinemaRoomCreate, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    room_id = secrets.token_hex(8)
    doc = {
        "room_id": room_id,
        "name": req.name,
        "movie_title": req.movie_title,
        "date": req.date,
        "time": req.time,
        "capacity": req.capacity,
        "attendees": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cinema_rooms.insert_one(doc)
    return {"room": {k: v for k, v in doc.items() if k != "_id"}}

@app.delete("/api/admin/cinema-rooms/{room_id}")
async def delete_cinema_room(room_id: str, user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    await db.cinema_rooms.delete_one({"room_id": room_id})
    return {"success": True}

@app.get("/api/cinema-rooms")
async def get_public_cinema_rooms():
    rooms = await db.cinema_rooms.find({}, {"_id": 0}).sort("date", 1).to_list(50)
    return {"rooms": rooms}

# ==================== TOP SUPPORTERS / LEADERBOARD ====================
@app.get("/api/leaderboard")
async def get_leaderboard():
    pipeline = [
        {"$project": {"_id": 0, "username": 1, "is_vip": 1, "is_vip_plus": 1, "is_admin": 1, "created_at": 1}},
        {"$limit": 20}
    ]
    users_list = await db.users.aggregate(pipeline).to_list(20)
    # Count activities per user
    leaderboard = []
    for u in users_list:
        username = u.get("username", "Anonyme")
        fav_count = await db.favorites.count_documents({"user_id": username}) if False else 0
        leaderboard.append({
            "username": username,
            "is_vip": u.get("is_vip", False),
            "is_vip_plus": u.get("is_vip_plus", False),
            "score": fav_count
        })
    return {"leaderboard": sorted(leaderboard, key=lambda x: x["score"], reverse=True)}

# ==================== ACHIEVEMENTS ====================
@app.get("/api/user/achievements")
async def get_achievements(user: dict = Depends(get_current_user)):
    fav_count = await db.favorites.count_documents({"user_id": user["_id"]})
    history_count = await db.watch_history.count_documents({"user_id": user["_id"]})
    playlist_count = await db.playlists.count_documents({"user_id": user["_id"]})

    achievements = [
        {"id": "first_fav", "name": "Premier coup de coeur", "description": "Ajouter un premier favori", "icon": "heart", "unlocked": fav_count >= 1},
        {"id": "cinephile", "name": "Cinephile", "description": "Ajouter 10 favoris", "icon": "film", "unlocked": fav_count >= 10},
        {"id": "first_watch", "name": "Premier visionnage", "description": "Regarder un premier contenu", "icon": "play", "unlocked": history_count >= 1},
        {"id": "binge_watcher", "name": "Binge Watcher", "description": "Regarder 25 contenus", "icon": "tv", "unlocked": history_count >= 25},
        {"id": "marathon", "name": "Marathon", "description": "Regarder 100 contenus", "icon": "trophy", "unlocked": history_count >= 100},
        {"id": "curator", "name": "Curateur", "description": "Creer une playlist", "icon": "list", "unlocked": playlist_count >= 1},
        {"id": "collector", "name": "Collectionneur", "description": "Creer 5 playlists", "icon": "folder", "unlocked": playlist_count >= 5},
        {"id": "vip_member", "name": "Membre VIP", "description": "Obtenir le statut VIP", "icon": "crown", "unlocked": user.get("is_vip", False)},
    ]
    return {"achievements": achievements, "stats": {"favorites": fav_count, "watched": history_count, "playlists": playlist_count}}


# =================== ADMIN CONTENT CRUD ===================

async def require_admin(user: dict = Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin requis")
    return user

async def require_admin_or_uploader(user: dict = Depends(get_current_user)):
    if not user.get("is_admin") and not user.get("is_uploader"):
        raise HTTPException(status_code=403, detail="Admin ou uploader requis")
    return user

# --- TV Channels CRUD ---
@app.post("/api/admin/tv-channels")
async def create_tv_channel(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    # Remove any _id from input to avoid duplicates
    data.pop("_id", None)
    data.pop("id", None)
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.tv_channels.insert_one(data)
    return {"_id": str(result.inserted_id), **{k:v for k,v in data.items() if k != "_id"}}

@app.put("/api/admin/tv-channels/{channel_id}")
async def update_tv_channel(channel_id: str, request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    data.pop("id", None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tv_channels.update_one({"_id": ObjectId(channel_id)}, {"$set": data})
    return {"message": "Mis a jour", "_id": channel_id}

@app.delete("/api/admin/tv-channels/{channel_id}")
async def delete_tv_channel(channel_id: str, user: dict = Depends(require_admin)):
    result = await db.tv_channels.delete_one({"_id": ObjectId(channel_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chaine non trouvee")
    return {"message": "Supprime", "deleted_id": channel_id}

# --- Radio Stations CRUD ---
@app.post("/api/admin/radio-stations")
async def create_radio_station(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.radio_stations.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@app.put("/api/admin/radio-stations/{station_id}")
async def update_radio_station(station_id: str, request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    await db.radio_stations.update_one({"_id": ObjectId(station_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/radio-stations/{station_id}")
async def delete_radio_station(station_id: str, user: dict = Depends(require_admin)):
    await db.radio_stations.delete_one({"_id": ObjectId(station_id)})
    return {"message": "Supprime"}

# --- Music Content CRUD ---
@app.post("/api/admin/music")
async def create_music(request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.music_content.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@app.get("/api/music")
async def get_music():
    items = await db.music_content.find({"is_active": True}).sort("created_at", -1).to_list(200)
    for item in items:
        item["_id"] = str(item["_id"])
    return items

@app.put("/api/admin/music/{music_id}")
async def update_music(music_id: str, request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data.pop("_id", None)
    await db.music_content.update_one({"_id": ObjectId(music_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/music/{music_id}")
async def delete_music(music_id: str, user: dict = Depends(require_admin)):
    await db.music_content.delete_one({"_id": ObjectId(music_id)})
    return {"message": "Supprime"}

# --- Software CRUD ---
@app.post("/api/admin/software")
async def create_software(request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.software.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@app.put("/api/admin/software/{soft_id}")
async def update_software(soft_id: str, request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data.pop("_id", None)
    await db.software.update_one({"_id": ObjectId(soft_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/software/{soft_id}")
async def delete_software_item(soft_id: str, user: dict = Depends(require_admin)):
    await db.software.delete_one({"_id": ObjectId(soft_id)})
    return {"message": "Supprime"}

# --- Games CRUD ---
@app.get("/api/games")
async def get_games():
    items = await db.games.find({"is_active": True}).sort("created_at", -1).to_list(200)
    for item in items:
        item["_id"] = str(item["_id"])
    return items

@app.post("/api/admin/games")
async def create_game(request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.games.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@app.put("/api/admin/games/{game_id}")
async def update_game(game_id: str, request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data.pop("_id", None)
    await db.games.update_one({"_id": ObjectId(game_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/games/{game_id}")
async def delete_game(game_id: str, user: dict = Depends(require_admin)):
    await db.games.delete_one({"_id": ObjectId(game_id)})
    return {"message": "Supprime"}

# --- Ebooks CRUD ---
@app.post("/api/admin/ebooks")
async def create_ebook(request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.ebooks.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@app.put("/api/admin/ebooks/{ebook_id}")
async def update_ebook(ebook_id: str, request: Request, user: dict = Depends(require_admin_or_uploader)):
    data = await request.json()
    data.pop("_id", None)
    await db.ebooks.update_one({"_id": ObjectId(ebook_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/ebooks/{ebook_id}")
async def delete_ebook(ebook_id: str, user: dict = Depends(require_admin)):
    await db.ebooks.delete_one({"_id": ObjectId(ebook_id)})
    return {"message": "Supprime"}

# --- Retrogaming CRUD ---
@app.post("/api/admin/retrogaming")
async def create_retrogaming(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["is_active"] = data.get("is_active", True)
    result = await db.retrogaming_sources.insert_one(data)
    return {"_id": str(result.inserted_id), **{k:v for k,v in data.items() if k != "_id"}}

@app.put("/api/admin/retrogaming/{source_id}")
async def update_retrogaming(source_id: str, request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.retrogaming_sources.update_one({"_id": ObjectId(source_id)}, {"$set": data})
    return {"message": "Mis a jour", "_id": source_id}

@app.delete("/api/admin/retrogaming/{source_id}")
async def delete_retrogaming(source_id: str, user: dict = Depends(require_admin)):
    result = await db.retrogaming_sources.delete_one({"_id": ObjectId(source_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Source non trouvee")
    return {"message": "Supprime", "deleted_id": source_id}

# --- Changelogs CRUD ---
@app.get("/api/changelogs")
async def get_changelogs():
    items = await db.changelogs.find().sort("release_date", -1).to_list(100)
    for item in items:
        item["_id"] = str(item["_id"])
    return items

@app.post("/api/admin/changelogs")
async def create_changelog(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["created_by"] = user["_id"]
    result = await db.changelogs.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

@app.put("/api/admin/changelogs/{log_id}")
async def update_changelog(log_id: str, request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    await db.changelogs.update_one({"_id": ObjectId(log_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/changelogs/{log_id}")
async def delete_changelog(log_id: str, user: dict = Depends(require_admin)):
    await db.changelogs.delete_one({"_id": ObjectId(log_id)})
    return {"message": "Supprime"}

# --- Broadcast Message ---
@app.post("/api/admin/broadcast")
async def send_broadcast(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    subject = data.get("subject", "")
    content = data.get("content", "")
    if not subject or not content:
        raise HTTPException(status_code=400, detail="Sujet et contenu requis")
    users_list = await db.users.find({}, {"_id": 1}).to_list(10000)
    messages = [{
        "sender_id": user["_id"],
        "recipient_id": str(u["_id"]),
        "subject": subject,
        "content": content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    } for u in users_list]
    if messages:
        await db.user_messages.insert_many(messages)
    return {"message": f"Message envoye a {len(messages)} utilisateurs"}

# --- Admin Enhanced Stats ---
@app.get("/api/admin/enhanced-stats")
async def get_admin_enhanced_stats(user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    vip_users = await db.users.count_documents({"is_vip": True})
    vip_plus = await db.users.count_documents({"is_vip_plus": True})
    admin_count = await db.users.count_documents({"is_admin": True})
    tv_count = await db.tv_channels.count_documents({})
    radio_count = await db.radio_stations.count_documents({})
    retro_count = await db.retrogaming_sources.count_documents({})
    music_count = await db.music_content.count_documents({})
    soft_count = await db.software.count_documents({})
    game_count = await db.games.count_documents({})
    ebook_count = await db.ebooks.count_documents({})
    feedback_count = await db.feedback.count_documents({})
    requests_count = await db.content_requests.count_documents({})
    playlists_count = await db.playlists.count_documents({})
    # Fetch TMDB global stats
    tmdb_stats = {"tmdb_movies": 0, "tmdb_series": 0, "tmdb_episodes": 0}
    try:
        tmdb_key = os.environ.get("TMDB_API_KEY")
        if tmdb_key:
            async with httpx.AsyncClient(timeout=8) as hc:
                # Get total movies count from TMDB discover
                mv_resp = await hc.get(f"{TMDB_BASE}/discover/movie", params={"api_key": tmdb_key, "language": "fr-FR", "page": "1"})
                if mv_resp.status_code == 200:
                    tmdb_stats["tmdb_movies"] = mv_resp.json().get("total_results", 0)
                # Get total TV series count
                tv_resp = await hc.get(f"{TMDB_BASE}/discover/tv", params={"api_key": tmdb_key, "language": "fr-FR", "page": "1"})
                if tv_resp.status_code == 200:
                    tv_data = tv_resp.json()
                    tmdb_stats["tmdb_series"] = tv_data.get("total_results", 0)
                # Estimate episodes (average ~20 eps per show * total shows)
                tmdb_stats["tmdb_episodes"] = tmdb_stats["tmdb_series"] * 20
    except:
        pass

    return {
        "total_users": total_users, "vip_users": vip_users, "vip_plus_users": vip_plus,
        "admin_users": admin_count, "tv_channels": tv_count, "radio_stations": radio_count,
        "retrogaming": retro_count, "music": music_count, "software": soft_count,
        "games": game_count, "ebooks": ebook_count, "total_feedback": feedback_count,
        "total_requests": requests_count, "total_playlists": playlists_count,
        "total_content": tv_count + radio_count + retro_count + music_count + soft_count + game_count + ebook_count,
        **tmdb_stats
    }

# --- User Detailed Stats (for dashboard) ---
@app.get("/api/user/detailed-stats")
async def get_user_detailed_stats(user: dict = Depends(get_current_user)):
    uid = user["_id"]
    fav_count = await db.favorites.count_documents({"user_id": uid})
    history = await db.watch_history.find({"user_id": uid}).to_list(1000)
    playlist_count = await db.playlists.count_documents({"user_id": uid})
    movies_watched = sum(1 for h in history if h.get("content_type") == "movie")
    shows_watched = sum(1 for h in history if h.get("content_type") == "tv")
    episodes_watched = sum(1 for h in history if h.get("content_type") == "episode")
    # Recent watch time (simulated based on count)
    total_watch_time = movies_watched * 120 + shows_watched * 45 + episodes_watched * 45
    # Likes/dislikes
    likes = await db.user_ratings.count_documents({"user_id": uid, "rating": "like"})
    dislikes = await db.user_ratings.count_documents({"user_id": uid, "rating": "dislike"})
    return {
        "favorites": fav_count, "watched": len(history), "playlists": playlist_count,
        "movies_watched": movies_watched, "shows_watched": shows_watched,
        "episodes_watched": episodes_watched, "total_watch_time": total_watch_time,
        "total_likes": likes, "total_dislikes": dislikes,
    }

# --- Recommendations based on history ---
@app.get("/api/user/recommendations")
async def get_user_recommendations(user: dict = Depends(get_current_user)):
    import httpx
    uid = user["_id"]
    tmdb_key = os.environ.get("TMDB_API_KEY")
    if not tmdb_key:
        return {"recommendations": []}
    # Get user's watch history
    history = await db.watch_history.find({"user_id": uid}).sort("watched_at", -1).to_list(20)
    if not history:
        # Fallback to trending
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://api.themoviedb.org/3/trending/movie/week?api_key={tmdb_key}&language=fr-FR", timeout=10.0)
            data = resp.json()
            return {"recommendations": data.get("results", [])[:12], "source": "trending"}
    # Get similar movies based on last watched content
    watched_ids = set()
    recommendations = []
    async with httpx.AsyncClient() as client:
        for h in history[:5]:
            cid = h.get("content_id")
            ctype = h.get("content_type", "movie")
            watched_ids.add(cid)
            endpoint = "movie" if ctype == "movie" else "tv"
            try:
                resp = await client.get(f"https://api.themoviedb.org/3/{endpoint}/{cid}/similar?api_key={tmdb_key}&language=fr-FR&page=1", timeout=10.0)
                similar = resp.json().get("results", [])
                for s in similar[:4]:
                    if s["id"] not in watched_ids and s["id"] not in [r["id"] for r in recommendations]:
                        recommendations.append(s)
                        watched_ids.add(s["id"])
            except:
                continue
    if len(recommendations) < 6:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"https://api.themoviedb.org/3/trending/movie/week?api_key={tmdb_key}&language=fr-FR", timeout=10.0)
                for r in resp.json().get("results", []):
                    if r["id"] not in watched_ids and r["id"] not in [x["id"] for x in recommendations]:
                        recommendations.append(r)
                        if len(recommendations) >= 12:
                            break
        except:
            pass
    return {"recommendations": recommendations[:12], "source": "similar"}


# --- User Ratings (Like/Dislike) ---
@app.post("/api/user/ratings")
async def rate_content(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    content_id = data.get("content_id")
    content_type = data.get("content_type")
    rating = data.get("rating")  # "like" or "dislike"
    if not content_id or not content_type or rating not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="Donnees invalides")
    existing = await db.user_ratings.find_one({"user_id": user["_id"], "content_id": content_id, "content_type": content_type})
    if existing:
        if existing.get("rating") == rating:
            await db.user_ratings.delete_one({"_id": existing["_id"]})
            return {"rating": None, "message": "Vote retire"}
        else:
            await db.user_ratings.update_one({"_id": existing["_id"]}, {"$set": {"rating": rating}})
            return {"rating": rating, "message": "Vote mis a jour"}
    else:
        await db.user_ratings.insert_one({
            "user_id": user["_id"], "content_id": content_id, "content_type": content_type,
            "rating": rating, "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"rating": rating, "message": "Vote enregistre"}

@app.get("/api/user/ratings/check")
async def check_rating(content_id: str = Query(...), content_type: str = Query(...), user: dict = Depends(get_current_user)):
    # Try both string and int content_id for compatibility
    existing = await db.user_ratings.find_one({"user_id": user["_id"], "content_id": content_id, "content_type": content_type})
    if not existing:
        try:
            existing = await db.user_ratings.find_one({"user_id": user["_id"], "content_id": int(content_id), "content_type": content_type})
        except:
            pass
    return {"rating": existing.get("rating") if existing else None}

@app.get("/api/ratings/counts")
async def get_rating_counts(content_id: str = Query(...), content_type: str = Query(...)):
    """Public endpoint to get like/dislike counts for any content"""
    # Try both string and int content_id
    likes = await db.user_ratings.count_documents({"content_id": content_id, "content_type": content_type, "rating": "like"})
    dislikes = await db.user_ratings.count_documents({"content_id": content_id, "content_type": content_type, "rating": "dislike"})
    if likes == 0 and dislikes == 0:
        try:
            cid = int(content_id)
            likes = await db.user_ratings.count_documents({"content_id": cid, "content_type": content_type, "rating": "like"})
            dislikes = await db.user_ratings.count_documents({"content_id": cid, "content_type": content_type, "rating": "dislike"})
        except:
            pass
    return {"likes": likes, "dislikes": dislikes, "content_id": content_id, "content_type": content_type}

# --- Content Requests Admin Management ---
@app.put("/api/admin/content-requests/{request_id}")
async def update_content_request(request_id: str, request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    await db.content_requests.update_one({"_id": ObjectId(request_id)}, {"$set": data})
    return {"message": "Mis a jour"}

@app.delete("/api/admin/content-requests/{request_id}")
async def delete_content_request(request_id: str, user: dict = Depends(require_admin)):
    await db.content_requests.delete_one({"_id": ObjectId(request_id)})
    return {"message": "Supprime"}


# =================== PLATFORM REVIEWS / GUESTBOOK ===================

@app.post("/api/platform-reviews")
async def submit_platform_review(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    review = {
        "user_id": user["_id"],
        "username": user.get("username"),
        "is_admin": user.get("is_admin", False),
        "is_vip": user.get("is_vip", False),
        "is_vip_plus": user.get("is_vip_plus", False),
        "is_uploader": user.get("is_uploader", False),
        "contenu_score": max(1, min(10, int(data.get("contenu_score", 5)))),
        "fonctionnalites_score": max(1, min(10, int(data.get("fonctionnalites_score", 5)))),
        "design_score": max(1, min(10, int(data.get("design_score", 5)))),
        "message": data.get("message", "").strip()[:500],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Upsert - one review per user
    await db.platform_reviews.update_one({"user_id": user["_id"]}, {"$set": review}, upsert=True)
    return {"message": "Avis enregistre"}

@app.get("/api/platform-reviews")
async def get_platform_reviews():
    reviews = await db.platform_reviews.find().sort("created_at", -1).to_list(500)
    for r in reviews:
        r["_id"] = str(r["_id"])
    total = len(reviews)
    avg_contenu = sum(r.get("contenu_score", 5) for r in reviews) / total if total else 0
    avg_fonc = sum(r.get("fonctionnalites_score", 5) for r in reviews) / total if total else 0
    avg_design = sum(r.get("design_score", 5) for r in reviews) / total if total else 0
    return {
        "reviews": reviews,
        "total_votes": total,
        "averages": {
            "contenu": round(avg_contenu, 1),
            "fonctionnalites": round(avg_fonc, 1),
            "design": round(avg_design, 1)
        }
    }

@app.get("/api/platform-reviews/mine")
async def get_my_platform_review(user: dict = Depends(get_current_user)):
    review = await db.platform_reviews.find_one({"user_id": user["_id"]})
    if review:
        review["_id"] = str(review["_id"])
    return {"review": review}

# =================== USER MESSAGING ===================

@app.post("/api/messages")
async def send_user_message(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    recipient_id = data.get("recipient_id")
    content = data.get("content", "").strip()
    if not recipient_id or not content:
        raise HTTPException(status_code=400, detail="Destinataire et contenu requis")
    recipient = await db.users.find_one({"_id": ObjectId(recipient_id)})
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinataire introuvable")
    msg = {
        "sender_id": user["_id"],
        "sender_username": user.get("username"),
        "recipient_id": recipient_id,
        "content": content[:1000],
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_messages.insert_one(msg)
    return {"message": "Message envoye"}

@app.get("/api/messages")
async def get_user_messages(user: dict = Depends(get_current_user)):
    uid = user["_id"]
    received = await db.user_messages.find({"recipient_id": uid}).sort("created_at", -1).to_list(100)
    sent = await db.user_messages.find({"sender_id": uid}).sort("created_at", -1).to_list(100)
    for m in received + sent:
        m["_id"] = str(m["_id"])
    return {"received": received, "sent": sent}

@app.put("/api/messages/{msg_id}/read")
async def mark_message_read(msg_id: str, user: dict = Depends(get_current_user)):
    await db.user_messages.update_one({"_id": ObjectId(msg_id), "recipient_id": user["_id"]}, {"$set": {"is_read": True}})
    return {"ok": True}

# =================== ADMIN ACTIVITY FEED ===================

async def log_admin_activity(admin_username: str, action: str, target: str = ""):
    await db.admin_activities.insert_one({
        "admin_username": admin_username,
        "action": action,
        "target": target,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

@app.get("/api/admin/activities")
async def get_admin_activities(user: dict = Depends(require_admin)):
    activities = await db.admin_activities.find().sort("created_at", -1).to_list(50)
    for a in activities:
        a["_id"] = str(a["_id"])
    return {"activities": activities}

# =================== ADMIN TMDB UPDATE ===================

@app.post("/api/admin/tmdb-update")
async def admin_tmdb_update(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    update_type = data.get("type", "trending")
    tmdb_key = os.environ.get("TMDB_API_KEY")
    if not tmdb_key:
        raise HTTPException(status_code=500, detail="TMDB API key manquante")
    import httpx
    async with httpx.AsyncClient() as client:
        urls = {
            "trending": f"https://api.themoviedb.org/3/trending/movie/week?api_key={tmdb_key}&language=fr-FR",
            "popular": f"https://api.themoviedb.org/3/movie/popular?api_key={tmdb_key}&language=fr-FR",
            "upcoming": f"https://api.themoviedb.org/3/movie/upcoming?api_key={tmdb_key}&language=fr-FR",
        }
        url = urls.get(update_type)
        if not url:
            raise HTTPException(status_code=400, detail="Type invalide")
        resp = await client.get(url, timeout=15.0)
        results = resp.json().get("results", [])
    await log_admin_activity(user.get("username", "admin"), f"Mise a jour TMDB ({update_type})", f"{len(results)} resultats")
    return {"message": f"TMDB {update_type} mis a jour: {len(results)} resultats", "count": len(results)}

# =================== PLAYLIST COLORS ===================

@app.put("/api/playlists/{playlist_id}/colors")
async def update_playlist_colors(playlist_id: str, request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    color = data.get("color", "default")
    gradient = data.get("gradient", "")
    await db.playlists.update_one(
        {"_id": ObjectId(playlist_id), "user_id": user["_id"]},
        {"$set": {"color": color, "gradient": gradient}}
    )
    return {"message": "Couleurs mises a jour"}

# =================== PUBLIC PLAYLISTS ENHANCED ===================

@app.get("/api/playlists/public/enhanced")
async def get_public_playlists_enhanced(page: int = 1, limit: int = 20, sort_by: str = "recent", content_type_filter: str = ""):
    skip = (page - 1) * limit
    query = {"is_public": True}
    
    # Determine sort
    sort_field = [("created_at", -1)]
    if sort_by == "likes":
        sort_field = [("likes_count_cached", -1), ("created_at", -1)]
    elif sort_by == "size":
        sort_field = [("items_count_cached", -1), ("created_at", -1)]
    
    playlists = await db.playlists.find(query).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    result_uploaders = []
    result_others = []
    
    for p in playlists:
        p["_id"] = str(p["_id"])
        # Get user info
        try:
            uid = ObjectId(p["user_id"]) if isinstance(p["user_id"], str) else p["user_id"]
            u = await db.users.find_one({"_id": uid}, {"username": 1, "is_admin": 1, "is_vip": 1, "is_vip_plus": 1, "is_uploader": 1})
        except:
            u = None
        if u:
            p["user_info"] = {"username": u.get("username"), "is_admin": u.get("is_admin", False), "is_vip": u.get("is_vip", False), "is_vip_plus": u.get("is_vip_plus", False), "is_uploader": u.get("is_uploader", False)}
            p["username"] = u.get("username")
        # Count likes/dislikes
        likes = await db.user_ratings.count_documents({"content_id": p["_id"], "content_type": "playlist", "rating": "like"})
        dislikes = await db.user_ratings.count_documents({"content_id": p["_id"], "content_type": "playlist", "rating": "dislike"})
        p["likes_count"] = likes
        p["dislikes_count"] = dislikes
        p["items_count"] = len(p.get("items", []))
        
        # Separate uploaders/admins from others (uploaders always first)
        if u and (u.get("is_uploader") or u.get("is_admin")):
            result_uploaders.append(p)
        else:
            result_others.append(p)
    
    # Uploaders first, then others
    result = result_uploaders + result_others
    total = await db.playlists.count_documents(query)
    return {"playlists": result, "total": total, "page": page}


# =================== WEBSOCKET & NOTIFICATIONS ===================

@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id)
    try:
        # Send unread notifications count
        unread = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
        await websocket.send_json({"type": "unread_count", "count": unread})
        while True:
            data = await websocket.receive_text()
            # Keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)

@app.get("/api/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    notifs = await db.notifications.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(50)
    for n in notifs:
        n["_id"] = str(n["_id"])
    return {"notifications": notifs}

@app.put("/api/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["_id"], "is_read": False}, {"$set": {"is_read": True}})
    return {"ok": True}

@app.delete("/api/notifications/{notif_id}")
async def delete_notification(notif_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.delete_one({"_id": ObjectId(notif_id), "user_id": user["_id"]})
    return {"ok": True}

async def create_notification(user_id: str, title: str, message: str, notif_type: str = "info", link: str = ""):
    notif = {
        "user_id": user_id, "title": title, "message": message,
        "type": notif_type, "link": link, "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif)
    notif.pop("_id", None)
    await ws_manager.send_to_user(user_id, {"type": "notification", **notif})

# Hook into existing message send to trigger notification
_original_send_message = send_user_message
@app.post("/api/messages", include_in_schema=False)
async def send_user_message_with_notif(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    recipient_id = body.get("recipient_id")
    content = body.get("content", "").strip()
    if not recipient_id or not content:
        raise HTTPException(status_code=400, detail="Destinataire et contenu requis")
    recipient = await db.users.find_one({"_id": ObjectId(recipient_id)})
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinataire introuvable")
    msg = {
        "sender_id": user["_id"], "sender_username": user.get("username"),
        "recipient_id": recipient_id, "content": content[:1000],
        "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_messages.insert_one(msg)
    # Send notification
    await create_notification(recipient_id, "Nouveau message", f"{user.get('username')} vous a envoye un message", "message", "/messages")
    return {"message": "Message envoye"}

# Admin broadcast with notifications
@app.post("/api/admin/broadcast-notify")
async def broadcast_with_notification(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    subject = data.get("subject", "")
    content = data.get("content", "")
    if not subject or not content:
        raise HTTPException(status_code=400, detail="Sujet et contenu requis")
    users_list = await db.users.find({}, {"_id": 1}).to_list(10000)
    for u in users_list:
        uid = str(u["_id"])
        await create_notification(uid, subject, content, "broadcast", "")
    await log_admin_activity(user.get("username", "admin"), "Broadcast notification", f"{subject} - {len(users_list)} utilisateurs")
    return {"message": f"Notification envoyee a {len(users_list)} utilisateurs"}


# =================== ADMIN VIP CODES ===================

@app.post("/api/admin/vip-codes")
async def generate_vip_code(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    code_type = data.get("type", "vip")  # vip, vip_plus, uploader, admin
    duration_days = int(data.get("duration_days", 30) or 30)
    quantity = max(1, min(int(data.get("quantity", 1) or 1), 50))
    codes = []
    for _ in range(quantity):
        code = secrets.token_hex(6).upper()
        await db.activation_codes.insert_one({
            "code": code,
            "type": code_type,
            "duration_days": duration_days,
            "created_by": user["_id"],
            "used_by": None,
            "is_used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        codes.append(code)
    await log_admin_activity(user.get("username", "admin"), f"{quantity} code(s) {code_type} {duration_days}j generes", ", ".join(codes[:3]))
    return {"code": codes[0], "codes": codes, "type": code_type, "duration_days": duration_days}

@app.get("/api/admin/vip-codes")
async def get_vip_codes(user: dict = Depends(require_admin)):
    codes = await db.activation_codes.find().sort("created_at", -1).to_list(200)
    for c in codes:
        c["_id"] = str(c["_id"])
    return {"codes": codes}

@app.delete("/api/admin/vip-codes/{code_id}")
async def delete_vip_code(code_id: str, user: dict = Depends(require_admin)):
    await db.activation_codes.delete_one({"_id": ObjectId(code_id)})
    return {"message": "Code supprime"}

# Update activate-code to use admin-generated codes
@app.post("/api/user/activate-code")
async def activate_code_v2(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    code = body.get("code", "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="Code requis")
    # Find code in DB
    db_code = await db.activation_codes.find_one({"code": code, "is_used": False})
    if not db_code:
        raise HTTPException(status_code=400, detail="Code invalide ou deja utilise")
    # Apply privileges based on code type
    code_type = db_code.get("type", "vip")
    duration_days = int(db_code.get("duration_days", 30) or 30)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat() if code_type in ("vip", "vip_plus", "uploader") else None
    updates = {}
    if code_type == "vip":
        updates = {"is_vip": True, "vip_expires_at": expires_at}
    elif code_type == "vip_plus":
        updates = {"is_vip": True, "is_vip_plus": True, "vip_expires_at": expires_at}
    elif code_type == "uploader":
        updates = {"is_uploader": True, "is_vip": True, "vip_expires_at": expires_at}
    elif code_type == "admin":
        updates = {"is_admin": True}
    if updates:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": updates})
    # Mark code as used
    await db.activation_codes.update_one({"_id": db_code["_id"]}, {"$set": {"is_used": True, "used_by": user["_id"], "used_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    msg = f"Code {code_type} active" + (f" pour {duration_days} jours !" if expires_at else " !")
    return {"message": msg, "user": updated}



# =================== TV SHOW PROGRESS ===================

@app.get("/api/user/tv-progress/{show_id}")
async def get_tv_progress(show_id: str, user: dict = Depends(get_current_user)):
    """Get watching progress for a TV show"""
    progress = await db.tv_progress.find_one({"user_id": user["_id"], "show_id": show_id})
    if not progress:
        return {"watched_episodes": {}, "continue_watching": None}
    
    # Determine next episode to watch
    watched = progress.get("watched_episodes", {})
    continue_info = progress.get("last_watched")
    
    return {
        "watched_episodes": watched,
        "continue_watching": continue_info
    }

@app.post("/api/user/tv-progress/{show_id}/episode")
async def mark_episode_watched(show_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Mark a single episode as watched"""
    data = await request.json()
    season = str(data.get("season", 1))
    episode = str(data.get("episode", 1))
    watched = data.get("watched", True)
    
    progress = await db.tv_progress.find_one({"user_id": user["_id"], "show_id": show_id})
    if not progress:
        progress = {"user_id": user["_id"], "show_id": show_id, "watched_episodes": {}, "created_at": datetime.now(timezone.utc).isoformat()}
    
    if season not in progress["watched_episodes"]:
        progress["watched_episodes"][season] = {}
    
    progress["watched_episodes"][season][episode] = watched
    progress["last_watched"] = {"season": int(season), "episode": int(episode) + 1} if watched else progress.get("last_watched")
    progress["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tv_progress.update_one(
        {"user_id": user["_id"], "show_id": show_id},
        {"$set": progress},
        upsert=True
    )
    
    return {"message": "Episode marque", "watched": watched}

@app.post("/api/user/tv-progress/{show_id}/mark-all-watched")
async def mark_all_episodes_watched(show_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Mark entire TV show (all seasons/episodes) as watched"""
    data = await request.json()
    show_name = data.get("show_name", "")
    poster_path = data.get("poster_path", "")
    
    # Fetch show details from TMDB to get all seasons/episodes
    try:
        tmdb_key = os.environ.get("TMDB_API_KEY", "d4b8332681051181b69c8a6c9ba1a70a")
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://api.themoviedb.org/3/tv/{show_id}?api_key={tmdb_key}&language=fr-FR")
            show_data = resp.json()
    except:
        raise HTTPException(status_code=500, detail="Impossible de recuperer les infos de la serie")
    
    watched_episodes = {}
    total_episodes = 0
    
    for season in show_data.get("seasons", []):
        season_num = season.get("season_number", 0)
        if season_num == 0:  # Skip specials
            continue
        episode_count = season.get("episode_count", 0)
        watched_episodes[str(season_num)] = {}
        for ep in range(1, episode_count + 1):
            watched_episodes[str(season_num)][str(ep)] = True
            total_episodes += 1
    
    # Update progress
    await db.tv_progress.update_one(
        {"user_id": user["_id"], "show_id": show_id},
        {"$set": {
            "user_id": user["_id"],
            "show_id": show_id,
            "watched_episodes": watched_episodes,
            "all_watched": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Also add to history
    await db.user_history.update_one(
        {"user_id": user["_id"], "content_id": int(show_id), "content_type": "tv"},
        {"$set": {
            "user_id": user["_id"],
            "content_id": int(show_id),
            "content_type": "tv",
            "title": show_name,
            "poster_path": poster_path,
            "watched_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Serie complete marquee comme vue", "total_episodes": total_episodes}

@app.delete("/api/user/tv-progress/{show_id}")
async def reset_tv_progress(show_id: str, user: dict = Depends(get_current_user)):
    """Reset all progress for a TV show"""
    await db.tv_progress.delete_one({"user_id": user["_id"], "show_id": show_id})
    return {"message": "Progression reintialisee"}

# =================== RELEASE NOTIFICATIONS ===================

@app.get("/api/user/release-notifications")
async def get_release_notifications(user: dict = Depends(get_current_user)):
    """Get user's release notification preferences"""
    notifs = await db.release_notifications.find({"user_id": user["_id"], "enabled": True}).to_list(500)
    notifications = {}
    for n in notifs:
        key = f"{n['content_type']}-{n['content_id']}"
        notifications[key] = True
    return {"notifications": notifications}

@app.post("/api/user/release-notifications")
async def set_release_notification(request: Request, user: dict = Depends(get_current_user)):
    """Enable/disable release notification for a content"""
    data = await request.json()
    content_id = data.get("content_id")
    content_type = data.get("content_type")
    title = data.get("title", "")
    enabled = data.get("enabled", True)
    
    if enabled:
        await db.release_notifications.update_one(
            {"user_id": user["_id"], "content_id": content_id, "content_type": content_type},
            {"$set": {
                "user_id": user["_id"],
                "content_id": content_id,
                "content_type": content_type,
                "title": title,
                "enabled": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    else:
        await db.release_notifications.delete_one({
            "user_id": user["_id"],
            "content_id": content_id,
            "content_type": content_type
        })
    
    return {"success": True, "enabled": enabled}

# Check for new episodes of favorited shows and create notifications
@app.get("/api/user/check-new-episodes")
async def check_new_episodes(user: dict = Depends(get_current_user)):
    """Check if any favorited TV shows have new episodes"""
    favorites = await db.favorites.find({"user_id": user["_id"], "content_type": "tv"}).to_list(100)
    new_content = []
    
    for fav in favorites:
        # Get notif settings
        notif = await db.release_notifications.find_one({
            "user_id": user["_id"],
            "content_id": fav["content_id"],
            "content_type": "tv",
            "enabled": True
        })
        
        if notif:
            # Check TMDB for latest episode
            try:
                tmdb_key = os.environ.get("TMDB_API_KEY", "d4b8332681051181b69c8a6c9ba1a70a")
                async with httpx.AsyncClient() as client:
                    resp = await client.get(f"https://api.themoviedb.org/3/tv/{fav['content_id']}?api_key={tmdb_key}&language=fr-FR")
                    show_data = resp.json()
                    
                    # Check if there's a new episode since last check
                    last_ep = show_data.get("last_episode_to_air")
                    if last_ep:
                        # Check if we already notified about this
                        existing = await db.episode_notifications_sent.find_one({
                            "user_id": user["_id"],
                            "show_id": fav["content_id"],
                            "season": last_ep.get("season_number"),
                            "episode": last_ep.get("episode_number")
                        })
                        
                        if not existing:
                            new_content.append({
                                "show_id": fav["content_id"],
                                "show_name": show_data.get("name"),
                                "season": last_ep.get("season_number"),
                                "episode": last_ep.get("episode_number"),
                                "episode_name": last_ep.get("name"),
                                "air_date": last_ep.get("air_date")
                            })
                            
                            # Create notification
                            await create_notification(
                                user["_id"],
                                f"Nouvel episode de {show_data.get('name')}",
                                f"S{last_ep.get('season_number')} E{last_ep.get('episode_number')} - {last_ep.get('name', '')}",
                                "release",
                                f"/tv-shows/{fav['content_id']}"
                            )
                            
                            # Mark as sent
                            await db.episode_notifications_sent.insert_one({
                                "user_id": user["_id"],
                                "show_id": fav["content_id"],
                                "season": last_ep.get("season_number"),
                                "episode": last_ep.get("episode_number"),
                                "sent_at": datetime.now(timezone.utc).isoformat()
                            })
            except:
                pass
    
    return {"new_content": new_content, "count": len(new_content)}




# =================== EPISODE & MOVIE NOTIFICATIONS ===================

@app.post("/api/notifications/subscribe-series")
async def subscribe_series_notifications(request: Request, user: dict = Depends(get_current_user)):
    """Subscribe to notifications for a TV series (new episodes)"""
    data = await request.json()
    series_id = data.get("series_id")
    series_name = data.get("series_name", "Serie")
    if not series_id:
        raise HTTPException(status_code=400, detail="series_id required")
    existing = await db.series_subscriptions.find_one({"user_id": user["_id"], "series_id": series_id})
    if existing:
        await db.series_subscriptions.delete_one({"_id": existing["_id"]})
        return {"subscribed": False, "message": f"Notifications desactivees pour {series_name}"}
    await db.series_subscriptions.insert_one({
        "user_id": user["_id"], "series_id": series_id, "series_name": series_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"subscribed": True, "message": f"Notifications activees pour {series_name}"}

@app.get("/api/notifications/subscribed-series")
async def get_subscribed_series(user: dict = Depends(get_current_user)):
    subs = await db.series_subscriptions.find({"user_id": user["_id"]}).to_list(100)
    for s in subs:
        s["_id"] = str(s["_id"])
    return {"subscriptions": subs}

@app.get("/api/notifications/check-series/{series_id}")
async def check_series_subscription(series_id: int, user: dict = Depends(get_current_user)):
    existing = await db.series_subscriptions.find_one({"user_id": user["_id"], "series_id": series_id})
    return {"subscribed": existing is not None}

@app.post("/api/notifications/check-new-episodes")
async def check_new_episodes(user: dict = Depends(get_optional_user)):
    """Check for new episodes of subscribed series and upcoming movies, send notifications"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = {"episodes_notified": 0, "movies_notified": 0}

    # Check new episodes for all users with subscriptions
    subs = await db.series_subscriptions.find().to_list(1000)
    series_ids = list(set(s["series_id"] for s in subs))

    for sid in series_ids:
        try:
            data = await tmdb_fetch(f"/tv/{sid}", {"append_to_response": "season/1"})
            last_ep = data.get("last_episode_to_air")
            next_ep = data.get("next_episode_to_air")

            target_ep = next_ep if next_ep and next_ep.get("air_date") == today else (last_ep if last_ep and last_ep.get("air_date") == today else None)
            if not target_ep:
                continue

            ep_name = target_ep.get("name", "")
            season = target_ep.get("season_number", 1)
            episode = target_ep.get("episode_number", 1)
            series_name = data.get("name", "Serie")

            # Notify all subscribers
            subscribers = [s for s in subs if s["series_id"] == sid]
            for sub in subscribers:
                # Check if already notified today
                already = await db.notifications.find_one({
                    "user_id": sub["user_id"],
                    "type": "new_episode",
                    "link": f"/tv-shows/{sid}/season/{season}/episode/{episode}",
                    "created_at": {"$regex": f"^{today}"}
                })
                if already:
                    continue
                await create_notification(
                    sub["user_id"],
                    f"Nouvel episode : {series_name}",
                    f"S{season}E{episode} - {ep_name} est disponible !",
                    "new_episode",
                    f"/tv-shows/{sid}/season/{season}/episode/{episode}"
                )
                results["episodes_notified"] += 1
        except:
            continue

    # Check upcoming movies (notify users who have them in favorites)
    try:
        upcoming = await tmdb_fetch("/movie/upcoming", {"region": "FR"})
        for movie in (upcoming.get("results") or [])[:10]:
            if movie.get("release_date") == today:
                # Find users who have this movie in favorites
                fav_users = await db.favorites.find({"tmdb_id": movie["id"], "media_type": "movie"}).to_list(500)
                for fav in fav_users:
                    already = await db.notifications.find_one({
                        "user_id": fav["user_id"],
                        "type": "movie_release",
                        "link": f"/movies/{movie['id']}",
                        "created_at": {"$regex": f"^{today}"}
                    })
                    if already:
                        continue
                    await create_notification(
                        fav["user_id"],
                        f"Sortie : {movie.get('title', 'Film')}",
                        f"{movie.get('title')} est sorti aujourd'hui !",
                        "movie_release",
                        f"/movies/{movie['id']}"
                    )
                    results["movies_notified"] += 1
    except:
        pass

    return results

# Background task: check new episodes periodically
@app.on_event("startup")
async def start_episode_checker():
    import asyncio
    async def episode_check_loop():
        while True:
            try:
                await asyncio.sleep(3600 * 6)  # Check every 6 hours
                # Trigger check
                await check_new_episodes(user=None)
            except:
                pass
    asyncio.create_task(episode_check_loop())


# =================== PLAYLIST NOTIFICATIONS ===================

@app.post("/api/playlists/{playlist_id}/subscribe")
async def subscribe_playlist(playlist_id: str, user: dict = Depends(get_current_user)):
    """Toggle notification subscription for a playlist"""
    existing = await db.playlist_subscriptions.find_one({"user_id": user["_id"], "playlist_id": playlist_id})
    if existing:
        await db.playlist_subscriptions.delete_one({"_id": existing["_id"]})
        return {"subscribed": False, "message": "Notifications desactivees"}
    await db.playlist_subscriptions.insert_one({
        "user_id": user["_id"], "playlist_id": playlist_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"subscribed": True, "message": "Notifications activees"}

@app.get("/api/playlists/{playlist_id}/subscribe/check")
async def check_playlist_subscription(playlist_id: str, user: dict = Depends(get_current_user)):
    existing = await db.playlist_subscriptions.find_one({"user_id": user["_id"], "playlist_id": playlist_id})
    return {"subscribed": existing is not None}

# Override add_playlist_item to also send notifications
_original_add_item = add_playlist_item
@app.post("/api/playlists/{playlist_id}/items", include_in_schema=False)
async def add_playlist_item_with_notif(playlist_id: str, req: PlaylistItemAdd, user: dict = Depends(get_current_user)):
    result = await _original_add_item(playlist_id, req, user)
    # Notify subscribers
    try:
        playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id)})
        if playlist:
            subs = await db.playlist_subscriptions.find({"playlist_id": playlist_id}).to_list(500)
            for sub in subs:
                if sub["user_id"] != user["_id"]:
                    await create_notification(
                        sub["user_id"],
                        f"Nouveau dans {playlist.get('name', 'Playlist')}",
                        f"{req.title} a ete ajoute",
                        "playlist_update",
                        f"/playlists/{playlist_id}"
                    )
    except:
        pass
    return result
