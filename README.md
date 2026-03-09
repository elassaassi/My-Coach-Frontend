# Momentum — Frontend

> Super-app sportive pour la communauté marocaine et la diaspora.
> Interface web et mobile construite avec **Angular 19 + Ionic 8** dans un monorepo **Nx 20**.

🔗 Backend API : [My-Coach](https://github.com/elassaassi/My-Coach)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Monorepo | Nx 20 |
| Web | Angular 19 (standalone components, lazy loading, functional guards) |
| Mobile | Ionic 8 + Capacitor 6 (iOS / Android) |
| HTTP | Angular HttpClient + intercepteurs (JWT Bearer, unwrap `{success, data}`) |
| Styles | SCSS + CSS Custom Properties (design tokens) |
| Typo | Poppins (titres) · Inter (corps) |

---

## Structure du monorepo

```
momentum-frontend/
├── apps/
│   ├── web/                  # Application Angular (navigateur)
│   │   ├── src/app/
│   │   │   ├── core/         # Guards, layout shell, sidebar
│   │   │   └── features/     # Pages (auth, dashboard, activities…)
│   │   └── proxy.conf.json   # Proxy /api → localhost:8080
│   └── mobile/               # Application Ionic + Capacitor
│       ├── src/app/
│       │   ├── core/         # Tabs layout, guards
│       │   └── features/     # Pages mobile (home, auth…)
│       └── theme/            # Variables Ionic mappées aux tokens Momentum
└── libs/
    ├── models/               # Interfaces TypeScript (User, Activity, Rating…)
    ├── api-client/           # Services HTTP + intercepteurs
    └── ui/                   # Design system Momentum
        ├── tokens/           # design-tokens.scss (variables CSS)
        └── lib/              # mn-button, mn-card, mn-badge, mn-avatar
```

---

## Design system

Défini dans `libs/ui/src/tokens/design-tokens.scss` :

| Token | Valeur | Usage |
|-------|--------|-------|
| `--clr-primary` | `#FF3A00` | Boutons CTA, accents |
| `--clr-secondary` | `#0D1B4B` | Fond, texte principal |
| `--clr-accent` | `#F5C400` | Badges, highlights |
| `--font-heading` | Poppins | Titres |
| `--font-body` | Inter | Corps de texte |

### Composants partagés (`@momentum/ui`)

| Composant | Description |
|-----------|-------------|
| `<mn-button>` | Bouton avec variants (primary/outline) + spinner loading |
| `<mn-card>` | Carte avec header optionnel |
| `<mn-badge>` | Badge coloré (statut, niveau sportif) |
| `<mn-avatar>` | Avatar avec initiales + indicateur en ligne |

---

## Prérequis

- Node.js ≥ 22 — [nvm](https://github.com/nvm-sh/nvm) recommandé : `nvm install 22`
- Backend [My-Coach](https://github.com/elassaassi/My-Coach) démarré sur `http://localhost:8080`

---

## Installation & démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer l'app web
npm run web
# → http://localhost:4200

# 3. Démarrer l'app mobile (navigateur)
npm run mobile
# → http://localhost:4201
```

---

## Build production

```bash
# Web
npm run build:web

# Mobile → Android (Android Studio requis)
npm run android

# Mobile → iOS (Xcode requis, macOS uniquement)
npm run ios
```

---

## Pages disponibles

### Web (`apps/web`)

| Route | Description | Statut |
|-------|-------------|--------|
| `/auth/login` | Connexion email / Google / Facebook | ✅ |
| `/auth/register` | Inscription | ✅ |
| `/auth/callback` | Réception token OAuth2 social login | ✅ |
| `/dashboard` | Tableau de bord | ✅ |
| `/activities` | Liste des activités + filtres | ✅ |
| `/activities/create` | Création d'activité | 🔧 Stub |
| `/activities/:id` | Détail activité | 🔧 Stub |
| `/matching` | Matching de joueurs | 🔧 Stub |
| `/rating` | Notation et leaderboard | ✅ |
| `/coaching` | Coachs et réservations | 🔧 Stub |
| `/highlights` | Pic du jour | 🔧 Stub |
| `/scouting` | Talents et recruteurs | 🔧 Stub |
| `/messages` | Messagerie | 🔧 Stub |
| `/profile` | Profil utilisateur | 🔧 Stub |

### Mobile (`apps/mobile`)

| Onglet | Description | Statut |
|--------|-------------|--------|
| Home | Feed d'activités + pull-to-refresh | ✅ |
| Activités | Liste | 🔧 Stub |
| Créer | Nouvelle activité | 🔧 Stub |
| Chat | Messagerie | 🔧 Stub |
| Profil | Mon profil | 🔧 Stub |
| Auth | Login / Register | ✅ |

---

## Authentification

### Email / Mot de passe
Le formulaire appelle `POST /api/v1/auth/login`.
Le token JWT est stocké dans `localStorage` (`momentum_token`).

### Social Login (Google / Facebook)
Le bouton redirige vers Spring Security OAuth2 :
```
http://localhost:8080/oauth2/authorization/google
http://localhost:8080/oauth2/authorization/facebook
```
Spring redirige ensuite vers `/auth/callback?token=...&userId=...`, géré par `CallbackComponent`.

Pour activer le social login, définir les variables d'environnement côté backend :
```bash
GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx ./mvnw spring-boot:run
FACEBOOK_APP_ID=xxx  FACEBOOK_APP_SECRET=xxx
```

---

## Services API (`@momentum/api-client`)

| Service | Endpoints |
|---------|-----------|
| `AuthService` | login, register, profile (`GET /api/v1/users/me`), logout |
| `ActivityService` | create, search, join, leave |
| `RatingService` | rate player, get stats, leaderboard |
| `HighlightService` | publish, like, feed, highlight of the day |

### Intercepteurs
- **`authInterceptor`** — ajoute `Authorization: Bearer <token>` sur chaque requête
- **`apiUnwrapInterceptor`** — déballage automatique de `{ success, data }` → `data`

---

## Lancer les tests

```bash
npm test
```

---

## Liens

| Ressource | URL |
|-----------|-----|
| App web (dev) | http://localhost:4200 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Repo backend | https://github.com/elassaassi/My-Coach |