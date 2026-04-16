# WaveWatch PRD

## What's Been Implemented

### Sessions 1-6 
- Admin modules, TV/Retrogaming fix, Recherche globale, Themes CSS, Series, Notifications

### Session 7-8
- Footer Avis, Grid Layout Fix, Advanced Filters (Platform/Sort/Year)

### Session 9 - Batch Fixes
- Watch Party removed, LiveWatch Secours removed, Scroll fix, Like/Dislike counts, VIP disabled

### Session 10 - Universal Playlists & Grades
- Universal playlists, popup fix (portal), grade hierarchy, playlist sorting, profile prefs base

### Session 11 (Jan 2026) - Anti-Spoiler, Auto-Mark, Changelogs
- **Anti-Spoiler Mode**: Episode still images blurred + synopsis hidden when hide_spoilers=true and episode not watched
- **Auto-Mark Watched**: Clicking "Regarder" on movie/series/episode auto-marks as watched (based on auto_mark_watched preference)
- **Playlist Button on ALL Detail Pages**: Added AddToPlaylistButton to Episode, Ebook, Software, Game, Music, Actor detail pages
- **Quick-Add Create**: "+" popup now has "+ Nouvelle" button to create playlist inline
- **Playlist Like/Dislike Fixed**: Changed parseInt(id) to string id for MongoDB ObjectId compatibility
- **Changelogs from Admin**: ChangelogsPage now fetches from /api/changelogs (merges admin-created entries with defaults)
- **Admin Module Order**: HomePage reads module_order setting to render modules in admin-defined order

## Grade Hierarchy
1. Admin (full + VIP + VIP+)
2. Uploader (VIP + VIP+ benefits)
3. VIP+
4. VIP
5. Membre

## Admin Credentials
- Email: admin@wavewatch.com / Password: WaveWatch2026!

## Backlog
- [ ] Full video player integration
- [ ] Notification push for new episodes
