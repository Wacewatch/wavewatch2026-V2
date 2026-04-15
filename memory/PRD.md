# WaveWatch PRD

## Original Problem Statement
Rebuild the WaveWatch streaming platform completely from the GitHub repo (https://github.com/Wacewatch/Wavewatch2026) with all features, options, and functionality identical to the original.

## Architecture
- **Original**: Next.js 16 + Supabase + TMDB API + Tailwind CSS v4
- **Rebuilt**: React 18 + FastAPI + MongoDB + TMDB API + Tailwind CSS 3

## What's Been Implemented (Jan-Apr 2026)

### Backend (55+ API endpoints)
- JWT Auth (register, login, logout, me, refresh, brute force protection)
- TMDB Proxy (trending, popular, search, details, credits, similar, collections, genres, discover, upcoming, persons)
- Favorites CRUD (toggle, check, list)
- Watch History (add, list, batch upsert)
- Playlists (create, delete, add/remove items, public discovery)
- Feedback (submit, stats with guestbook)
- Staff Messages (send, list, admin reply)
- Content Requests (create, list, vote)
- Admin (stats, user management, site settings, cinema rooms CRUD)
- TV Channels, Radio Stations, Retrogaming, Ebooks, Software
- VIP Game (daily spin, winners list)
- Achievements (8 badges based on user activity)
- Leaderboard (top supporters, VIP winners)
- Cinema Rooms (create, delete, list)

### Frontend (37+ pages)
- **Homepage**: Hero carousel + 15 sections (Films/Series/Anime Tendance, Collections Populaires, Playlists Communaute, Acteurs Tendance, Chaines TV, Sports Promo, LiveWatch Promo, VIP Game Promo, Subscription Offer, Random Content, Football Calendar, Calendar Widget, Films/Series Populaires)
- **Content**: Movies, TV Shows, Anime (listing + detail + season + episode)
- **Specialized**: Sport, Documentaires, Spectacles, Calendar, Actors, Collections
- **Media**: TV Channels, Radio FM, Music, Retrogaming, Games
- **User**: Dashboard, Favorites, Watch History, Playlists, Profile, Achievements
- **Social**: Content Requests, Discover Playlists, Leaderboard, Contact Staff
- **Info**: FAQ, DNS/VPN, Subscription, Changelogs
- **Admin**: Stats, User Management, Staff Messages, Home Modules Settings, Cinema Rooms
- **Auth**: Login, Register, ProtectedRoute wrapper
- **Misc**: Ebooks, Software, VIP Game (spin wheel)
- **Navigation**: Full desktop dropdowns (Contenu 10 items, Medias 7 items) + Calendrier + VIP links + full mobile menu
- **Footer**: Community feedback/guestbook + links

### Key Features
- 17 themes (standard + limited + premium/VIP-gated)
- Admin home module toggles (enable/disable homepage sections)
- Achievement badges (8 badges based on activity)
- VIP daily game (5% win chance, 30-day VIP)
- Cinema rooms management (admin)
- Full responsive design
- Protected routes (auth-gated pages)

## Testing Status
- Backend: 27/27 tests passed (iteration_3.json)
- Frontend: All UI tests passed (iteration_3.json)
- All navigation, auth, admin, and content flows verified

## Prioritized Backlog (Remaining)
### P3 (Future/Backlog)
- Interactive World (3D experience - excluded by user request)
- Full music streaming with real audio sources
- Real playable browser games (2048, Snake, Memory implementations)
- Ad gate modal (Monetag integration)
- Autocomplete search with dropdown suggestions
- Content status badges on cards (watched/favorited markers)
- Classification badges (age ratings)
