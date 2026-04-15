# WaveWatch PRD

## Original Problem Statement
Rebuild the WaveWatch streaming platform completely from the GitHub repo (https://github.com/Wacewatch/Wavewatch2026) with all features, options, and functionality identical to the original.

## Architecture
- **Original**: Next.js 16 + Supabase + TMDB API + Tailwind CSS v4
- **Rebuilt**: React 18 + FastAPI + MongoDB + TMDB API + Tailwind CSS 3

## What's Been Implemented (Jan-Apr 2026)

### Backend (80+ API endpoints)
- JWT Auth (register, login, logout, me, refresh, brute force protection)
- TMDB Proxy (trending, popular, search, details, credits, similar, collections, genres, discover, upcoming, persons)
- Favorites CRUD, Watch History (batch upsert)
- Playlists (full CRUD with items, public discovery)
- Feedback (guestbook), Staff Messages (admin reply)
- Content Requests (voting), Admin (stats, users, settings, cinema rooms)
- TV Channels, Radio, Retrogaming, Ebooks, Software
- VIP Game (daily spin), Achievements (8 badges), Leaderboard
- **NEW (Apr 15, 2026):** Admin CRUD for TV Channels, Radio, Music, Software, Games, Ebooks, Retrogaming
- **NEW:** Changelogs CRUD, Broadcast messaging, Content Requests admin management
- **NEW:** Enhanced stats (/api/admin/enhanced-stats, /api/user/detailed-stats)
- **NEW:** User ratings (like/dislike) system
- **NEW:** Admin content requests management (approve/reject/delete)

### Frontend (49+ pages, 20+ components)
- **Homepage**: Hero + 15 sections (trending, collections, playlists, actors, TV channels, promos, widgets)
- **Content**: Movies, TV, Anime (listing + detail + season + episode) with Playlist & Favorite buttons
- **ContentCard**: Quick "+" playlist add button on hover with dropdown
- **Search**: Autocomplete with real-time suggestions (posters, types, years) + debounce
- **Playlist System**: Create/manage/view/add items from detail pages and content cards, discover public playlists
- **Dashboard**: **ENHANCED** - Collapsible sections, detailed stats (time/likes/dislikes), achievements grid, history/favorites tabs with thumbnail grids, feedback link, interesting facts
- **User**: Favorites, Watch History, Playlists, Profile, Achievements, Leaderboard
- **Specialized**: Sport, Documentaires, Spectacles, Calendar, Actors, Collections
- **Media**: TV Channels, Radio FM, Music, Retrogaming, Games
- **Admin**: **ENHANCED** - 15 tabs (Dashboard, Broadcast, TV, Radio, Music, Software, Games, Ebooks, Retrogaming, Requests, Users, Staff, Changelogs, Modules, Cinema) with full CRUD, search, pagination, user role filtering
- **Auth**: Login, Register, ProtectedRoute
- **Navigation**: Autocomplete search, Contenu/Medias dropdowns, Calendar/VIP links, full mobile menu
- **Logo**: Updated to user-provided URLs (imgur) in nav, footer, favicon
- 17 themes (standard + limited + premium/VIP-gated)

## Testing Status (6 iterations)
- Iteration 6: Backend 100%, Frontend 95%
- All major features working correctly
- Mark as watched button present and functional on Movies and TV shows

## User Personas
- **Free User**: Can browse, search, watch, create playlists, add favorites, mark as watched
- **VIP User**: Premium themes, VIP game, special badges
- **VIP+ User**: Additional premium themes, more features
- **Admin**: Full content management, user management, site settings, broadcast messaging
- **Uploader**: Can manage music, games, software, ebooks content

## Core Requirements
- French language UI
- Dark theme by default
- TMDB integration for movies/TV content
- User authentication with JWT
- Watch tracking and history
- Favorites system
- Playlist management
- Admin dashboard with content CRUD
- VIP/subscription system
- Theme system (17 themes)

## Prioritized Backlog
### P0 (Done)
- Logo and favicon update
- Enhanced Dashboard with collapsible sections
- Enhanced Admin with 15 content management tabs
- Backend CRUD endpoints for all content types
- Mark as watched button on movies and TV shows

### P1 (Next)
- Like/Dislike buttons on movie/tv detail pages (backend ready, frontend needed)
- Episode detail page "mark as watched" button improvements
- Content request voting from user side

### P2 (Later)
- Real-time online users counter in admin
- TMDB content update trigger from admin
- System health check dashboard
- User activity feed in admin

### P3 (Future)
- Interactive World 3D (excluded by user)
- Full music streaming with real audio
- Real playable browser games
- Ad gate modal

## Next Tasks
1. Add like/dislike buttons on movie and TV show detail pages
2. Improve episode detail page with mark as watched
3. Add content request voting from user side
4. Add admin user editing form (instead of just toggles)
