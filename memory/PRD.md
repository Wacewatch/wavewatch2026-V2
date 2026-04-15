# WaveWatch PRD

## Original Problem Statement
Rebuild the WaveWatch streaming platform from GitHub repo with all features identical to the original.

## Architecture
- **Original**: Next.js 16 + Supabase + TMDB API + Tailwind CSS v4
- **Rebuilt**: React 18 + FastAPI + MongoDB + TMDB API + Tailwind CSS 3

## What's Been Implemented (Jan-Apr 2026)

### Backend (95+ API endpoints)
- JWT Auth (register, login, logout, me, refresh, brute force protection)
- TMDB Proxy (trending, popular, search, details, credits, similar, collections, genres, discover, upcoming, persons)
- Favorites CRUD, Watch History (batch upsert)
- Playlists (full CRUD with items, public discovery)
- Feedback (guestbook), Staff Messages (admin reply)
- Content Requests (voting), Admin (stats, users, settings, cinema rooms)
- TV Channels, Radio, Retrogaming, Ebooks, Software
- VIP Game (daily spin), Achievements (8 badges), Leaderboard
- Admin CRUD for TV Channels, Radio, Music, Software, Games, Ebooks, Retrogaming
- Changelogs CRUD, Broadcast messaging, Content Requests admin management
- Enhanced stats, User ratings (like/dislike), User heartbeat/online tracking
- Profile management (preferences, password change, activation codes, account deletion)
- User status batch check for content card overlays

### Frontend (49+ pages, 25+ components)
- **Homepage**: Hero + 15 sections with ContentCard overlays (favorite/watched badges)
- **Content Detail Pages**: Movies, TV, Episodes, Actors, Playlists all with Like/Dislike buttons, Favoris, Mark as Watched
- **Mark as Watched**: Improved visual feedback (green glow animation, "Deja vu" text)
- **Dashboard**: Collapsible sections, detailed stats, achievements, history/favorites tabs
- **Profile**: COMPLETE - Avatar, bio, location, themes (standard + VIP), VIP status, content preferences (adult/watched/auto-mark/anti-spoiler), messaging preferences, password change, activation codes, privilege removal, account deletion
- **Admin**: 15 tabs with full CRUD, online users counter (real-time), user edit modal with role management
- **ContentCard**: Overlay icons showing favorite (heart) and watched (eye) badges on all thumbnails
- **Like/Dislike**: Reusable component on all detail pages
- **Auth**: Login, Register, ProtectedRoute
- **Navigation**: Logo image, autocomplete search, theme switcher
- 17 themes (standard + limited/premium/VIP-gated)

### Roles System
- **Membre** : Standard user (default on registration)
- **VIP** : Premium themes, VIP game (code: vip2025)
- **VIP+** : Additional premium features (code: vipplus2025)
- **Uploader** : Can manage music, games, software, ebooks (code: uplo2025#)
- **Admin** : Full platform management (code: 45684568)

## Testing Status (7 iterations)
- Iteration 7: Backend 100% (39/39), Frontend 95%
- All major features working correctly

## Prioritized Backlog
### P0 (Done - All completed)
- Logo/favicon update, Enhanced Dashboard, Enhanced Admin with 15 tabs
- Like/Dislike on all detail pages
- Online users counter in admin
- User edit form in admin
- Improved mark as watched visual feedback
- Content card overlays (fav/watched badges)
- Complete Profile page with all original features
- Roles system (membre, vip, uploader, admin)

### P1 (Next)
- Content request voting from user side improvements
- Admin activity feed (recent user actions)
- User messaging system between users

### P2 (Later)
- TMDB content update trigger from admin
- System health check dashboard
- Real music streaming with audio player

### P3 (Future)
- Interactive World 3D
- Real playable browser games
- Ad gate modal
