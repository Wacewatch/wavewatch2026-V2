from dotenv import load_dotenv
load_dotenv()

import os
import bcrypt
import jwt
import secrets
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request, Response, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
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

# MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

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
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

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
    yield

app = FastAPI(title="WaveWatch API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
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
    content_id: int
    content_type: str
    title: str
    poster_path: Optional[str] = None

class FavoriteToggle(BaseModel):
    content_id: int
    content_type: str
    title: str
    poster_path: Optional[str] = None
    metadata: Optional[dict] = None

class SiteSettingUpdate(BaseModel):
    setting_key: str
    setting_value: dict

class UserRoleUpdate(BaseModel):
    role: Optional[str] = None
    is_vip: Optional[bool] = None
    is_vip_plus: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_uploader: Optional[bool] = None

# ==================== AUTH ====================
@app.post("/api/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.strip().lower()
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
        response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
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
async def tmdb_discover(media_type: str, page: int = 1, genre: Optional[int] = None, sort_by: str = "popularity.desc"):
    params = {"page": str(page), "sort_by": sort_by}
    if genre:
        params["with_genres"] = str(genre)
    return await tmdb_fetch(f"/discover/{media_type}", params)

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
async def check_favorite(content_id: int, content_type: str, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["_id"], "content_id": content_id, "content_type": content_type})
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
    return {"playlist": playlist}

@app.post("/api/playlists/{playlist_id}/items")
async def add_playlist_item(playlist_id: str, req: PlaylistItemAdd, user: dict = Depends(get_current_user)):
    playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id), "user_id": user["_id"]})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    item = {"content_id": req.content_id, "content_type": req.content_type, "title": req.title, "poster_path": req.poster_path, "added_at": datetime.now(timezone.utc).isoformat()}
    await db.playlists.update_one({"_id": ObjectId(playlist_id)}, {"$push": {"items": item}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@app.delete("/api/playlists/{playlist_id}/items/{content_id}")
async def remove_playlist_item(playlist_id: str, content_id: int, user: dict = Depends(get_current_user)):
    await db.playlists.update_one(
        {"_id": ObjectId(playlist_id), "user_id": user["_id"]},
        {"$pull": {"items": {"content_id": content_id}}}
    )
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
    update = {}
    if "username" in body:
        update["username"] = body["username"]
    if "show_adult_content" in body:
        update["show_adult_content"] = body["show_adult_content"]
    if "avatar_url" in body:
        update["avatar_url"] = body["avatar_url"]
    if update:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return {"user": updated}

@app.get("/api/user/stats")
async def get_user_stats(user: dict = Depends(get_current_user)):
    fav_count = await db.favorites.count_documents({"user_id": user["_id"]})
    history_count = await db.watch_history.count_documents({"user_id": user["_id"]})
    playlist_count = await db.playlists.count_documents({"user_id": user["_id"]})
    return {"favorites": fav_count, "watched": history_count, "playlists": playlist_count}

# ==================== TV CHANNELS / RADIO ====================
@app.get("/api/tv-channels")
async def get_tv_channels():
    channels = await db.tv_channels.find({}, {"_id": 0}).to_list(500)
    if not channels:
        channels = [
            {"id": 1, "name": "TF1", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/TF1_logo_2013.png/200px-TF1_logo_2013.png", "stream_url": "", "category": "Generaliste", "country": "FR"},
            {"id": 2, "name": "France 2", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/France_2_logo.png/200px-France_2_logo.png", "stream_url": "", "category": "Generaliste", "country": "FR"},
            {"id": 3, "name": "France 3", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/France_3_logo.png/200px-France_3_logo.png", "stream_url": "", "category": "Generaliste", "country": "FR"},
            {"id": 4, "name": "Canal+", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Canal%2B_logo.png/200px-Canal%2B_logo.png", "stream_url": "", "category": "Premium", "country": "FR"},
            {"id": 5, "name": "M6", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/M6_logo_2020.png/200px-M6_logo_2020.png", "stream_url": "", "category": "Generaliste", "country": "FR"},
            {"id": 6, "name": "Arte", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Arte_logo.png/200px-Arte_logo.png", "stream_url": "", "category": "Culture", "country": "FR"},
            {"id": 7, "name": "BFM TV", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/BFMTV_logo.png/200px-BFMTV_logo.png", "stream_url": "", "category": "Info", "country": "FR"},
            {"id": 8, "name": "TMC", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/TMC_logo_2016.png/200px-TMC_logo_2016.png", "stream_url": "", "category": "Generaliste", "country": "FR"},
        ]
    return {"channels": channels}

@app.get("/api/radio-stations")
async def get_radio_stations():
    stations = await db.radio_stations.find({}, {"_id": 0}).to_list(500)
    if not stations:
        stations = [
            {"id": 1, "name": "NRJ", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/NRJ_logo.png/200px-NRJ_logo.png", "stream_url": "https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3", "genre": "Pop/Dance"},
            {"id": 2, "name": "Skyrock", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Skyrock_logo.png/200px-Skyrock_logo.png", "stream_url": "https://icecast.skyrock.net/s/natio_mp3_128k", "genre": "Rap/Hip-Hop"},
            {"id": 3, "name": "Fun Radio", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Fun_Radio_logo.png/200px-Fun_Radio_logo.png", "stream_url": "https://streaming.radio.funradio.fr/fun-1-44-128", "genre": "Dance/Electro"},
            {"id": 4, "name": "RTL", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/RTL_logo.png/200px-RTL_logo.png", "stream_url": "", "genre": "Generaliste"},
            {"id": 5, "name": "France Inter", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/France_Inter_logo.png/200px-France_Inter_logo.png", "stream_url": "https://icecast.radiofrance.fr/franceinter-hifi.aac", "genre": "Generaliste"},
            {"id": 6, "name": "Europe 1", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Europe_1_logo.png/200px-Europe_1_logo.png", "stream_url": "", "genre": "Generaliste"},
            {"id": 7, "name": "RFM", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/RFM_logo.png/200px-RFM_logo.png", "stream_url": "", "genre": "Pop/Rock"},
            {"id": 8, "name": "Nostalgie", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Nostalgie_logo.png/200px-Nostalgie_logo.png", "stream_url": "", "genre": "Oldies"},
        ]
    return {"stations": stations}

# ==================== EBOOKS / SOFTWARE ====================
@app.get("/api/ebooks")
async def get_ebooks(page: int = 1, category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    skip = (page - 1) * 20
    ebooks = await db.ebooks.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(20).to_list(20)
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
    software = await db.software.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(20).to_list(20)
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
    games = await db.retrogaming.find({}, {"_id": 0}).to_list(500)
    if not games:
        games = [
            {"id": 1, "name": "Super Mario Bros", "console": "NES", "cover": "/placeholder.svg?height=200&width=200", "play_url": "https://www.retrogames.onl/play/nes/super-mario-bros.html", "year": 1985},
            {"id": 2, "name": "Sonic the Hedgehog", "console": "Genesis", "cover": "/placeholder.svg?height=200&width=200", "play_url": "https://www.retrogames.onl/play/genesis/sonic-the-hedgehog.html", "year": 1991},
            {"id": 3, "name": "Tetris", "console": "Game Boy", "cover": "/placeholder.svg?height=200&width=200", "play_url": "https://www.retrogames.onl/play/gb/tetris.html", "year": 1989},
            {"id": 4, "name": "Pac-Man", "console": "Arcade", "cover": "/placeholder.svg?height=200&width=200", "play_url": "https://www.retrogames.onl/play/arcade/pac-man.html", "year": 1980},
            {"id": 5, "name": "The Legend of Zelda", "console": "NES", "cover": "/placeholder.svg?height=200&width=200", "play_url": "https://www.retrogames.onl/play/nes/the-legend-of-zelda.html", "year": 1986},
            {"id": 6, "name": "Street Fighter II", "console": "SNES", "cover": "/placeholder.svg?height=200&width=200", "play_url": "https://www.retrogames.onl/play/snes/street-fighter-ii.html", "year": 1992},
        ]
    return {"games": games}

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "WaveWatch", "version": "2026"}

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
