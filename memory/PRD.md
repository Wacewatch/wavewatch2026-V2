# WaveWatch PRD

## Original Problem Statement
Rebuild the WaveWatch streaming platform completely from the GitHub repo (https://github.com/Wacewatch/Wavewatch2026) with all features, options, and functionality identical to the original.

## Architecture
- **Original**: Next.js 16 + Supabase + TMDB API + Tailwind CSS v4
- **Rebuilt**: React 18 + FastAPI + MongoDB + TMDB API + Tailwind CSS 3

## Core Requirements
1. Content browsing: Movies, TV Shows, Anime via TMDB API
2. Authentication: JWT + MongoDB (replacing Supabase)
3. User profiles with roles: Admin, VIP, VIP+, Uploader, Standard
4. Favorites system (database-backed)
5. Playlists (create, manage, public/private)
6. Multi-content search
7. 15+ themes (dark, light, ocean, forest, midnight, aurora, desert, lavender, crimson, jade, premium, royal, neon, emerald, cosmic, halloween, christmas)
8. TV Channels, Radio FM, Retrogaming
9. Ebooks and Software catalog
10. Admin panel (users, stats, messages)
11. Content requests with voting
12. Staff messaging
13. FAQ, DNS/VPN info pages
14. VIP subscription page
15. Movie/TV detail pages with streaming, download, trailer modals
16. Season/episode detail pages
17. Actor/Director filmography pages
18. Collections/Sagas pages
19. Feedback/Guestbook in footer

## What's Been Implemented (Jan 2026)
- Full FastAPI backend with 50+ API endpoints
- TMDB API proxy (trending, popular, search, details, credits, similar, collections, genres, discover)
- JWT authentication (register, login, logout, me, refresh, brute force protection)
- MongoDB models (users, favorites, watch_history, playlists, feedback, staff_messages, content_requests, site_settings)
- Complete React frontend with 25+ pages
- Navigation with Contenu/Medias dropdowns
- Hero section with auto-rotating trending movies
- Movies/TV Shows/Anime listing with genre filters and pagination
- Movie/TV Show detail pages with backdrop, poster, logo, cast, similar content, collection/saga
- Streaming/Download/Trailer modal integration (wwembed.wavewatch.xyz)
- Search page with multi-content results
- Dashboard with user stats
- Favorites page (DB-backed)
- Playlists management (create, delete, public/private)
- Discover public playlists
- Profile editing
- Admin panel (stats, user management, message replies)
- Content requests with voting system
- Contact staff messaging
- TV Channels, Radio FM, Retrogaming, Ebooks, Software pages
- FAQ, DNS/VPN, Subscription pages
- Season and Episode detail pages
- Actor/Director detail pages with filmography
- Collections search page
- Footer with community feedback/guestbook
- 17 themes (all from original)
- Full responsive design

## Prioritized Backlog
### P0 (Critical) - DONE
- All core features implemented

### P1 (High)
- Interactive World (3D experience) - was using Three.js/React Three Fiber
- Music player page
- Games page  
- VIP daily game (spin wheel)
- Watch history tracking
- Calendar widgets (movie releases, football)

### P2 (Medium)
- Changelogs page
- Spectacles page
- Sport page
- Documentaires page
- Ad gate modal
- Top supporters/leaderboard
- Achievement system

## Next Tasks
1. Add VIP game (daily spin to win VIP)
2. Add watch history page in dashboard
3. Implement Interactive World with 3D elements
4. Add calendar widgets
5. Implement music and games sections
