# WaveWatch PRD


## Session 51 (2026-05-12) — Fix menu mobile + Recommandations + Uploader admin access

### Demandes utilisateur
1. Module Contenu Aléatoire: ne pas proposer du contenu déjà vu.
2. Recommandations: garder UN SEUL module sur la page principale (home), supprimer du dashboard. Garder le hover (ajouter en playlist, marquer vu). Pas de contenu déjà vu.
3. Uploaders: accès à certains onglets admin (Dashboard, TV, Radio, Musique, Logiciel, Jeu, Ebook, Rétro, Demandes) avec full CRUD comme un admin. Bloquer les autres onglets.
4. Bug: menu mobile (burger) n'affiche que la croix de fermeture — rien d'autre.

### Cause root du bug menu mobile
Le `<nav>` parent avait `backdrop-filter: blur(20px)` ce qui crée un nouveau "containing block" et casse `position: fixed` des enfants. Le menu mobile était donc contraint à la hauteur de la nav (~60px).

### Changements
- **Navigation.js**: menu mobile rendu via `ReactDOM.createPortal(..., document.body)` → échappe le containing block du nav. Ajout `data-testid="mobile-menu-panel"`.
- **components/RecommendationsRow.js**: refactor pour utiliser `<ContentCard />` (hover playlist + watched). Le composant exclut déjà le contenu vu (backend `/api/user/recommendations` filtre history+favorites+dislikes).
- **HomePage.js**: 
  - Remplace la fonction inline `RecommendationsRow` par l'import depuis `components/RecommendationsRow`.
  - `RandomContent` filtre désormais le contenu déjà vu (`useContentStatus().watched`) en fetchant 3 pages aléatoires de films + 3 pages de séries.
- **DashboardPage.js**: retire l'import et l'affichage de `RecommendationsRow`.
- **ProtectedRoute.js**: ajoute prop `allowUploader`.
- **App.js**: `/admin` utilise `<ProtectedRoute adminOnly allowUploader>`.
- **AdminPage.js**: 
  - Guards `is_admin || is_uploader`.
  - Constant `UPLOADER_ALLOWED_TABS = ['stats','tvchannels','radio','music','software','games','ebooks','retrogaming','requests']`.
  - Filtre `tabs` pour les uploaders, et redirige vers `stats` si onglet interdit.
- **Backend server.py**: passage de `require_admin` → `require_admin_or_uploader` pour: enhanced-stats, online-users, watching-now, tv-channels CRUD, radio-stations CRUD, music delete, software delete, games delete, ebooks delete, retrogaming CRUD, content-requests update/delete.

### Validation testing_agent_v3 (iteration_40)
- Backend: 17 tests passent (uploader CRUD OK; uploader 403 sur /api/admin/users, vip-codes, broadcast, info-banner, changelogs).
- Frontend: menu mobile visible avec tous les éléments; dashboard sans recos; admin uploader voit exactement 9 onglets autorisés sur 23.
- Recommendations exclut bien le contenu vu côté API.

### Comptes test
- Admin: `admin@wavewatch.com` / `WaveWatch2026!`
- Uploader (test): `uploader@wavewatch.com` / `Uploader2026!`

## Session 50 (2026-05-12) — Migration Supabase → wwembed HTTP API

### Demande utilisateur
> Migration de wwembed Supabase → MongoDB exposée via une nouvelle API HTTP (header `X-API-Key`).
> Côté WaveWatch : remplacer tous les appels Supabase par cette API, sans rien changer pour l'utilisateur.

### Endpoints wwembed consommés
1. `GET /api/v1/health` (public)
2. `GET /api/v1/download_links/recent?limit=N`
3. `GET /api/v1/download_links?quality&media_type&language&q&uploader&sort&limit&offset`
4. `GET /api/v1/download_links/for-content?tmdb_id&media_type&season&episode`
5. `GET /api/v1/download_links/media-types`
6. `GET /api/v1/profiles/uploaders`
7. `GET /api/v1/stats`

Tous protégés par `X-API-Key`.

### Changements backend (`/app/backend/server.py`)
- Nouvelles vars env : `WWEMBED_API_URL`, `WWEMBED_API_KEY` (Supabase laissé vide pour compat).
- Remplacement de `_supabase_get()` par `_wwembed_get()` (httpx, header `X-API-Key`).
- Refacto complète de `_download_link_filters()` : plus de syntaxe PostgREST, juste les query params attendus par l'API wwembed.
- Refacto de `_fetch_all_download_links()` : pagination via `limit`/`offset` au lieu du header `Range`.
- 7 endpoints WaveWatch (`/api/download-links/*` + `/api/admin/download-links/stats`) basculés sur la nouvelle API.
- **Résilience** : si wwembed est offline ou en cours de déploiement, tous les endpoints renvoient `200` avec liste vide au lieu d'un 502, → UI reste propre.
- Logique de groupement TV par (show, season) avec `episode_range` compressé : conservée intacte côté WaveWatch.
- Cache TTL 30s sur `_dl_cache` : conservé.

