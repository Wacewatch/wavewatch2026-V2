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
20. Calendar (upcoming releases)
21. Changelogs page
22. Sport page
23. Documentaires page
24. Spectacles page
25. Popular Actors page
26. VIP Game (daily spin wheel)
27. Watch History
28. Music player page
29. Games page
30. Protected routes (auth-gated pages)

## What's Been Implemented (Jan-Apr 2026)
- Full FastAPI backend with 55+ API endpoints
- TMDB API proxy (trending, popular, search, details, credits, similar, collections, genres, discover, upcoming, popular persons)
- JWT authentication (register, login, logout, me, refresh, brute force protection)
- MongoDB models (users, favorites, watch_history, playlists, feedback, staff_messages, content_requests, site_settings, vip_games)
- Complete React frontend with 35+ pages
- Navigation with Contenu/Medias dropdowns + Calendrier + VIP links
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
- Footer with community feedback/guestbook + Nouveautes link
- 17 themes (all from original)
- Full responsive design
- **Calendar page** with TMDB upcoming movies and TV shows
- **Changelogs page** with version history
- **Sport page** with live/replay sports content
- **Documentaires page** with documentary catalog
- **Spectacles page** with theater/opera/comedy catalog
- **Popular Actors page** with TMDB popular persons + pagination
- **VIP Game page** with daily spin wheel (5% chance, 30-day VIP prize)
- **Watch History page** (auth-gated, shows viewing history)
- **Music page** with playlists, player bar, search
- **Games page** with browser games catalog
- **ProtectedRoute** component for auth-gated pages (Dashboard, Profile, Favorites, Playlists, Admin)
- Complete mobile navigation with all sections

## Testing Status
- Backend: 21/21 tests passed (iteration_2.json)
- Frontend: 28/28 UI tests passed (iteration_2.json)
- All navigation flows verified
- Auth flow (login/register/protected routes) verified

## Prioritized Backlog
### P0 (Critical) - ALL DONE
- All core features implemented and tested

### P1 (High) - DONE
- Calendar widgets (movie releases) - DONE
- VIP daily game (spin wheel) - DONE
- Watch history page - DONE
- Music player page - DONE
- Games page - DONE
- Protected routes - DONE

### P2 (Medium) - DONE
- Changelogs page - DONE
- Spectacles page - DONE
- Sport page - DONE
- Documentaires page - DONE
- Popular Actors page - DONE

### P3 (Future/Backlog)
- Interactive World (3D experience - excluded by user request)
- Achievement/badge system
- Top supporters/leaderboard
- Ad gate modal
- Full music streaming with real audio
- Real game implementations (2048, Snake, etc.)
