# WaveWatch PRD

## Stack réelle
- **Backend** : FastAPI + MongoDB (`/app/backend/server.py`, port 8001)
- **Frontend** : React CRA (`/app/frontend/`, port 3000)
- **Legacy v0.dev / Supabase** : déplacé dans `/app/_legacy/` (non exécuté, à supprimer au besoin)

## Session 14 (Jan 2026) - Sliders, Favoris Universels, Notifications Playlists
- **Similar en slider** : Films similaires et Series similaires en ligne horizontale scrollable
- **Favoris universels** : content_id accepte string/int - tout est favori-able (ebook, logiciel, playlist, chaine TV, radio, etc)
- **Page Favoris refaite** : Badges par type, filtres, dates "Ajoute le", bouton supprimer
- **Notifications playlist** : Bouton cloche sur playlists d'autres users
- **Favoris playlist** : Bouton coeur
- **Retrogaming** : QuickPlaylistAdd sur les cartes de jeux retro

## Session 21 (Jan 2026) — Polish retours UX

### Retour 1 — Aucune icône "Télécharger" sur les jaquettes
- Icône `ExternalLink` retirée des cartes sur `/download-links`
- Aucun bouton de téléchargement visible nulle part sur les jaquettes (règle générale)

### Retour 2 — Groupement intelligent des épisodes consécutifs
- Côté backend : `/api/download-links` groupe par défaut les épisodes TV par (tmdb_id, season_number)
- **15 237 liens bruts → 3 003 contenus groupés**
- Format d'affichage : `S1 E1-10 · 10 ép.` (compressé avec plages ex `E1-5, E7-10`)
- Chaque groupe agrège : qualities[], languages[], resolutions[], uploaders_count, latest_created_at
- Paramètre `?group=false` disponible pour mode raw (retrocompat)
- Cache mémoire 30s avec clé sur filtres+flag group (2e requête ~0.1s)
- `/api/download-links/recent` inchangé (dédup pour slider home)