### Changements frontend (`/app/frontend/src/pages/AdminPage.js`)
- Bloc admin : note de sécurité mise à jour ("clé API wwembed (X-API-Key)" au lieu de "clés Supabase service role").
- Aucun autre changement UI : module home "Derniers liens", page `/download-links`, fiches détail, onglet admin → fonctionnent à l'identique.

### Validation
- `curl /api/download-links/recent` → 200 `{items:[],count:0}` ✅
- `curl /api/download-links?limit=5` → 200 `{items:[],total:0,grouped:true}` ✅
- `curl /api/download-links/for-content?tmdb_id=550&media_type=movie` → 200 ✅
- `curl /api/download-links/media-types` → 200 `{types:[]}` ✅
- `curl /api/download-links/uploaders` → 200 `{uploaders:[]}` ✅

→ Dès que `https://wwembed.wavewatch.top/api/v1/*` sera live, les modules afficheront automatiquement les données. Aucune action supplémentaire requise côté WaveWatch.

### .env
```
WWEMBED_API_URL=https://wwembed.wavewatch.top
WWEMBED_API_KEY=wwk_24db521eac4ca6f1cf4435c27ffeabee51387ba2549ee5ba547f4f6b13893d23
```


## Session 49 (2026-05-12) — Densité grilles & carousels

### Demande utilisateur (FR)
> "dans les pages comme films les jaquette sont trop grande et on vois peut de film par page — fait le pour films series animé etc. le module chaine tv il faut plus de chaine dans le carouselle — idem pour Playlists de la Communaute — que ca prenne bien toutes la ligne"

### Changements
- **Grilles posters (Movies, TV Shows, Anime, Music, Games, Ebooks, Retrogaming, Favorites, Collections, PlaylistDetail, Search/TMDB)** : passage de `xl:grid-cols-6` → `xl:grid-cols-8 2xl:grid-cols-10` (+ mobile `grid-cols-3` au lieu de 2) → ~10 jaquettes par ligne sur grand écran au lieu de 6.
- **Software** : `xl:grid-cols-6 2xl:grid-cols-7` (cards plus larges car écran format paysage).
- **Acteurs (ActorsPage + ActorDetailPage filmography + SearchPage personnes/musique/jeux/ebooks/radio/chaines)** : même densification.
- **TVChannelsPage** : grille principale `xl:grid-cols-5 2xl:grid-cols-6` (vs 4), grille pays LiveWatch `xl:grid-cols-7 2xl:grid-cols-8` (vs 5), grille chaînes pays `xl:grid-cols-6 2xl:grid-cols-7` (vs 5).
- **DiscoverPlaylistsPage** : `xl:grid-cols-6 2xl:grid-cols-7` (vs 4).
- **HomePage `PublicPlaylistsRow` (Playlists de la Communauté)** : passage de `lg:grid-cols-6 / slice(0,6)` → `xl:grid-cols-9 2xl:grid-cols-10 / slice(0,10)` → 10 playlists visibles sur grand écran.
- **HomePage `TrendingTVChannelsRow` + tous les carousels `ContentGrid`** : largeur fixe des cartes réduite de `180px → 160px` (lg) / `160px → 140px` (sm) / `140px → 125px` (mobile) → ~25 % de cartes visibles en plus dans chaque carousel (films tendance, séries, animes, chaînes TV, etc.).

### Fichiers modifiés
`MoviesPage.js`, `TVShowsPage.js`, `AnimePage.js`, `SearchPage.js`, `MusicPage.js`, `GamesPage.js`, `EbooksPage.js`, `SoftwarePage.js`, `RetrogamingPage.js`, `FavoritesPage.js`, `CollectionsPage.js`, `PlaylistDetailPage.js`, `ActorsPage.js`, `ActorDetailPage.js`, `TVChannelsPage.js`, `DiscoverPlaylistsPage.js`, `HomePage.js`, `components/ContentGrid.js`.


## Session 48 (2026-05-12) — Full-width layout & responsive

### Demande utilisateur (FR)
> "dans tout le site il y a des espace vide a droite et a gauche je veus occuper tout l'espace tout le site entier sans rien oublier — et que tout le site global soit responsive pc et mobile"

### Changements
- `/app/frontend/src/index.css` : override global de la classe Tailwind `.container`
  - `width:100% / max-width:100%` (au lieu du max-w par breakpoint qui limitait à ~1280px sur desktop)
  - Paddings latéraux responsifs : 0.75rem (mobile) → 1.25rem (sm) → 2rem (lg) → 3rem (2xl)
