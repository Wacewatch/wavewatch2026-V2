# WaveWatch PRD

## What's Been Implemented

### Sessions 1-10
- Admin modules, TV/Retrogaming, Recherche, Themes, Series, Notifications, Filters, Playlists, Grades

### Session 11 - Anti-Spoiler, Auto-Mark, Changelogs
- Anti-spoiler mode, auto-mark watched, playlist button on all detail pages, changelogs from admin

### Session 12 (Jan 2026) - Notifications & Universal Playlists Enhanced
- **Episode Notifications**: Subscribe bell button on TV show pages, background check every 6h for new episodes of subscribed series
- **Movie Release Notifications**: Auto-notify users when favorited upcoming movies release
- **Backend**: POST /api/notifications/subscribe-series, GET /check-series/{id}, GET /subscribed-series, POST /check-new-episodes
- **Playlist Embed Modals**: TV channels, radio, retrogaming items in playlists open embed modal (iframe/audio player)
- **TV Channel + Radio Playlist Buttons**: QuickPlaylistAdd added to TVChannelsPage and RadioPage
- **Playlist Item Badges**: All content types now have correct badges: Film, Serie, Episode, Acteur, Musique, Jeu, Ebook, Logiciel, Chaine TV, Radio, Retrogaming  
- **Episode Metadata**: Episodes in playlists show series name + S/E numbers, navigate to correct episode page
- **Navigation Fix**: All content types in playlists navigate to correct detail pages (ebooks→/ebooks/{id}, software→/software/{id}, games→/games/{id}, actors→/actors/{id})
- **Metadata Support**: AddToPlaylistButton and QuickPlaylistAdd pass metadata (stream_url, series_id, etc)

## Admin Credentials
- Email: admin@wavewatch.com / Password: WaveWatch2026!

## Backlog
- [ ] Full video player integration
- [ ] Retrogaming QuickPlaylistAdd on game cards
