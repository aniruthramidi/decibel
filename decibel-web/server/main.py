"""
Decibel — YouTube Music API backend
Wraps ytmusicapi and exposes REST endpoints consumed by the React frontend.

Setup:
  1. pip install -r requirements.txt
  2. ytmusicapi oauth          # follow prompts → generates oauth.json
  3. python main.py            # starts on http://localhost:8000
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ytmusicapi import YTMusic

import sqlite3
import shutil

# On Vercel, the filesystem is read-only except for /tmp.
# Copy database to /tmp if running in Vercel or in a read-only environment.
if os.environ.get("VERCEL") or not os.access(Path(__file__).parent, os.W_OK):
    DB_PATH = Path("/tmp") / "decibel.db"
    src_db = Path(__file__).parent / "decibel.db"
    if src_db.exists() and not DB_PATH.exists():
        try:
            shutil.copy(src_db, DB_PATH)
            print(f"[Decibel] Copied sqlite database to /tmp/decibel.db")
        except Exception as e:
            print(f"[Decibel] Error copying database to /tmp: {e}")
else:
    DB_PATH = Path(__file__).parent / "decibel.db"

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT,
            password TEXT
        )
    """)
    try:
        c.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    c.execute("""
        CREATE TABLE IF NOT EXISTS playlists (
            playlistId TEXT PRIMARY KEY,
            user_email TEXT,
            title TEXT,
            description TEXT,
            FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS playlist_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id TEXT,
            video_id TEXT,
            title TEXT,
            artist TEXT,
            album TEXT,
            cover TEXT,
            duration INTEGER,
            FOREIGN KEY(playlist_id) REFERENCES playlists(playlistId) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

init_db()
print(f"[Decibel] SQLite database initialised at {DB_PATH}")

# ── Initialise YTMusic ────────────────────────────────────────────────────────
OAUTH_PATH = Path(__file__).parent / "oauth.json"

if OAUTH_PATH.exists():
    yt = YTMusic(str(OAUTH_PATH))
    AUTH_MODE = "oauth"
else:
    # Fall back to unauthenticated mode (search only, no playlist writes)
    yt = YTMusic()
    AUTH_MODE = "guest"

print(f"[Decibel] ytmusicapi initialised — mode: {AUTH_MODE}")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Decibel YT Music API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _thumb(thumbnails: Optional[List[dict]]) -> str:
    """Return the highest resolution thumbnail URL."""
    if not thumbnails:
        return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500"
    return max(thumbnails, key=lambda t: t.get("width", 0)).get("url", "")


def _duration_secs(raw: Optional[str]) -> int:
    """Convert 'mm:ss' or 'h:mm:ss' to total seconds."""
    if not raw:
        return 0
    parts = raw.split(":")
    try:
        parts = [int(p) for p in parts]
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
    except ValueError:
        pass
    return 0


def _format_track(item: dict) -> Optional[dict]:
    """Normalise a ytmusicapi result into our track schema."""
    video_id = item.get("videoId")
    if not video_id:
        return None

    duration = _duration_secs(item.get("duration"))
    if duration < 60:          # skip shorts / instrumentals under 1 min
        return None

    artists = item.get("artists") or []
    artist_name = ", ".join(a.get("name", "") for a in artists) or "Unknown Artist"

    album = item.get("album") or {}
    album_name = album.get("name", "YouTube Music") if isinstance(album, dict) else str(album)

    thumbs = (
        item.get("thumbnails")
        or (item.get("album") or {}).get("thumbnails")
        or []
    )

    return {
        "id": f"youtube_{video_id}",
        "videoId": video_id,
        "title": item.get("title", "Unknown Track"),
        "artist": artist_name,
        "album": album_name,
        "cover": _thumb(thumbs),
        "audioUrl": None,          # played via YouTube IFrame
        "duration": duration,
        "source": "youtube",
        "trackViewUrl": f"https://music.youtube.com/watch?v={video_id}",
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/search")
async def search(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)):
    """Search YouTube Music for songs matching the query."""
    try:
        results = yt.search(q, filter="songs", limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    tracks = [t for t in (_format_track(item) for item in results) if t]
    return {"query": q, "total": len(tracks), "tracks": tracks}


@app.get("/api/trending")
async def trending():
    """Fetch trending / mood-based tracks (uses home feed in auth mode)."""
    try:
        if AUTH_MODE == "oauth":
            home = yt.get_home(limit=3)
            items = []
            for shelf in home:
                items.extend(shelf.get("contents", []))
        else:
            # Guest fallback: search for chart toppers
            items = yt.search("top hits 2024", filter="songs", limit=20)

        tracks = [t for t in (_format_track(item) for item in items) if t]
        return {"tracks": tracks[:20]}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


# ── Auth Endpoints ────────────────────────────────────────────────────────────
class RegisterBody(BaseModel):
    email: str
    password: str
    name: str

class LoginBody(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register_user(body: RegisterBody):
    email = body.email.strip().lower()
    name = body.name.strip()
    password = body.password
    
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (email, name, password, email_verified) VALUES (?, ?, ?, 0)", (email, name, password))
        conn.commit()
        return {"email": email, "name": name, "email_verified": False}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    finally:
        conn.close()

@app.post("/api/auth/login")
def login_user(body: LoginBody):
    email = body.email.strip().lower()
    password = body.password
    
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT name, password, email_verified FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    
    name, db_password, email_verified = row
    if db_password != password:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    return {"email": email, "name": name, "email_verified": bool(email_verified)}



# ── SQLite Playlist Endpoints ──────────────────────────────────────────────────
@app.get("/api/playlists")
async def get_playlists(email: str = Query(...)):
    """Return the user's playlists from SQLite."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT playlistId, title, description FROM playlists WHERE user_email = ?", (email.lower(),))
    rows = c.fetchall()
    playlists = []
    for row in rows:
        pl_id, title, desc = row
        c.execute("SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = ?", (pl_id,))
        count = c.fetchone()[0]
        playlists.append({
            "playlistId": pl_id,
            "title": title,
            "description": desc,
            "count": count
        })
    conn.close()
    return {"playlists": playlists}


class CreatePlaylistBody(BaseModel):
    title: str
    description: str = ""


@app.post("/api/playlists")
async def create_playlist(body: CreatePlaylistBody, email: str = Query(...)):
    """Create a new playlist in SQLite."""
    import uuid
    pl_id = str(uuid.uuid4())
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("INSERT INTO playlists (playlistId, user_email, title, description) VALUES (?, ?, ?, ?)",
              (pl_id, email.lower(), body.title, body.description))
    conn.commit()
    conn.close()
    return {"playlistId": pl_id, "title": body.title}


class AddItemBody(BaseModel):
    videoId: str
    title: str
    artist: str
    album: str = ""
    cover: str = ""
    duration: int = 0


@app.post("/api/playlists/{playlist_id}/items")
async def add_playlist_item(playlist_id: str, body: AddItemBody):
    """Add a track to a playlist in SQLite."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT 1 FROM playlists WHERE playlistId = ?", (playlist_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    c.execute("SELECT 1 FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?", (playlist_id, body.videoId))
    if not c.fetchone():
        c.execute("""
            INSERT INTO playlist_tracks (playlist_id, video_id, title, artist, album, cover, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (playlist_id, body.videoId, body.title, body.artist, body.album, body.cover, body.duration))
        conn.commit()
    conn.close()
    return {"status": "ok"}


@app.delete("/api/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str):
    """Delete a playlist from SQLite."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("DELETE FROM playlists WHERE playlistId = ?", (playlist_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.get("/api/playlist/{playlist_id}")
async def get_playlist(playlist_id: str):
    """Get tracks inside a playlist from SQLite."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT title, description FROM playlists WHERE playlistId = ?", (playlist_id,))
    pl_row = c.fetchone()
    if not pl_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    title, desc = pl_row
    
    c.execute("""
        SELECT video_id, title, artist, album, cover, duration 
        FROM playlist_tracks 
        WHERE playlist_id = ?
    """, (playlist_id,))
    rows = c.fetchall()
    tracks = []
    for row in rows:
        v_id, t_title, artist, album, cover, duration = row
        tracks.append({
            "id": f"youtube_{v_id}",
            "videoId": v_id,
            "title": t_title,
            "artist": artist,
            "album": album,
            "cover": cover,
            "duration": duration,
            "source": "youtube",
            "trackViewUrl": f"https://music.youtube.com/watch?v={v_id}"
        })
    conn.close()
    return {
        "playlistId": playlist_id,
        "title": title,
        "description": desc,
        "tracks": tracks
    }


@app.get("/api/lyrics")
def get_lyrics(title: str, artist: str):
    """Fetch lyrics from LRCLIB"""
    import requests
    headers = {"User-Agent": "DecibelMusicPlayer/1.0 (https://github.com/user/decibel-web)"}
    clean_title = title.split(" (feat.")[0].split(" feat.")[0].split(" (with")[0]
    clean_artist = artist.split(",")[0].split("&")[0].strip()
    
    url = "https://lrclib.net/api/get"
    params = {"artist_name": clean_artist, "track_name": clean_title}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            return {
                "plainLyrics": data.get("plainLyrics"),
                "syncedLyrics": data.get("syncedLyrics"),
                "instrumental": data.get("instrumental", False)
            }
        elif r.status_code == 404:
            r_search = requests.get("https://lrclib.net/api/search", params={"q": f"{clean_title} {clean_artist}"}, headers=headers, timeout=5)
            if r_search.status_code == 200:
                results = r_search.json()
                if results:
                    best = results[0]
                    return {
                        "plainLyrics": best.get("plainLyrics"),
                        "syncedLyrics": best.get("syncedLyrics"),
                        "instrumental": best.get("instrumental", False)
                    }
    except Exception as e:
        print(f"[Decibel] Lyrics fetch error: {e}")
    return {"plainLyrics": None, "syncedLyrics": None, "instrumental": False}


@app.get("/api/status")
async def status():
    return {"status": "ok", "auth": AUTH_MODE}


@app.get("/api/health")
async def health():
    """Simple status check for API health monitoring."""
    import sqlite3
    db_connected = False
    try:
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        c.execute("SELECT 1")
        c.fetchone()
        conn.close()
        db_connected = True
    except Exception as e:
        print(f"[Decibel] Health Check DB Error: {e}")
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "auth_mode": AUTH_MODE
    }


class VerifyEmailBody(BaseModel):
    email: str
    code: str

@app.post("/api/auth/verify-email")
def verify_email(body: VerifyEmailBody):
    email = body.email.strip().lower()
    code = body.code.strip()
    if code != "123456":
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("UPDATE users SET email_verified = 1 WHERE email = ?", (email,))
    conn.commit()
    conn.close()
    return {"status": "ok", "email_verified": True}


@app.get("/api/recommendations")
async def get_recommendations(videoId: Optional[str] = None, title: Optional[str] = None, artist: Optional[str] = None):
    try:
        items = []
        if videoId:
            try:
                playlist = yt.get_watch_playlist(videoId=videoId, limit=10)
                tracks_list = playlist.get("tracks", [])
                items = tracks_list[1:11]
            except Exception as e:
                print(f"[Decibel] get_watch_playlist failed: {e}")
        if not items and title and artist:
            q = f"similar to {artist} {title}"
            items = yt.search(q, filter="songs", limit=10)
        
        tracks = [t for t in (_format_track(item) for item in items) if t]
        return {"tracks": tracks[:8]}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))




# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
