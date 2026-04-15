# WaveWatch PRD

## What's Been Implemented

### Sessions 1-5
- Admin modules drag & drop, TV/Retrogaming fix, Recherche globale, 6 Themes CSS, Series resume/mark all
- Promos LiveWatch/Sports-Stream, VIP Playlists, Calendrier, Collections detail, TMDB Totals
- All modules as sliders (Acteurs, TV, Collections, Prochaines Sorties), Badges S/E, Notifications avancees

### Session 6
- **Sync Admin Modules** : Tous les 16 modules homepage dans l'admin avec activation/desactivation/reordonnement

### Session 7 (Jan 2026)
- **Watch Party (Soiree Cine)** : Create/join rooms, room codes, real-time chat, host controls
- **Footer Avis** : Seeded 6 default platform reviews so "Avis de la communaute" section displays

### Session 8 (Jan 2026)
- **Grid Layout Fix** : Replaced single-row horizontal slider (ContentGrid) with multi-row CSS grid on Movies, TV Shows, and Anime pages (grid-cols-2 sm:3 md:4 lg:5 xl:6)
- **Advanced Filters** : Added to all 3 listing pages:
  - Plateforme: Netflix, Disney+, Amazon Prime, Apple TV+, Canal+, OCS, Max, Paramount+, Crunchyroll, YouTube Premium (with TMDB logos)
  - Trier par: Popularite, Note, Date, Recettes (asc/desc)
  - Annee: Dropdown des 30 dernieres annees
  - Bouton "Effacer" pour reset
  - URL params sync for shareable filter links
- **Backend Discover Enhancement** : Added provider, year, vote_avg params to /api/tmdb/discover/{media_type}
- **Watch Providers Endpoint** : GET /api/tmdb/providers/{media_type}

## Tech Stack
- Frontend: React 18 + Tailwind CSS (CRA at /app/frontend), Backend: FastAPI, Database: MongoDB, API: TMDB

## Backlog
- [ ] WebSocket real-time for Watch Party
- [ ] Video player integration in Watch Party rooms
- [ ] Watch Party invite notifications
