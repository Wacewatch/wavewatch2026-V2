# WaveWatch PRD

## What's Been Implemented

### Sessions 1-6
- Admin modules, TV/Retrogaming fix, Recherche globale, 6 Themes CSS, Series resume/mark all
- Promos LiveWatch/Sports-Stream, VIP Playlists, Calendrier, Collections detail, TMDB Totals
- All modules as sliders, Badges S/E, Notifications avancees, Sync Admin Modules

### Session 7 - Footer Avis communaute
### Session 8 - Grid Layout Fix + Advanced Filters (Platform, Sort, Year)

### Session 9 - Batch Fixes
- Watch Party removed, LiveWatch Secours removed, Scroll-to-top fix
- Like/Dislike counts on detail pages, Dashboard Recommendations removed
- VIP purchase buttons disabled, Playlist popup z-index fix

### Session 10 (Jan 2026) - Universal Playlists & Grades
- **Universal Playlists**: PlaylistItemAdd accepts Any content_id (string or int) + any content_type (movie, tv, actor, episode, music, game, ebook, software, tv_channel, radio)
- **Playlist Popup Fixed**: Uses ReactDOM.createPortal to render on document.body, no more z-index/overflow issues
- **Grade Hierarchy**: serialize_user() gives uploader/admin users is_vip=true and is_vip_plus=true automatically
- **Playlist Sorting**: Discover playlists supports sort by recent/likes/size, uploaders always shown first
- **Profile Preferences**: Adult content filter (include_adult param), hide watched content (ContentCard hides watched items), auto-mark watched, anti-spoiler mode
- **Backend**: DELETE /api/playlists/{id}/items/{content_id} accepts string IDs

## Tech Stack
- Frontend: React 18 + Tailwind CSS (CRA), Backend: FastAPI, Database: MongoDB, API: TMDB

## Grade Hierarchy
1. Admin (full access + VIP + VIP+)
2. Uploader (VIP + VIP+ benefits)
3. VIP+
4. VIP
5. Membre

## Admin Credentials
- Email: admin@wavewatch.com
- Password: WaveWatch2026!

## Backlog
- [ ] Full anti-spoiler mode (hide episode synopsis/images for unwatched episodes)
- [ ] Auto-mark watched on play click integration
