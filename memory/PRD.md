# WaveWatch PRD

## What's Been Implemented

### Sessions 1-6
- Admin modules, TV/Retrogaming fix, Recherche globale, 6 Themes CSS, Series resume/mark all
- Promos LiveWatch/Sports-Stream, VIP Playlists, Calendrier, Collections detail, TMDB Totals
- All modules as sliders, Badges S/E, Notifications avancees, Sync Admin Modules

### Session 7 (Jan 2026)
- Footer Avis communaute: Seeded 6 default platform reviews

### Session 8 (Jan 2026) 
- Grid Layout Fix: Multi-row grid on Movies, TV Shows, Anime pages
- Advanced Filters: Plateforme, Tri, Annee on all listing pages

### Session 9 (Jan 2026) - Batch Fixes
- **Watch Party REMOVED**: Entire feature removed (routes, nav, backend endpoints)
- **LiveWatch Secours REMOVED**: Removed from navigation dropdown
- **Scroll-to-top Fix**: Added ScrollToTop component that only scrolls on route changes (not filter/search params)
- **Like/Dislike Counts**: LikeDislike component now shows numeric counts via /api/ratings/counts endpoint
- **Rating Counts Endpoint**: New public GET /api/ratings/counts?content_id=X&content_type=Y
- **Dashboard Recommendations REMOVED**: Section removed (already on homepage)
- **VIP Purchase DISABLED**: Buttons show "Bientot disponible" with clock icon
- **Playlist Popup Fix**: Changed from overflow-hidden to fixed position overlay
- **Rating System Fix**: content_id accepts both string and int for playlist compatibility

## Tech Stack
- Frontend: React 18 + Tailwind CSS (CRA), Backend: FastAPI, Database: MongoDB, API: TMDB

## Grade Hierarchy
1. Admin (full access)
2. Uploader (VIP + VIP+ benefits)  
3. VIP+
4. VIP
5. Membre

## Backlog
- [ ] Universal playlists (add any content type)
- [ ] Profile preferences implementation (adult content, hide watched, auto-mark, anti-spoiler)
- [ ] Playlist sorting (size, likes, grade, type)
- [ ] Uploader playlists priority in public lists