- Règle `main > div / section { max-width:100% }` pour neutraliser les anciens `max-w-Xxl` hérités sur les racines de pages
- Conservation d'une largeur lecture confortable possible via `.prose` / `.text-content-readable` (80ch)
- Impact : TOUTES les pages (Home, Movies, TV Shows, Anime, FAQ, Admin, Dashboard, Footer, Navigation, etc.) occupent maintenant 100 % de la largeur écran, sans rien casser du responsive mobile

### Validation visuelle
- ✅ Screenshot desktop 1920px : `/movies` & `/` — bord à bord, plus aucune bande vide
- ✅ Responsive mobile/tablette préservé via les paddings adaptatifs


## Session 47 (2026-05-11) — Refonte demandes + Streak + Reco + Notifs acteur

### 1️⃣ Refonte page Demandes de contenu (`/requests`)
- **Obligatoire** : chaque demande est liée à un `tmdb_id` (`movie` ou `tv`)
- **Modal en 2 étapes** :
  - Étape 1 : toggle Film/Série + barre de recherche TMDB live (`/api/tmdb/search/movies|tv?q=`) — grille 6 colonnes avec posters + années
  - Étape 2 : carte du contenu sélectionné (poster + titre + TMDB ID + année) + 2 boutons radio **Streaming / Téléchargement** + message 500 chars max
- Backend `POST /api/content-requests` :
  - Champs requis : `tmdb_id` (int), `content_type` ("movie"/"tv"/"anime"), `media_type` ("streaming"/"download")
  - Enrichissement TMDB auto (title, poster_path, release_year récupérés serveur)
  - 409 si même user a déjà demandé même TMDB + même media_type en pending
  - 400 si `content_type` ou `media_type` invalides
- **Affichage public** : cards avec poster, badges (FILM/SÉRIE + année + STREAMING/TÉLÉCHARGEMENT), message, auteur, votes, status
- **Filtres** : Toutes / En attente / Approuvées / Rejetées

