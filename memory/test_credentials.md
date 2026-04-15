# Test Credentials

## Admin Account
- Email: admin@wavewatch.com
- Password: WaveWatch2026!
- Role: admin (aussi VIP, VIP+, Uploader)

## Roles disponibles
- **Membre** : utilisateur standard (inscription normale)
- **VIP** : code d'activation `vip2025` dans Profil > Code d'activation
- **VIP+** : code d'activation `vipplus2025`
- **Uploader** : code d'activation `uplo2025#`
- **Admin** : code d'activation `45684568`

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh

## User Endpoints
- PUT /api/user/profile
- PUT /api/user/change-password
- POST /api/user/activate-code
- POST /api/user/remove-privileges
- DELETE /api/user/account
- GET /api/user/stats
- GET /api/user/detailed-stats
- GET /api/user/status-batch
- POST /api/user/heartbeat
- POST /api/user/ratings
- GET /api/user/ratings/check

## Admin Endpoints
- GET /api/admin/users
- GET /api/admin/users/{id}
- PUT /api/admin/users/{id}
- DELETE /api/admin/users/{id}
- GET /api/admin/stats
- GET /api/admin/enhanced-stats
- GET /api/admin/online-users
- GET/PUT /api/admin/site-settings/{key}
- POST/DELETE /api/admin/cinema-rooms
- POST/PUT/DELETE /api/admin/tv-channels/{id}
- POST/PUT/DELETE /api/admin/radio-stations/{id}
- POST/PUT/DELETE /api/admin/music/{id}
- POST/PUT/DELETE /api/admin/software/{id}
- POST/PUT/DELETE /api/admin/games/{id}
- POST/PUT/DELETE /api/admin/ebooks/{id}
- POST/PUT/DELETE /api/admin/retrogaming/{id}
- POST/PUT/DELETE /api/admin/changelogs/{id}
- POST /api/admin/broadcast
- PUT/DELETE /api/admin/content-requests/{id}
