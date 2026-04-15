# WaveWatch PRD

## Architecture
- React 18 + FastAPI + MongoDB + TMDB API + Tailwind CSS 3

## What's Been Implemented (Jan-Apr 2026)

### Backend (110+ API endpoints)
- JWT Auth, TMDB Proxy, Favorites, Watch History, Playlists (full CRUD + colors)
- Feedback, Staff Messages, Content Requests, Admin CRUD for all content types
- VIP Game, Achievements, Leaderboard, Online Users tracking (heartbeat)
- Platform Reviews (1-10 ratings + guestbook), User Messaging, Admin Activity Feed
- TMDB Update admin trigger, Enhanced public playlists with user info & ratings
- User Ratings (like/dislike), Profile management (preferences, password, activation codes, account deletion)

### Frontend (49+ pages, 30+ components)
- **Hero**: Movie logo from TMDB /images API (fr/en/null fallback)
- **ContentCard**: Hover overlay with Eye (mark watched) + Plus (playlist) buttons, Fav/Watched badges
- **Dashboard**: Rating bars 1-10 (colored red/yellow/green), Guestbook, Community reviews with user badges, Collapsible sections, Stats, Achievements, History/Favorites tabs
- **Admin**: 17 tabs (Stats, Broadcast, TV, Radio, Music, Software, Games, Ebooks, Retro, Requests, Users, Staff, Changelogs, Modules, Cinema, Feed, TMDB), Online users counter, User edit modal
- **Profile**: Avatar, bio, location, themes, VIP status, preferences, password, activation codes, account deletion
- **Playlists**: Color customization (12 colors: standard + VIP + VIP+)
- **Discover Playlists**: Likes/dislikes count, item count, user badges
- **Detail Pages**: Like/Dislike + Favoris + Marquer vu on Movies, TV Shows, Episodes, Actors, Playlists

### Roles: Membre, VIP (vip2025), VIP+ (vipplus2025), Uploader (uplo2025#), Admin (45684568)

## Testing: Iteration 8 - Backend 96.2%, Frontend 90%

## Next Tasks
- User messaging page (frontend for /api/messages)
- Admin user search improvements
- Content recommendations based on watch history
