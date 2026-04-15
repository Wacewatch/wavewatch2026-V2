# WaveWatch PRD

## Original Problem Statement
Plateforme de streaming WaveWatch - Corrections et améliorations demandées pour l'admin, la recherche, les thèmes et les fonctionnalités séries.

## User Personas
- **Administrateur** : Gère le contenu, les utilisateurs, les modules de la page d'accueil
- **Utilisateur Standard** : Regarde films/séries, crée des playlists, utilise la recherche
- **Utilisateur VIP/VIP+** : Accès aux thèmes premium, fonctionnalités exclusives

## Core Requirements (Static)
- Interface de streaming avec films, séries, anime
- Gestion admin complète (CRUD pour tous les contenus)
- Système de thèmes personnalisables
- Recherche globale multi-contenus
- Gestion des playlists et favoris
- Intégration TMDB pour le contenu

## What's Been Implemented

### 2026-04-15 - Session Corrections
1. **Admin - Modules avec drag & drop**
   - Composant ModuleOrderManager.js créé
   - Réordonnement par glisser-déposer
   - Boutons flèches haut/bas
   - Numéros de position

2. **Fix Chaînes TV et Retrogaming**
   - Backend corrigé pour éviter doublons
   - Suppression fonctionne correctement
   - IDs nettoyés avant insertion

3. **Page Retrogaming**
   - Affichage en grille comme chaînes TV
   - Filtres par catégorie
   - Modal de lecture intégré

4. **Recherche globale améliorée**
   - Endpoint /api/search/all créé
   - Recherche dans : TV, musique, jeux, logiciels, ebooks, radio
   - Filtres dynamiques selon résultats

5. **Nouveaux thèmes**
   - Gratuits : Cyberpunk, Monochrome, Sakura
   - Limité : Estival (été)
   - VIP : Inferno, Arctic
   - Badges "NEW" ajoutés
   - Animations VIP améliorées

6. **Fonctionnalités Séries**
   - Bouton "Reprendre" avec S{x} E{y}
   - Marquer toute la série comme vue
   - Progression par saison
   - Endpoints /api/user/tv-progress créés

7. **Barres de recherche retirées**
   - Pages : Jeux, Logiciels, Musique, Ebooks
   - Utilisation de la recherche principale

8. **Promos LiveWatch/Sports-Stream**
   - Logos corrects affichés
   - Liens vers livewatch.sbs et sports-stream.sbs
   - Serveur de secours pour LiveWatch

## Prioritized Backlog

### P0 (Critique)
- [x] Admin modules drag & drop
- [x] Fix doublons TV channels
- [x] Recherche globale

### P1 (Important)
- [x] Nouveaux thèmes avec badges
- [x] Reprendre lecture séries
- [x] Marquer série entière comme vue
- [ ] Compteurs TMDB dans admin

### P2 (Nice to have)
- [ ] Watch Party (regarder ensemble)
- [ ] Personnalisation playlists avancée
- [ ] Notifications push

## Tech Stack
- Frontend: React 18 + Tailwind CSS
- Backend: FastAPI (Python)
- Database: MongoDB
- API: TMDB pour contenu films/séries

## Next Tasks
1. Ajouter du contenu test pour valider filtres de recherche
2. Améliorer personnalisation playlists
3. Implémenter Watch Party