### Retour 3 — Filtre type dynamique
- Nouvel endpoint public `/api/download-links/media-types` → retourne les types distincts de Supabase
- Frontend charge dynamiquement le dropdown (s'adapte automatiquement si nouveaux types en DB)
- Label FR humanisé : movie→Films, tv→Séries, anime→Animes, etc.

### Validation
- Testing agent iteration 31 : **29/29 tests backend passés (100%)**
- Visuel vérifié : 3 003 contenus groupés, "S1 E1-4 · 4 ép." affiché, filtres dynamiques ✅

## Session 20 (Jan 2026) — Polish retours utilisateur

### Retour 1 — Retrait section "Liens de téléchargement" des pages détail
- `DownloadLinksSection` retiré de `MovieDetailPage` et `EpisodeDetailPage`
- Le bouton "Telecharger" bleu existant suffit (ouvre widget WWembed en iframe)

### Retour 2 — EpisodeDetailPage complète pour épisodes à venir
- Fallback image : si `episode.still_path` absent, on utilise `seriesInfo.backdrop_path` puis `poster_path`
- Badge "Image de la série" en bas à droite quand fallback
- Fallback synopsis : si `episode.overview` absent, on affiche celui de la série (titre "À propos de la série")

### Retour 3 — Page `/download-links` avec TOUS les liens + uploaders
- **Plus de déduplication** côté serveur → **15 237 liens** affichés au lieu de 22
- Chaque item expose `uploader_username` et `uploader_role` (join Supabase `profiles`)
- **Filtre uploader** via dropdown dynamique (9 uploaders listés)
- **Tris** ajoutés : uploader A→Z, uploader Z→A, qualité ↑↓
- Card affiche badge uploader + icône 👑 pour admins, liens externe direct via icône
- Pagination complète avec compteur "Page X / Y"
- Endpoint `/api/download-links/recent` inchangé (déduplication pour le slider home)

### Validation
- Testing agent iteration 30 : **21/21 tests backend passés (100%)**, zéro issue
- Screenshots live : 15 237 liens affichés, uploaders visibles, épisode "À venir" complet ✅

## Session 19 (Jan 2026) — Module "Liens de téléchargement" - Polish & Intégration

### Corrections UI du slider home
- Sous-titre par défaut retiré ("Les derniers ajouts…")
- Badge qualité passé en couleur PLEINE (FHD vert solide, 4K ambre, HD bleu) — très visible
- Badge S1E4 sur fond rouge solide avec texte blanc — contraste fort
- Langue (VOSTFR cyan) et résolution (1080p violet) = pills séparées colorées
- Gradient noir en bas plus opaque pour lisibilité

### Fix du routing (bug critique)
- Click sur carte du slider → route correcte `/tv-shows/:id/season/:s/episode/:e` pour séries/animes
- Films → `/movies/:id` (inchangé)
- Séries sans season/episode → `/tv-shows/:id`
- Helper `linkHref()` exporté pour réutilisation

### Intégration détail film/épisode
- Nouveau composant `DownloadLinksSection` : tableau des liens pour un TMDB spécifique
  - Colonnes : Source, Qualité (badge), Résolution, Langue (pill), Ajouté (il y a), Taille, Action "Télécharger" vert
  - Filtres dynamiques par qualité et langue au-dessus du tableau
  - Bouton "Télécharger" ouvre `source_url` en nouvel onglet
  - Icône "vérifié" pour les liens `is_verified=true`
- Injecté sur `MovieDetailPage` et `EpisodeDetailPage` sous les boutons principaux
- Bouton "Télécharger" manquant ajouté à `EpisodeDetailPage` (ouvre le widget wwembed en iframe)

### Validation
- Fait manuellement + navigation testée : click slider → page détail chargée correctement
- Lint OK sur tous les fichiers

## Session 18 (Jan 2026) — Module "Liens de téléchargement" (Supabase WWembed)

### Intégration Supabase sécurisée
- **Clés Supabase uniquement côté backend** (service role dans `/app/backend/.env` : `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
- Frontend n'a AUCUN accès direct à Supabase — proxy 100% via l'API WaveWatch
- Aucune fuite de credentials validée par testing agent (iter29)

### Endpoints backend
- `GET /api/download-links/recent?limit=N` : N derniers uniques (tmdb_id, media_type), enrichis TMDB (poster_path, title, backdrop_path, vote_average)
- `GET /api/download-links?page=X&limit=Y&quality=&media_type=&language=&q=&sort=` : liste paginée avec filtres + dédup
- `GET /api/download-links/for-content?tmdb_id=&media_type=&season=&episode=` : tous les liens d'un contenu
- `GET /api/download-links/config` : config publique du module
- `PUT /api/admin/download-links/config` : admin (clamp limit 4-30)
- `GET /api/admin/download-links/stats` : `{total, last_24h}` depuis Supabase
- Filtrage automatique : `is_active=true`, `is_valid=true`, `status=approved`
- Cache TMDB en mémoire (10 min) pour éviter le spam d'API

### Frontend
- **Composant slider** `DownloadLinksRow.js` : cartes jaquettes avec badge qualité coloré (FHD/4K/HD), icône movie/tv, S{n}E{n}, "il y a X", langue + résolution
- **Page complète** `DownloadLinksPage.js` (`/download-links`) : recherche + filtres type/qualité/langue + tri + pagination
- **Inséré dans HomePage** entre `popular_anime` et `popular_collections`
- Click sur jaquette → page détail film/série WaveWatch (route existante `/movies/:id` ou `/tv/:id`)

### Admin
- Nouvel onglet "Téléchargements" : toggle actif, titre, sous-titre, nombre d'items (4-30), stats live
- Indicateur sécurité "🔒 Clés Supabase uniquement côté backend"
- Module aussi activable/réordonnable depuis l'onglet **Modules** comme les autres

### Validation
- Testing agent iteration 29 : **27/27 tests passés (100%)**, zéro issue
- Vérification explicite : credentials Supabase jamais exposés dans aucun endpoint
- Sécurité headers présents sur tous les nouveaux endpoints

## Session 17 (Jan 2026) — Panneau d'info (comme modules promo)

### Transformation Bandeau → Panneau
- Le bandeau simple a été transformé en **vrai panneau promotionnel** style `sports-stream` / `livewatch`
- Image/logo à gauche (URL configurable), contenu riche à droite
- Champs admin : titre, badge, sous-titre italique, description, tags (liste), image_url, variant couleur, CTA principal + CTA secondaire, footer_text, dismissible
- 6 variants : info/success/warning/danger/promo/announce (bordure colorée + gradient sombre matchant sports-stream)
- Aperçu en direct dans l'admin (composant `InfoPanelView` réutilisable)
- Versioning auto sur tout changement de contenu, fermeture 24h par user

### Enrichissement CRUD TV / Radio (déjà en place)
- Les champs `description`, `country`, `stream_url`, `logo_url`, `quality` (TV), `frequency`, `website_url` (radio), `is_active` sont tous configurables via Admin > TV ou Admin > Radio
- Ajout de `website_url` au formulaire radio (pour le bouton "Site" sur la page radio)
- Ajout de `is_active` checkbox aux deux formulaires

### Validation
- Testing agent iteration 28 : **19/19 tests passés (100%)**, 1 mini issue LOW fixée (version downgrade guard)

## Session 16 (Jan 2026) — Pages TV/Radio, Codes VIP avancés, Bandeau d'info

### Pages TV Channels & Radio (restyle complet)
- Titre centré + sous-titre, barre de recherche 12h + filtre catégories/genres
- Cards : logo + nom + badge catégorie coloré + description + pays + HD/LIVE
- Likes / Dislikes cliquables (toggle, flip, backend `/api/tv-channels/{id}/vote` et `/api/radio-stations/{id}/vote`)
- Bouton coeur favori intégré sur la card
- Bouton Regarder (rouge) / Écouter (bleu) + bouton "+" playlist + bouton Site (radio)
- Modal streaming TV avec iframe
- Audio player global radio (play/pause par station)

### Admin → Codes VIP avancés
- Choix du type : VIP, VIP+, Uploader, Admin
- Choix de la durée : 7/15/30/60/90/180/365 jours (admin = illimité)
- Génération par **quantité** (1 à 50 codes d'un coup)
- Click sur code → copie dans le presse-papier
- À l'activation, `vip_expires_at` est automatiquement posé en base

### Admin → Bandeau d'information (homepage)
- Tab "Bandeau" dans l'admin
- Activation / désactivation, édition du message, 6 variants (info/success/warning/danger/promo/announce)
- Lien optionnel (URL + label)
- Fermable par l'utilisateur, **persistant 24h** côté client via localStorage
- **Versioning auto** : changement de message ou activation bump la version → tous les utilisateurs reverront le bandeau
- Aperçu en direct dans l'admin
- Composant `InfoBanner.js` injecté au-dessus du Hero sur la homepage

### Backend
- `GET /api/info-banner` (public), `PUT/GET /api/admin/info-banner` (admin)
- `POST /api/tv-channels/{id}/vote`, `POST /api/radio-stations/{id}/vote` (auth)
- `GET /api/media-votes/mine` (auth) - votes de l'utilisateur courant
- `/api/admin/vip-codes` supporte maintenant `duration_days` et `quantity`

### Validation
- Testing agent iteration 27 : **24/24 tests passés (100%)**, zéro issue

## Session 15 (Jan 2026) - Sécurisation & préparation mise en ligne

### Phase A — Sécurité backend
- **Cookies prod-aware** : `secure=True` + `samesite=none` si `ENV=production`, sinon `lax`
- **SecurityHeadersMiddleware** : X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy=strict-origin-when-cross-origin, Permissions-Policy, HSTS en prod
- **CORS resserré** : methods/headers explicites au lieu de `*`
- **EmailStr** réellement appliqué sur `RegisterRequest` et `LoginRequest`
- **Validation mot de passe** : min 8 caractères, 1 majuscule, 1 chiffre (register + change-password)
- **Rate-limit register** : 5 tentatives / heure / IP → HTTP 429
- **Rate-limit login** (existant) : 5 bad attempts / IP:email, lockout 15min
- **Validation username** : 2-32 caractères
- **Clé TMDB retirée du frontend** (`REACT_APP_TMDB_API_KEY` supprimée, tous les appels passent par le backend proxy `/api/tmdb/*`)

### Phase B — Nettoyage repo
Déplacés vers `/app/_legacy/` (réversible) :
- `/app/app/` (pages Next.js inutilisées)
- `/app/components/`, `/app/hooks/`, `/app/lib/` (versions Supabase/v0.dev)
- `/app/styles/`, `/app/public/`, `/app/scripts/` (SQL Supabase)
- `/app/middleware.ts`, `/app/next.config.mjs`, `/app/vercel.json`, `/app/tsconfig.json`, `/app/package.json` racine, `/app/components.json`, `/app/postcss.config.mjs`, `/app/tailwind.config.ts`, `/app/pnpm-lock.yaml`, `/app/sw.js`
- `/app/backend_test.py`, `/app/review_request_test.py`

### Phase C — Validation
- Testing agent iteration 26 : **21/21 tests passés (100%)**
- Zéro issue critique, zéro issue mineure

## Checklist mise en ligne production
Avant de déployer, l'opérateur doit :
1. Régénérer un **nouveau JWT_SECRET** fort (64+ chars aléatoires)
2. Changer le **mot de passe admin** (`ADMIN_PASSWORD` env var)
3. Définir `ENV=production` pour activer cookies `secure` + HSTS
4. Configurer `FRONTEND_URL` = URL publique HTTPS exacte (supporte virgules pour plusieurs origines)
5. Vérifier MongoDB connection string (MONGO_URL) en cluster managé (Atlas)
6. Supprimer définitivement `/app/_legacy/` si tout fonctionne

## Admin Credentials (dev/preview)
- Email: admin@wavewatch.com
- Password: WaveWatch2026!
- ⚠️ **À CHANGER IMPÉRATIVEMENT AVANT MISE EN LIGNE**

## Backlog / Améliorations possibles
- P1 : Password reset flow (forgot password par email via SendGrid/Resend)
- P1 : CSP (Content-Security-Policy) header (nécessite inventaire des sources externes)
- P2 : 2FA pour comptes admin
- P2 : Audit log (qui a modifié quoi côté admin)
- P2 : Migration MongoDB Atlas + backups automatiques

## Update - Iframe Modal Mobile + Fullscreen (2026-01-21)
- Created shared `/app/frontend/src/components/IframeModal.js` component
- Features: full-screen on mobile (no margins, full height), fullscreen toggle button (Maximize2/Minimize2), close button, ESC-to-close, body scroll lock
- Integrated across: MovieDetailPage (stream/download/trailer), TVShowDetailPage (stream/download/trailer), EpisodeDetailPage (stream/download), PlaylistDetailPage (embed), RetrogamingPage (game stream), HomePage (TV channel), TVChannelsPage (channel stream)
- data-testids: `iframe-modal`, `iframe-modal-close`, `iframe-modal-fullscreen`, `iframe-modal-open-newtab`

## Update - Bug Fixes Multi-points (2026-01-21)

### Backend
- **Rate limit register relaxé** : 30 inscriptions / 24h par IP (au lieu de 5/h) — pour IP partagées / carriers mobiles
- **Fix mark-all-watched** : écrit maintenant dans `watch_history` (et non `user_history`) — la série + tous les épisodes sont bien comptés dans les stats (testé : Breaking Bad → 62 épisodes comptabilisés)
- **Fix detailed-stats** : formule temps corrigée (movies×110 + episodes×42, fallback series×45 seulement si pas d'épisodes) — plus de double comptage
- **Reviews communauté** : purge au démarrage des seed_user_* + filtre dans GET /api/platform-reviews
- **Admin Activity Feed étendu** : nouveau endpoint `/api/admin/activities` retourne un flux unifié:
  - `register` : nouvelle inscription (username, email, IP)
  - `code_redeem` : utilisation code VIP (code, type, durée)
  - `play` : lecture contenu (titre, type, throttle 1h par contenu)
  - `admin_action` : actions admin (TMDB update, broadcast, génération codes)

### Frontend
- **IframeModal** étendu à **Musique**, **Jeu**, **Logiciel**, **Ebook** pour Lecture/Écoute/Téléchargement
  - MusicDetailPage : bouton Télécharger ajouté + player audio inline pour flux .mp3/.wav/.ogg
  - GameDetailPage : séparation Jouer (iframe) / Télécharger
  - EbookDetailPage : Lire en ligne (iframe) / Télécharger
  - SoftwareDetailPage : Télécharger via modal
- **CalendarPage** : fetch 5 pages de chaque source (movies, tv, on_the_air), dédupliqué par id, pas de `.slice(0,50)` → affichage complet
- **TVShowDetailPage** : bouton "Marquer vu" supprimé, seul "Tout marquer" (série complète) subsiste
- **DashboardPage** : composant `Section` hoisté hors du composant parent → plus de remount et plus de scroll jump lors de la saisie dans le textarea d'avis
- **AdminPage Feed** : nouveau `ActivityFeedView` avec stats compteur par type, filtres (Tous / Inscriptions / Codes / Lectures / Admin), rendu enrichi avec icônes et détails contextuels

### Tests
- Backend 100% OK (pytest 9/9, /app/backend/tests/test_iteration32_bugfixes.py)

## Update - Iteration 3 (2026-01-21)

### Navigation
- Retiré badges "NEW" des items du menu (Ebooks, Logiciels, Calendrier Sorties)
- Retiré liens externes LiveWatch et Sports-Stream des menus (desktop + mobile)
- Renommé "Musique" → "Musiques" partout dans les menus

### Pages détail
- **GameDetailPage** : bouton "Jouer" retiré, garde uniquement "Télécharger"
- **MusicDetailPage / EbookDetailPage** : déjà conditionnels sur l'URL (pas de bouton si pas de lien) - confirmé en place
- **ActorDetailPage** : Filmographie séparée en 2 sections distinctes "Films" et "Séries" (dédoublonnées, plus de limite slice 24)

### Playlists
- Nouvelle playlist : case "Public" cochée par défaut (dans PlaylistsPage + AddToPlaylistButton quick-create)

### Calendrier
- fetchEvents augmenté à 10 pages × 4 sources (upcoming/popular movies, on_the_air, discover TV) + 3 pages anime
- Dédoublonnage global par id - vraiment tout afficher sans limite

### Admin - Compteur live "En train de regarder"
- Nouveau endpoint **GET /api/admin/watching-now** : retourne count + liste des users ayant lancé un play dans les 10 dernières minutes (dédoublonné par user_id)
- Frontend : nouveau bloc rouge en haut du dashboard stats avec ping animé + liste scroll des watchers (titre, type, username, poster, heure)
- Auto-refresh toutes les 15s

## Iteration 33 - 2026-05-09 - VIP Game configurable + Limites admin + Recommandations améliorées

### 1) Module "Derniers liens de téléchargement" - pseudo de l'uploader
- Backend `/api/download-links/recent` : ajout du join `profiles(username,role)` Supabase + flatten en `uploader_username` / `uploader_role`
- Frontend `DownloadLinksRow.js` : `DownloadLinkCard` affiche le pseudo de l'uploader sous le titre (couleur dynamique selon rôle: admin=rouge, uploader=bleu)

### 2) Page Playlists Communauté - images cassées + masquer playlists vides
- Backend `/api/playlists/public/enhanced` & `/api/playlists/public/discover` : filtre `items.0: {$exists: true}` (élimine les playlists 0 élément)
- Frontend `DiscoverPlaylistsPage.js`, `PlaylistsPage.js`, `HomePage.js` (module communauté) : détection `poster_path.startsWith('http')` pour utiliser l'URL comme telle (logos chaînes TV/Radio Wikipedia) + onError fallback placeholder

### 3) URL LiveWatch
- `LiveWatchPromo.js` + bloc inline `HomePage.js` : `livewatch.sbs` → `livewatch.top` (et `v2.livewatch.sbs` → `v2.livewatch.top`)

### 4) Jeu VIP entièrement paramétrable depuis l'admin
- Backend : nouvelle clé `db.site_settings: vip_game_config` avec champs : enabled, title, subtitle, win_rate (%), reward_type (vip|vip_plus), reward_days, play_interval_hours (cooldown configurable), max_winners_per_day, winners_visible, win_message, lose_message, wheel_segments, primary_color, secondary_color
- Endpoints : `GET /api/vip-game/config` (public, sanitisé), `GET /api/admin/vip-game/config` (admin), `PUT /api/admin/vip-game/config` (admin), `POST /api/admin/vip-game/reset` (purge cooldown global ou par user)
- `/api/vip-game/play` : utilise win_rate + reward_type/days, applique `is_vip_plus` si reward_type=vip_plus, respecte max_winners_per_day, désactivable via enabled=false
- `/api/vip-game/status` : retourne `{enabled, can_play, played_today, won, last_played_at, next_play_at, play_interval_hours}` (cooldown rolling au lieu de "1 fois par jour calendaire")
- `/api/vip-game/winners` : limite par `winners_visible` au lieu de 10 hardcodé, expose reward_type/reward_days
- Frontend AdminPage : nouvel onglet "Jeu VIP" avec formulaire complet (Affichage / Mécanique / Messages / actions Save+Reset)
- Frontend VIPGamePage : roue dynamique (couleurs+segments depuis config), countdown h/m/s en temps réel, gère état désactivé, label récompense (VIP/VIP+)

### 5) Suppression des limites dans tous les endpoints admin
Passage de `to_list(N)` → `to_list(length=None)` sur :
- `/api/admin/users` (avant 500), `/api/staff-messages` (100), `/api/content-requests` (100)
- `/api/admin/watching-now` (200), `/api/admin/cinema-rooms` (100), `/api/admin/activities` (200), `/api/admin/vip-codes` (200)
- `/api/tv-channels` (500), `/api/radio-stations` (500), `/api/retrogaming` (500)
- `/api/music` (200), `/api/games` (200), `/api/platform-reviews` (500)
- `/api/ebooks` & `/api/software` : ajout d'un paramètre `?limit=` (cap 10000) pour permettre à l'admin de récupérer la liste complète. AdminPage appelle avec `?limit=10000`.

### 6) Recommandations pour vous - vraies recommandations personnalisées
- Backend `/api/user/recommendations` réécrit :
  - Construit un `seen_pairs` set excluant : watch_history + favorites + user_ratings(rating='dislike')
  - Seeds = mix likes (récents) + favorites + history (jusqu'à ~24 graines uniques)
  - Pour chaque seed: appelle `/movie/{id}/similar` ET `/movie/{id}/recommendations` (idem TV) → accumule genre_ids pondérés
  - Étape 2 : `/discover/movie` + `/discover/tv` triés par vote_average sur les 3 genres dominants pour la diversité
  - Étape 3 : top-up `/trending/all/week` si moins de 12 items
  - Ranking final par score (vote_average × 0.6 + popularity × 0.4)
  - Filtre poster_path requis et vote_count ≥ 20 (qualité)
  - Ne ressort jamais un id présent dans seen_pairs (movies vus/favoris/disliked)
  - source: 'trending' (nouvel utilisateur sans seeds) ou 'personalised'
- Frontend `HomePage.js` RecommendationsRow : key fix + routing TV/Movie via item.media_type

### Tests
- Iteration 33 : 27/27 tests pytest pass (test_iteration33_vip_game_recos.py)
- 100% backend success


## Iteration 33-bis - 2026-05-09 - Modération admin des avis communauté

### Backend
- `PUT /api/admin/platform-reviews/{review_id}` (require_admin) : édite message + scores (contenu/fonctionnalites/design clamped 1-10), marque `edited_by_admin: True` + `edited_at`
- `DELETE /api/admin/platform-reviews/{review_id}` (require_admin) : supprime définitivement l'avis

### Frontend (AdminPage)
- Nouvel onglet **« Avis »** (icône MessageSquare, badge avec count)
- Carte par avis : pseudo + badges (Admin/Uploader/VIP/VIP+/Modéré) + date + 3 scores
- Boutons **Modifier** (édition inline avec textarea + 3 sliders 1-10) et **Supprimer** (avec confirmation)
- Bandeau "Modéré" orange affiché si `edited_by_admin: true`
- En tête : moyennes de la communauté (Contenu / Fonctionnalités / Design) + bouton Rafraîchir

### Tests manuels
- POST review → PUT admin (message + score) → DELETE admin = OK
- Marquage `edited_by_admin: True` confirmé en base
- Endpoints non-authentifiés → 401, non-admin → 403



## Iteration 34 - 2026-05-09 - Suppression bouton "Serveur de secours" + Pass responsive global

### Changements
- **LiveWatchPromo** : bouton "Serveur de secours" (lien vers v2.livewatch.top) supprimé dans :
  - `/app/frontend/src/components/LiveWatchPromo.js`
  - `/app/frontend/src/pages/HomePage.js` (composant inline)
  - Bouton "Acceder au site" conservé seul, avec `data-testid="livewatch-access-btn"`
- **Responsive global** :
  - `index.css` : safety net `html, body { max-width: 100%; overflow-x: hidden }`, `img/video/iframe { max-width: 100% }`, container padding réduit < 640px
  - `HomePage.js` SportsStreamPromo / LiveWatchPromo (inline) : padding/img/heading scalés `p-6 sm:p-8 md:p-12`, `text-2xl sm:text-3xl`, image `w-32 h-32 sm:w-40 sm:h-40 md:w-52`
  - `HomePage.js` SubscriptionOffer : flex-wrap des CTA, grid features full-width sur mobile, alignements centrés
  - `HomePage.js` FootballCalendarWidget : matchs flex-wrap, dates `w-16 sm:w-20`, ligue badge whitespace-nowrap
  - `Footer.js` : barre de liens `flex-wrap` + alignement centré en mode colonne mobile

### Vérifications
- Mobile 390x800 : aucun overflow horizontal (scrollWidth == clientWidth == 390)
- Tablet 768 : OK
- Desktop 1920 : OK
- HomePage, mobile menu, /movies, footer testés en mobile


## Iteration 35 - 2026-05-09 - Suivi épisodes vus + widget reprise + correctifs

### Backend
- **Nouveau** : `POST /api/user/tv-progress/{show_id}/unmark-all-watched` (auth) — supprime `tv_progress` + `watch_history` (série + tous épisodes liés). Inverse exact de `mark-all-watched`.
- (existant) `GET /api/user/tv-progress/{id}` renvoie `{watched_episodes: { "<season>": { "<ep>": bool } }, continue_watching}`
- (existant) `POST .../episode {season, episode, watched}` met à jour la progression d'un épisode

### Frontend
- **EpisodeDetailPage** : `markAsWatched` synchronise désormais `tv_progress` + `watch_history` simultanément (POST .../episode + POST/DELETE /history). L'auto-mark sur "Regarder" coche bien l'épisode partout (page saison, barre de progression série).
- **SeasonDetailPage** : correction du parsing de `watched_episodes` (format imbriqué nested au lieu de clés "season-ep"). Les pastilles vertes "Vu" s'affichent maintenant correctement.
- **TVShowDetailPage** : 
  - Ancien bouton "Reprendre" remplacé par un widget riche **ResumeWidget** affichant le dernier épisode vu + une CTA contextuelle :
    - `next-episode` : Revoir + Voir l'épisode suivant (S{x}E{y})
    - `next-season` : Revoir + Commencer la saison suivante
    - `finished` : Trophy + message "vous avez tout vu" + Revoir
    - `wait` : icône calendrier + date du prochain épisode + countdown ("dans X jours/semaines/mois") + Revoir
    - `wait-unknown` : "à jour, aucune date annoncée" + Revoir
- **ContentCard** : sur le hover d'une série, le bouton "Marquer vu" appelle maintenant `/tv-progress/{id}/mark-all-watched` (et `/unmark-all-watched` pour annuler). Toggle inverse propre.
- **HomePage SportsStreamPromo + components/SportsStreamPromo** : URL bouton "Accéder au site" → `https://livewatch.top/` (au lieu de sports-stream.sbs)

### Tests
- Iteration 34 (testing agent) : 11/11 backend tests pass — cycle mark-all → unmark-all → episode toggle validé end-to-end
- Tests E2E manuels via Playwright : widget Resume affiché en mode `next-episode` (S1E3 vu → S1E4 proposé) ET `finished` (S8E6 vu → message GoT terminé), URL Sports = livewatch.top


## Iteration 36 - 2026-05-09 - Recommandations variées + Contenu Aléatoire dual + diff GitHub

### Backend
- `GET /api/user/recommendations` rendu varié à chaque appel :
  - **Path personnalisé** (avec seeds) : pool élargi de ~80 candidats (similar/recommendations pages 1+2 par seed, discover pages 1+2 par genre, seeds shufflés). Top 36 par score puis `random.shuffle` → return 18.
  - **Path trending** (nouvel utilisateur) : fetch parallèle (asyncio.gather) de `trending/all/week` pages 1-2-3 + `trending/movie/week` p1 + `trending/tv/week` p1 → pool dédoublonné de ~50+ items, shuffle, return 18.
  - Quality gates conservés (poster_path, vote_count >= 20 pour seeds-derived).
  - Exclusions inchangées : history + favorites + dislikes.

### Frontend
- `HomePage RandomContent` : refonte pour afficher **simultanément 1 film ET 1 série** dans une grille 2 colonnes responsive. Bouton "Nouveau" rafraîchit les deux. Spinner sur l'icône Shuffle pendant chargement.

### Tests
- 8/8 tests pytest pass (test_iteration35_recommendations_diversity.py) — diversité personnalisée ET trending validées, exclusions et qualité OK, non-régression /history /favorites /tv-progress unmark-all.

### Diff GitHub Wacewatch/wavewatch2026-V2 (main)
- Comparaison `/app` vs repo cloné : seuls les fichiers que j'ai modifiés ces dernières itérations diffèrent. **Le repo distant est en retard sur /app**, pas l'inverse. Les features mentionnées par l'utilisateur (pseudo sous jaquette dans DownloadLinksRow, filtres+tri sur DiscoverPlaylistsPage) sont **déjà présentes dans /app**.


## Iteration 37 - 2026-05-09 - Refonte Découvrir des Playlists (visual + filtres)

### Backend
- `GET /api/playlists/public/enhanced` : aggregation pipeline complète
  - Filtres : `q` (texte name/desc), `creator_role` (all/staff/vip/standard), `content_type_filter` (movie,tv,music,...), `min_items`
  - Sort : recent | oldest | likes | dislikes | size | name
  - **Staff toujours pinned en haut** (`is_staff: -1` avant le sort utilisateur)
  - Lookup users + lookup user_ratings (likes/dislikes counts) + items_count via $size
  - $facet pour total + page
- `GET /api/playlists/public/stats` : nouveau, pour le hero (total_playlists / total_contributors / total_items / by_type)

### Frontend
- DiscoverPlaylistsPage refonte VISUELLE complète :
  - **Hero** : titre gradient (blanc→émeraude→cyan→violet), 3 stat cards avec count-up animé + glow colorés (émeraude/cyan/violet), grid pattern + orbes floues animées en arrière-plan
  - **Toolbar sticky** : glassmorphism, search avec focus cyan, dropdown sort avec icônes, bouton Filtres avec badge notification gradient, view toggle grid/list
  - **Filtres** : pills gradient colorées quand actives (chaque type a son gradient + shadow + ring), barres d'accent verticales pour les sections, slider violet avec fill dynamique
  - **Cards grid** : poster mosaïque 4 cases, badges STAFF (gold) + HOT (rose pulse), bulles de types colorées en bottom-left, titre gros gras white, avatar auteur + role badge, stat strip émeraude/rose, glow gradient au hover
  - **Cards list** : compact avec ring gold pour staff
  - **Empty state** : encadré gradient avec orbes floues, gros icon emerald+cyan, CTA "Créer ma playlist" gradient
  - **Skeleton loading** : 8 cards animées
  - Background page : gradient sombre custom avec 3 orbes pulsantes (émeraude/bleu/violet) — indépendant du thème utilisateur

### Verifications
- Backend testé via curl : sort_by=likes, stats endpoint, filters → tous OK
- Visuel testé via Playwright : desktop 1440 + mobile 390 → cohérent, vibrant, moderne

## [2026-01-10] LiveWatch external TV source
- Added toggle on /tv-channels: WaveWatch (local DB, default) + LiveWatch (external API https://livewatch.top)
- Backend proxies (cached, avoid CORS):
  - GET /api/livewatch/countries -> 17 countries with totals
  - GET /api/livewatch/channels?country=X -> channels with embed_url + backup_embed_url
- LiveWatch flow: country selector first -> channels grid -> iframe player with backup-toggle button

## Iteration 38 - 2026-05-10 - Refonte UI au pattern "Discover" (suite)

### Pages refaites au nouveau pattern (background gradient sombre + orbes pulsantes + glassmorphism + hero gradient + toolbar sticky + cards cyan/pink/purple)
- **ActorsPage** (`/actors`) : hero "Acteurs & Stars" gradient, stats live (Acteurs/Page/Pages depuis TMDB), barre recherche debounce, cards glow gradient au hover, badge HOT pour acteurs populaires
- **CalendarPage** (`/calendar`) : hero "Calendrier des Sorties", 4 stat cards (Films/Séries/Anime/À venir), filtres pills gradient (Tout/Films/Séries/Anime/Mes favoris), calendrier glassmorphism, liste prochaines sorties avec notification toggle
- **HomePage** (`/`) : wrapper background gradient + orbes pulsantes ajouté autour des sliders existants (fonctionnalités intactes)
- **LoginPage** (`/login`) : card centrée glassmorphism avec hero gradient, inputs cyan focus, bouton gradient cyan-blue, show/hide password
- **RegisterPage** (`/register`) : card centrée gradient emerald-cyan, validation password progressive (8 car / 1 maj / 1 chiffre) avec checks verts
- **Footer** : reviews communauté en glassmorphism, livre d'or carrousel, links pills hover cyan, gradient logo
- **DNSVPNPage** (`/dns-vpn`) : hero "DNS & VPN Recommandés", cards DNS avec copy-to-clipboard chips, cards VPN avec liens externes
- **FAQPage** (`/faq`) : recherche + filtres catégories pills (Général/VIP/Thèmes/Support), accordéons glow par catégorie, CTA "Écrire au staff"
- **ChangelogsPage** (`/changelogs`) : timeline verticale avec dots colorés par version major, badge dernière version dans le hero, palette dynamique
- **ContactStaffPage** (`/contact-staff`) : **fix du formulaire qui ne s'affichait pas**, hero gradient pink-purple, sélecteur catégorie pills, historique des messages dans aside avec status (Répondu/En attente)

### AnimePage stats refondues (à la demande utilisateur)
- Avant : Animes (page count) / Page / Pages
- Après : **Animes (totalResults TMDB) / Plateformes (5) / Genres (8)** — comme MoviesPage

### Thèmes VIP — z-index fix
- `.theme-vip body::after` (ambient glow) : z-index 0 → 9998 + opacité 0.03 → 0.06 pour rester subtil mais visible par-dessus les nouveaux wrappers gradient
- `.theme-vip-plus::before` (particules) : z-index 0 → 9999 + opacité particules 0.06-0.15 → 0.16-0.25
- Effets nav animée, scrollbar gradient, glow boutons et titres VIP : intacts (toujours appliqués via classes `theme-X` sur root)

### Pages restantes à refaire (ordre de priorité suggéré)
**P1 (haute visibilité utilisateur)** :
- DashboardPage, ProfilePage, FavoritesPage, WatchHistoryPage
- PlaylistsPage, SubscriptionPage, VIPGamePage
- TVChannelsPage, CollectionsPage

**P2 (utilitaires connecté)** :
- AchievementsPage, LeaderboardPage, MessagesPage
- ContentRequestsPage, DownloadLinksPage, SearchPage
- WatchPartyPage / WatchPartyRoomPage, SpectaclesPage

**P3 (déjà au style PageWrapper unique — pas urgent)** :
- TVShowsPage, MoviesPage, MusicPage, GamesPage, EbooksPage, SoftwarePage, RadioPage, RetrogamingPage, SportPage, DocumentairesPage (utilisent PageWrapper coloré, déjà cohérent)

**Pages détail** (gardent un layout dédié — refonte optionnelle) :
- ActorDetailPage, MovieDetailPage, TVShowDetailPage, EpisodeDetailPage, SeasonDetailPage
- AnimeDetailPage, EbookDetailPage, GameDetailPage, MusicDetailPage, SoftwareDetailPage, PlaylistDetailPage, DirectorDetailPage

**Admin** : AdminPage (interne, peut rester technique)

## Iteration 39 — 2026-05-10 — Themed wrapper + 8 nouvelles pages

### Nouveau composant réutilisable
- **`/app/frontend/src/components/design/ThemedPage.js`** : `<ThemedPage>` (wrapper avec background + orbes themed) et `<ThemedHero>` (hero gradient avec badge/title/subtitle/highlight/description/stats). Utilise `hsl(var(--background))`, `hsl(var(--card))`, `hsl(var(--primary))`, `hsl(var(--accent))`, `hsl(var(--ring))` → s'adapte automatiquement au thème (Sakura, Cyberpunk, Premium, VIP, VIP+, etc.)

### Migration des 11 pages déjà refaites vers les variables CSS du thème
- ActorsPage, CalendarPage, LoginPage, RegisterPage, HomePage, DNSVPNPage, FAQPage, ChangelogsPage, ContactStaffPage, DiscoverPlaylistsPage, Footer
- Remplacements globaux: `#050b18` → `hsl(var(--background))`, `bg-[#0b1220]/X` → `bg-card/X`, orbes hardcodées → `hsl(var(--primary|accent|ring) / 0.4)`

### 8 pages refaites au pattern themed
- **DashboardPage** (`/dashboard`) : hero "Bonjour, {username}" + 4 stats (Temps total/Films/Séries/Succès), sections existantes intactes
- **ProfilePage** (`/profile`) : hero "Profil de {username}", boutons modifier/sauvegarder en pills
- **FavoritesPage** (`/favorites`) : hero "Mes Favoris" + stats (Favoris, Types)
- **WatchHistoryPage** (`/history`) : hero "Mon Historique" + 3 stats (Total/Films/Séries) + bouton effacer
- **PlaylistsPage** (`/playlists`) : hero "Mes Playlists" + 3 stats (Total/Publiques/Privées) + bouton créer
- **SubscriptionPage** (`/subscription`) : hero "Choisis ton plan" + 3 cards plan stylées (Gratuit/VIP/VIP+) avec gradient, glow et tags (Populaire/Premium), CTA bonus "Tente ta chance" vers /vip-game
- **VIPGamePage** (`/vip-game`) : hero "Jeu VIP Gratuit" + card roue conservée (avec backdrop blur et orbes c1/c2)
- **CollectionsPage** (`/collections`) : hero "Collections & Sagas" + barre recherche sticky en glassmorphism

### ActorsPage stats
- Avant : 3 stats (Acteurs / Page / Pages)
- Après : **1 stat** unique en grand (Acteurs au total) — comme demandé par l'utilisateur

### Effets thèmes VIP intacts (vérifié)
- z-index élevé pour `body::after` (ambient glow VIP) et `::before` (particules VIP+)
- nav animée, scrollbar gradient, glow boutons et titres VIP : OK via classes `theme-X` sur `<html>`
- Maintenant que toutes les pages utilisent `bg-background` et `hsl(var(--primary))`, **les couleurs s'adaptent automatiquement** au thème sélectionné (Sakura → roses, Cyberpunk → cyans, etc.)

### Pages restantes (option, à demander)
- Achievements, Leaderboard, Messages, ContentRequests, DownloadLinks, Search, WatchParty/Room, Spectacles
- Pages détail (ActorDetail, MovieDetail, etc.) — souvent layout dédié, refonte optionnelle
- Admin — interne, peut rester technique
