# Test Credentials

## Admin (dev/preview)
- Email: admin@wavewatch.com
- Password: WaveWatch2026!
- Role: admin, is_vip, is_vip_plus, is_uploader = true

⚠️ À CHANGER IMPÉRATIVEMENT AVANT MISE EN LIGNE (via env var ADMIN_PASSWORD)

## Auth Endpoints
- POST /api/auth/register  (body: {username, email (EmailStr), password (min 8, 1 maj, 1 digit)})
- POST /api/auth/login     (body: {email, password})
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh

## Policies actives
- Password: min 8 car., 1 majuscule, 1 chiffre
- Rate-limit register: 5/h/IP → 429
- Rate-limit login: 5 bad/IP:email → 429 (lockout 15min)
- Cookies httpOnly; secure+samesite=none en prod (ENV=production), sinon lax
- CORS: origines via FRONTEND_URL (comma-separated supporté)
