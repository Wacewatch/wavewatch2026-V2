# WaveWatch PRD

## What's Been Implemented

### Sessions 1-5
- Admin modules drag & drop, TV/Retrogaming fix, Recherche globale, 6 Themes CSS, Series resume/mark all
- Promos LiveWatch/Sports-Stream, VIP Playlists, Calendrier, Collections detail, TMDB Totals
- All modules as sliders (Acteurs, TV, Collections, Prochaines Sorties), Badges S/E, Notifications avancees

### Session 6
- **Sync Admin Modules** : Le module "Recommandations" ajoute a l'admin (etait le seul non controle)
- Tous les 16 modules homepage sont maintenant dans l'admin Modules avec activation/desactivation/reordonnement

### Session 7 (Jan 2026)
- **Watch Party (Soiree Cine)** : Nouvelle fonctionnalite permettant aux utilisateurs de regarder des films/series ensemble
  - Backend: 10+ endpoints API (CRUD, join/leave, chat en temps reel, controles hote)
  - Frontend: Page listing/creation (WatchPartyPage.js) + Salle de visionnage avec chat (WatchPartyRoomPage.js)
  - Codes de salle (room codes) pour inviter des amis
  - Controles hote (play/pause/end)
  - Chat temps reel (polling 3s)
  - Validation ObjectId robuste (supporte codes de salle et ObjectId)
  - Navigation: Lien "Soiree Cine" dans les menus desktop et mobile
  - Tests: 92% pass rate (backend 90%, frontend 95%)

## Tech Stack
- Frontend: React 18 + Tailwind CSS (CRA), Backend: FastAPI + Python, Database: MongoDB, API: TMDB

## Architecture
- `/app/frontend/` - React CRA (port 3000)
- `/app/backend/` - FastAPI (port 8001)
- `/app/` root - Next.js legacy files (not actively running)
- MongoDB local (localhost:27017, DB: wavewatch)

## Core Features
- Films, Series TV, Anime browsing via TMDB API
- Authentication (JWT cookies + Bearer token, brute force protection)
- User profiles, favorites, watch history, playlists
- Admin panel (user management, content CRUD, modules, broadcasting)
- TV Channels, Radio, Retrogaming, Ebooks, Software
- VIP system, Achievements, Leaderboard
- Notification system (episode releases, messages)
- Multi-theme support (10 free + 2 limited + 5 premium)
- **Watch Party (Soiree Cine)** - NEW

## User Personas
- Casual viewer: Browse, search, watch content
- VIP member: Premium themes, custom playlists, priority features
- Admin: Full platform management
- Social user: Watch parties, playlists sharing, community

## Backlog
- [ ] WebSocket real-time for Watch Party (currently polling)
- [ ] Video player integration in Watch Party rooms
- [ ] Watch Party invite notifications
- [ ] Watch Party history/replay

## P0 (Done)
- Watch Party creation, joining, chat, host controls

## P1 (Next)
- WebSocket upgrade for real-time sync
- Invite system via notifications

## P2 (Future)
- Watch Party scheduling
- Watch Party reactions/emojis