### 2️⃣ Refonte panneau Admin `Demandes` (`/admin`)
- Poster du contenu (24w aspect 2:3)
- Titre + année + badges (Film/Série, Streaming/Téléchargement, TMDB #ID, votes)
- Message utilisateur dans encadré dédié
- Auteur + date complète (FR) + liens "→ Fiche WaveWatch" et "→ TMDB" externes
- Stats globales en header (En attente/Approuvées/Rejetées)
- Actions Approuver / Rejeter / Supprimer

### 3️⃣ Watch Streak (jours consécutifs)
- Backend collection `user_streaks`: `{user_id, current_streak, longest_streak, last_watch_date, streak_started_at, total_active_days}`
- Hook auto dans `POST /api/user/history` (movie/tv/anime/episode) — incrémente streak si nouveau jour calendaire, reset si jour sauté
- Paliers + XP bonus auto : 3j (+15), 7j (+50), 14j (+100), 30j (+250), 60j (+500), 100j (+1000) — via collection `xp_bonuses` + notification
- `GET /api/user/streak` → `{current_streak, longest_streak, total_active_days, next_milestone, is_active_today, broken, at_risk}`
- Composant `StreakCard` sur `/dashboard` (flamme animée + barre progression palier suivant + record + total jours actifs + badges Actif/À risque)

### 4️⃣ Recommandations personnalisées sur Dashboard
- Composant `RecommendationsRow` consomme l'endpoint existant `/api/user/recommendations` (qui mixait déjà similar + recommendations + discover TMDB)
- Slider horizontal violet avec posters, badges Film/Série, notes TMDB, années
- Boutons prev/next pour scroll

### 5️⃣ Notifications acteur
- Backend nouvelle collection `actor_subscriptions`
- `POST /api/notifications/subscribe-actor` toggle (body: actor_id, actor_name) — capture les credits déjà connus pour ne pas spammer
- `GET /api/notifications/check-actor/{id}` + `GET /api/notifications/subscribed-actors`
- Background loop 12h qui scanne `/person/{id}/combined_credits` et notifie sur nouveaux films/séries des 30 derniers jours
- Bouton "Suivre cet acteur" sur `ActorDetailPage` (`/actors/:id`) qui toggle vers "Notifs activées" (icône Bell violette)

### Tests / Validation
- Backend testé via curl :
  - `POST /api/content-requests` enrichit auto avec TMDB (Le Parrain 1972)
  - Duplicate detection 409, validation media_type 400
  - Streak passe de 0 à 1 après POST history movie 550
  - Actor subscribe/unsubscribe toggle OK
- Frontend testé visuellement :
  - Modal 2 étapes recherche → sélection → soumission
  - StreakCard affichée avec barre progression
  - RecommendationsRow affichée avec 9+ posters
  - Admin tab demandes : poster + tous métadonnées + actions



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

## Iteration 40 — 2026-05-10 — Refonte thèmes + Dashboard engageant + orbes globales

### Refonte complète des thèmes
**Retirés (doublons)** : `forest` (similaire à jade), `aurora` (similaire à arctic/ocean), `lavender` (similaire à royal). Migration auto vers `dark` pour les utilisateurs ayant ces thèmes en localStorage.

**Fix `light`** : était sombre (background 0% 15%) → maintenant **vrai thème clair** (background 210 40% 98%, primary blue 217 91% 50%).

**Renommés** : `Foret` → retiré, `Lavande` → retiré, `Noel` → `Noël`, `Desert` → `Désert`, `Ocean` → `Océan`.

**2 thèmes gratuits EXCEPTIONNELS ajoutés** ★ :
- `Solarized` : palette warm cream/sépia élégante, primary cyan turquoise
- `Nordique` : palette froide bleu-gris-blanc minimaliste

**2 thèmes VIP EXCEPTIONNELS ajoutés** ★ (badge doré dans le sélecteur) :
- `Aurore Boréale` (`borealis`) : gradient flow multicolore animé en arrière-plan (vert→violet→rose), nav animée avec shimmer multicolore
- `Obsidienne` (`obsidian`) : noir profond + filets dorés diagonaux subtils, nav avec barre dorée animée scintillante

**Total final** : 10 standards + 2 exceptionnels + 3 saisonniers + 4 VIP + 2 VIP exceptionnels + 3 VIP+ = **24 thèmes uniques**

### Couleur du logo dynamique selon thème
- Aura derrière le logo : `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--ring)))`
- Drop-shadow : `hsl(var(--primary) / 0.5)`
- Sur Sakura → rose/fuchsia, sur Cyberpunk → cyan/magenta, sur Borealis → vert/violet, etc.

### Navigation entièrement themée
- `navStyle.background` : `hsl(var(--nav-bg) / 0.92) → hsl(var(--background) / 0.85)`
- Borders, dropdowns, textes, hovers : tous via `hsl(var(--nav-X))`
- Le menu thèmes a maintenant 4 sections : **Standard**, **Exceptionnels** (badge cyan ★), **Limités**, **Premium VIP** (badge doré ★ pour les exceptionnels).

### Dashboard plus engageant
Nouveau bloc d'engagement après les Quick links :
- **Sparkline 30 jours** : courbe SVG d'activité de visionnage, gradient themed
- **Streak en cours** : jours consécutifs (avec emoji 🔥)
- **Meilleur jour** : jour avec le plus de visionnages

### Orbes themées globales
Ajoutées dans `App.js` au niveau racine (z-index -10) avec pulse animée et couleurs `hsl(var(--primary|accent|ring) / 0.45)`. **Toutes les pages (refaites ou non, dont pages détail, admin, etc.)** bénéficient maintenant d'un fond animé qui s'adapte au thème.

## Iteration 41 — 2026-05-10 — DMCA + Episode nav + XP system + Halloween default

### 1️⃣ Page DMCA (`/dmca`)
- Inspirée de `https://nakios.fit/dmca` — 4 sections (Zéro Hébergement / Nature du Service / Responsabilité des Tiers / Procédure de Retrait) + Avertissement Final + CTA staff
- Style themed avec hero gradient + cards glow par section + couleurs adaptatives
- Lien ajouté dans le **Footer** avec icône Shield

### 2️⃣ EpisodeDetailPage — flèches Précédent / Suivant
- Récupère les épisodes de la saison via `/api/tmdb/tv/:id/season/:seasonNumber`
- Boutons Précédent ◀ et Suivant ▶ s'affichent uniquement si l'épisode existe (sinon `<div />` vide pour conserver la grille 2 cols)
- Chaque bouton affiche `E{number} · {name}` avec icône themed `hsl(var(--primary))`
- data-testid : `ep-prev-btn` / `ep-next-btn`

### 3️⃣ Système de niveau XP au Dashboard
- **Calcul XP** : films×10 + séries×15 + likes×2 + favoris×5 + playlists×20 + heures×0.5
- **Formule niveau** : `Niveau = floor(sqrt(XP/100)) + 1` (progression non-linéaire)
- **5 tiers** avec couleurs distinctes :
  - 🥉 Bronze (Niv 1-5) — orange terre
  - 🥈 Argent (Niv 6-10) — gris clair
  - 🥇 Or (Niv 11-20) — jaune doré
  - 💎 Platine (Niv 21-35) — bleu acier
  - 💠 Diamant (Niv 36+) — cyan glacé
- Card avec **badge tier 3D** (gradient + glow tier-color), barre de progression XP animée avec %, chips d'XP par action

### 4️⃣ Halloween thème par défaut 🎃
- `useState` initial `'halloween'` (au lieu de `'dark'`) — pour les nouveaux visiteurs sans préférence enregistrée
- Migration auto pour les ex-`forest|aurora|lavender` → `halloween`

### 5️⃣ Solarized refondu
- **Avant** : warm cream/sépia (44 25% 12%, primary 175°)
- **Après** : palette **emblématique Solarized base03** authentique :
  - background: `192 100% 11%` (cyan-vert profond)
  - primary: `175 59% 40%` (cyan solarized)
  - accent: `45 100% 35%` (yellow solarized)
  - ring: `18 80% 44%` (orange solarized)
  - Nav text-secondary cyan, gradient pin du sélecteur revu (cyan→yellow→orange)

## Iteration 42 — 2026-05-10 — DMCA refondu + XP partout + Récompenses par niveau

### 1️⃣ Solarized → "Récif"
Renommé dans le menu thèmes pour mieux refléter sa palette (cyan profond + ambre + corail). Le slug `solarized` est conservé pour ne pas casser le localStorage des utilisateurs existants. Gradient du sélecteur ajusté en `from-cyan-800 via-amber-600 to-orange-700`.

### 2️⃣ Page DMCA refondue (différente de Nakios)
- Layout enrichi : hero avec encart "Mise à jour" daté + 4 stat-cards colorées (0 fichier, Liens, Sources, Conformité EU+DMCA)
- Encart résumé avec icône Info
- 4 sections numérotées 01-04 avec puces (au lieu de paragraphes)
- FAQ rapide en accordéons (3 questions)
- Encart "Responsabilité de l'utilisateur" (avertissement amber)
- 2 CTA dans une grille (Contact staff / FAQ)
- Footer note avec mention jurisprudence

### 3️⃣ Système XP unifié — `lib/xp.js`
Module partagé par toute l'app :
- `computeXP(stats)` — formule unique
- `getLevel(xp)`, `getLevelBounds(level)`, `getTier(level)`
- `REWARD_PALIERS` — liste des récompenses par palier
- `isThemeUnlockedByLevel(themeId, level)` — détection des thèmes débloqués
- Hook React `useUserXP(user)` avec cache 60s pour éviter les re-fetch

### 4️⃣ Composant `<LevelCard>` réutilisable
Card niveau XP avec badge tier 3D, barre de progression et chips. Mode `compact` pour des affichages inline.

### 5️⃣ XP visible partout
- **DashboardPage** : grosse card niveau XP (existante, gardée)
- **ProfilePage** : LevelCard en sidebar + **liste des 4 récompenses paliers** avec statut débloqué/verrouillé
- **LeaderboardPage** (refondu themed) : LevelCard "Mon rang personnel" en haut, **section Système de niveaux** avec les 5 tiers + récompenses paliers + sources d'XP
- **Navigation** : utilise `useUserXP` pour débloquer les thèmes selon le niveau

### 6️⃣ Récompenses débloquées par niveau
| Niveau | Récompense |
|--------|-----------|
| 5 | 🥉 Badge Bronze visible sur ton profil |
| 10 | 🥈 Cadre Argent autour de l'avatar |
| 20 | 🌌 Thème "Aurore Boréale" (VIP exceptionnel) **gratuit** |
| 35 | 💎 Thème "Obsidienne" (VIP exceptionnel) **gratuit** |

Dans le menu thèmes Premium, les thèmes débloqués par niveau affichent un badge **"LV"** vert/cyan (au lieu de l'étoile dorée VIP) et sont accessibles sans être VIP.


## Iteration 43 — 2026-05-10 — Événements saisonniers + Avatars themed XP + bug fix /active

### 1️⃣ Système d'événements saisonniers (backend + frontend + admin)
**Backend** (`/app/backend/server.py`)
- Nouvelle collection `db.seasonal_events` avec 5 événements seedés au démarrage:
  - **Halloween** (15-31 oct, ×3 XP, theme=halloween, genres horror/thriller)
  - **Noël** (1-31 déc, ×3 XP, theme=christmas, genres familial/romance/anim)
  - **Été WaveWatch** (1 jul-31 aoû, ×2 XP, theme=estival)
  - **Saint-Valentin** (7-14 fév, ×2 XP, theme=sakura, genre romance)
  - **Anniversaire WaveWatch** (15-21 mars, ×5 XP, theme=neon)
- Helper `_is_event_currently_active(evt, now)` — gère les fenêtres récurrentes annuelles, y compris span sur 2 années (ex: 20 déc → 10 jan)
- Endpoints publics : `GET /api/seasonal-events/active` (event courant ou null), `GET /api/seasonal-events` (liste complète avec flag `currently_active`)
- Endpoints admin : `GET/POST/PUT/DELETE /api/admin/seasonal-events[/{id}]` — CRUD complet sécurisé `require_admin`
- **Bug fix critique** : projection MongoDB de `/api/seasonal-events/active` excluait le champ `active`, ce qui faisait toujours échouer `_is_event_currently_active`. Champ ajouté à la projection + retiré de la réponse.

**Frontend**
- `lib/seasonal.js` : hook `useSeasonalEvent()` avec cache 10 min, fetch `/api/seasonal-events/active`
- `components/SeasonalBanner.js` : bandeau gradient au-dessus de la nav, icône dynamique (Ghost/TreePine/Sun/Heart/Cake/Sparkles/Zap), couleur dynamique de l'événement, badge ×N XP, CTA "En savoir plus" → `/leaderboard`, fermable (sessionStorage)
- `components/AutoThemeApplier.js` : applique automatiquement `event.auto_theme` si `localStorage.ww_theme_user_set !== '1'`. Une fois que l'utilisateur change de thème manuellement, son choix prime.
- `components/Navigation.js` : modification du `setTheme` pour set le flag `ww_theme_user_set=1`
- `App.js` : `<AutoThemeApplier />` + `<SeasonalBanner />` injectés au-dessus de la `<Navigation />`
- `components/admin/EventsAdminPanel.js` : nouvel onglet **"Événements"** dans l'admin avec liste + édition inline (icon picker, color picker, theme picker auto, dates start/end, multiplier XP, genres/types bonus, toggle active, delete)

### 2️⃣ Avatars themed selon le niveau XP
- Nouveau composant `components/UserAvatar.js` réutilisable :
  - Niveau 5+ → médaille tier en bas-à-droite (Bronze→Argent→Or→Platine→Diamant)
  - Niveau 10+ → cadre 3px gradient tier
  - Niveau 20+ → animation glow pulsante du cadre
  - Couleurs/glow : `getTier(level)` depuis `lib/xp.js`
- Intégré dans `Navigation.js` à la place de l'avatar plat (preserve les badges admin/VIP existants)

### 3️⃣ Validation
- Testing agent iteration 36 : **19/19 tests backend** (100%)
  - test_iteration37_seasonal_events.py (11/11) : list public, active null hors saison, create+active toggling, update, delete, admin auth, validation
  - test_iteration35_recommendations_diversity.py (8/8) : non-régression diversité personnalisée + trending
- Test visuel via Playwright : événement de test "Saison du Test" créé → bandeau rose s'affiche en haut + thème sakura auto-appliqué ✅


## Iteration 44 — 2026-05-10 — Live preview admin + Bonus XP événements + Notification broadcast

### 1️⃣ Aperçu live du bandeau dans le formulaire admin
- Nouveau composant `components/SeasonalBannerPreview.js` : version pure render (sans state ni API call) qui prend `event` en prop et reproduit le visuel du `SeasonalBanner`
- `EventsAdminPanel.js` injecte `<SeasonalBannerPreview event={data} />` en haut de l'`EventEditor` → l'admin voit le rendu en temps réel au fur et à mesure qu'il édite (couleur, multiplicateur, nom, description, icône)

### 2️⃣ Bonus XP événements vraiment appliqué côté backend
**Helpers** (server.py L3819-3865) :
- `_base_xp_for_action(action)` : movie=10, tv/anime/episode=15 (mirroir de `lib/xp.js#computeXP`)
- `_get_matching_active_event(content_type, content_id)` : cache 60s, retourne le 1er événement actif dont `bonus_content_types` matche le type ET (si `bonus_genres` non vide) intersecte les genres TMDB du contenu

**Hook dans POST /api/user/history** (L727-770) :
- Lors d'un premier visionnage (existing=False), si match → insertion dans `db.xp_bonuses` `{user_id, event_slug, event_id, content_type, content_id, base_xp, bonus_xp, created_at}` + `users.{uid}.xp_bonus += bonus_xp` (atomique via $inc)
- bonus_xp = round(base × (multiplier - 1)) → multiplier=3 sur movie = +20 XP

**Nouveaux endpoints** :
- `GET /api/user/stats` retourne maintenant `xp_bonus` (re-fetch user pour garantir fraîcheur)
- `GET /api/user/xp-bonuses` : `{total_bonus_xp, by_event: {slug: total}, recent: [...]}`

**Frontend** :
- `lib/xp.js#useUserXP` ajoute `xp_bonus` (depuis stats) au XP de base → niveau calculé sur `xp_total = xp_base + xp_bonus`
- `components/LevelCard.js` affiche un badge inline **"+N bonus événement"** quand `xpBonus > 0`
- ProfilePage et LeaderboardPage propagent `xp_bonus` à `<LevelCard>`

### 3️⃣ Broadcast notification événement
- `POST /api/admin/seasonal-events/{event_id}/notify` (admin) : crée une notification "🎉 Événement : {name} — {description} — Bonus ×N XP actif !" pour TOUS les utilisateurs (link → `/leaderboard`)
- Bouton **"Notifier"** (icône Bell) ajouté sur chaque card d'événement dans l'admin avec confirm dialog
- Réponse `{sent: int, event: slug}` + log `admin_activities`

### Validation
- Testing agent iteration 38 : **10/10 tests pytest pass (100%)**
  - Notify : 401/403/404/admin-success ✅
  - Bonus XP : first watch +20, no double bonus on re-post, tv-skipped-when-types-movie, mult=1 no bonus, no active event no bonus, fresh user defaults
- Test visuel admin : aperçu live se met à jour en temps réel ✅
- Test E2E curl : event mai → notify 5 users → fresh user POST history movie 550 → xp_bonus=20 ✅

## Iteration 45 — 2026-05-10 — Page /events publique + Carte bonus + FIX désync XP Dashboard/Profile

### 🐛 Bug fix CRITIQUE — XP différent entre Dashboard et Profile
**Symptôme** : Le Dashboard affichait 1960 XP / Niv 5, le Profile affichait 115 XP / Niv 2 pour le même utilisateur.
**Cause** :
- `useUserXP` (utilisé par Profile/Leaderboard) appelait l'URL inexistante `/api/user/stats/detailed` → 404 silencieux → seules favorites/playlists comptaient
- L'URL correcte est `/api/user/detailed-stats` (avec tiret, ce qu'utilise DashboardPage)
- Le champ aussi était wrong : `total_minutes_watched` n'existe pas, c'est `total_watch_time` (en minutes)
- En plus DashboardPage avait sa propre formule XP locale dupliquée → risque de divergence
**Fix** :
1. `lib/xp.js#useUserXP` : URL corrigée + champ `total_watch_time` + `total_likes` (au lieu de `likes_given`)
2. `DashboardPage` : suppression de la formule XP locale, utilise désormais `useUserXP(user)` + `getLevelBounds(level)` → **source unique partagée avec Profile/Leaderboard**
3. Dashboard affiche aussi le bonus XP événement à côté du XP total

### 1️⃣ Nouvelle page publique /events
- `pages/EventsPage.js` : page calendrier sans authentification, accessible à tous les visiteurs
- Hero gradient avec 3 stat-cards (Événements actifs / À venir / Bonus XP max)
- Section "Actifs maintenant" avec ping animé vert si au moins 1 événement en cours
- Section "Prochains événements" triés par jours restants — calculés via fenêtre récurrente annuelle
- Cards événement avec : icône colorée gradient, plage de dates ("15-31 octobre" / "1 juillet → 31 août"), countdown ("Dans X mois/jours/aujourd'hui"), description, pills `×N XP` + thème auto
- CTA inscription en bas de page (accroche marketing : "Rejoins la fête 🎉")
- Lien dans le Footer (icône Sparkles)
- Lien depuis `SeasonalBanner` "En savoir plus" → `/events` (au lieu de `/leaderboard`)
- Notification broadcast événement → link `/events` (au lieu de `/leaderboard`)

### 2️⃣ Composant `BonusXPCard` (Dashboard + Profile)
- `components/BonusXPCard.js` : agrège `/api/user/xp-bonuses`
- État vide : message d'incitation "Aucun bonus pour le moment. Regarde du contenu pendant un événement actif…"
- État rempli : total + liste des 5 événements top + détail dépliable des 10 dernières actions (content_type, content_id, event_slug, +N XP)
- Mode `compact` pour la sidebar du Profile, mode normal pour Dashboard
- Intégré sur DashboardPage (sous la card niveau XP) et ProfilePage (sidebar droite, sous LevelCard)

### Validation
- Lint OK sur tous les fichiers modifiés (xp.js, EventsPage, BonusXPCard, DashboardPage, ProfilePage)
- Test visuel `/events` : 5 cards trier par "Dans X mois", stats correctes, CTA inscription visible ✅
- Test visuel Dashboard + Profile en parallèle : **mêmes valeurs XP/niveau** (0 XP / Niv 1 sur le compte de preview) ✅
- BonusXPCard rendue en empty state sur les deux pages (admin pas eu de bonus)


## Iteration 46 — 2026-05-10 — SEO complet : JSON-LD Schema.org + sitemap + robots

### 1️⃣ Composant SEO réutilisable
- `components/SEOHead.js` : hook léger sans dépendance (pas de react-helmet)
  - Pose dynamiquement `<title>`, `<meta name=description>`, `<meta property=og:title|og:description>`, `<meta name=twitter:title>`, `<link rel=canonical>` et un ou plusieurs `<script type="application/ld+json">`
  - Restore les valeurs précédentes au unmount → propre pour navigation SPA

### 2️⃣ JSON-LD sur /events (Schema.org Event)
- 1 `Organization` global (depuis index.html)
- 1 `ItemList` qui wrap tous les événements (numberOfItems + itemListElement)
- 1 `Event` par événement avec :
  - `name`, `description`, `startDate`/`endDate` ISO 8601 (calculé sur la prochaine occurrence annuelle récurrente)
  - `eventStatus: EventScheduled`, `eventAttendanceMode: OnlineEventAttendanceMode`
  - `location: VirtualLocation` (URL `/events`)
  - `organizer: Organization WaveWatch`
  - `offers` (gratuit, EUR, InStock)
  - `isAccessibleForFree: true`, `inLanguage: fr-FR`
- 7 scripts JSON-LD au total sur la page (1 ItemList + 5 Event + 1 Organization global) → Google Rich Results compatible

### 3️⃣ Meta tags globales (`public/index.html`)
- `description` enrichie + `robots: index, follow`
- **Open Graph** complet : og:site_name, og:type, og:title, og:description, og:image, og:locale
- **Twitter Card** : summary_large_image
- **JSON-LD Organization** statique (présent sur toutes les pages, indépendant de React)

### 4️⃣ Sitemap & Robots backend
- `GET /api/sitemap.xml` : liste les 13 pages principales (home, /events, /movies, /tv-shows, /anime, /calendar, /leaderboard, /dns-vpn, /faq, /changelogs, /dmca, /login, /register) avec `lastmod` du jour, `changefreq` et `priority` adaptés
- `GET /api/robots.txt` : `Allow: /`, `Disallow: /admin` + `/api/admin`, lien vers le sitemap
- Variable d'env `PUBLIC_BASE_URL` (par défaut `https://wavewatch.top`) pour personnaliser l'URL du sitemap

### Validation
- Lint OK (EventsPage.js, SEOHead.js)
- Test E2E Playwright sur `/events` :
  - Title correct ("Événements saisonniers — Halloween, Noël, Été | WaveWatch")
  - Meta description posée
  - Canonical URL posée (avec window.location.origin)
  - 7 scripts JSON-LD détectés
  - 1er Event LD complet (name, startDate=2026-07-01, endDate=2026-08-31, organizer, offers)
  - ItemList avec numberOfItems=5
- Test root `/` : Organization LD présent (statique depuis index.html), og:title posé
- Tests curl sitemap.xml + robots.txt → réponses XML/text valides ✅

### Backlog SEO (P2)
- Ajouter image hero (og:image override) par page importante
- Schema `Movie`/`TVSeries` sur les détails (déjà servis par TMDB, à mapper)
- Sitemap dynamique des films/séries (exposer top 1000 movies populaires depuis TMDB)
- hreflang si support multi-langue (en/fr) un jour


---

## Iteration 38 — Playlists sort + Collections complètes (2026-01-10)

### Bugs corrigés
1. **`/discover/playlists` — Tri inopérant** : le pinning forcé `is_staff: -1` avant le sort écrasait toutes les options du menu. Supprimé → les 6 options (Plus récentes / anciennes / aimées / critiquées / grandes / Nom A→Z) réordonnent réellement la liste. Le badge STAFF reste visible sur les cartes.
2. **Module "Playlists de la Communauté" (home)** : affichait toujours les mêmes playlists. Désormais affichage **aléatoire à chaque chargement** via nouveau `sort_by=random` (aggregation `$sample`).
3. **`/collections` — 24 collections hardcodées** : remplacé par index TMDB complet (~140-150 collections uniques) construit depuis les 25 premières pages de `/movie/popular` + détails (`belongs_to_collection`). Tri par popularité (défaut), Nom A→Z, Nombre de films. Pagination 24/page. Search avec fallback `/search/collection` pour couverture maximale.

### Endpoints touchés
- `GET /api/playlists/public/enhanced` : ajout `sort_by=random` (via `$sample`), suppression du staff pinning
- `GET /api/tmdb/collections/popular?page=&limit=&sort_by=popularity|name|size&q=` (NEW) — cache mémoire 24h, pré-chauffé au startup
- Helper `_build_popular_collections_index` : 25 pages × 20 films, concurrence 30, ~17s à froid

### Validation
- Backend testing : 17/17 tests pytest ✅ (`/app/backend/tests/test_iteration38_playlists_collections.py`)
- Playwright `/collections` : 144 collections, tri Nom A→Z fonctionne (10 Things → 28 → After → Aladdin → Alien…)
- Frontend hot-reload OK, lint OK

### Backlog
- Persister l'index TMDB en Mongo (survie aux redémarrages)
- Splitter `server.py` (~4277 lignes) en routers
