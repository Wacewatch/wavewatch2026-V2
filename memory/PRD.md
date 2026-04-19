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
