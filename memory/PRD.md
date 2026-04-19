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
