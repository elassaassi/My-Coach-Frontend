# Momentum Frontend

> Super-app sportive · Angular 19 (web) + Ionic 8 + Angular (mobile)

## Stack

| Couche | Technologie |
|---|---|
| Framework | Angular 19 (standalone components) |
| Mobile | Ionic 8 + Capacitor 6 |
| Monorepo | Nx 20 |
| HTTP | Angular HttpClient + intercepteurs |
| Styles | SCSS + CSS Custom Properties (design tokens) |
| Typo | Poppins (headings) + Inter (body) |

## Structure

```
momentum-frontend/
├── apps/
│   ├── web/         # Angular 19 SSR (dashboard admin/web)
│   └── mobile/      # Ionic + Angular (iOS + Android via Capacitor)
└── libs/
    ├── models/      # Interfaces TypeScript (miroir du backend Spring)
    ├── api-client/  # Services HTTP + intercepteur JWT
    └── ui/          # Design system (composants + tokens Momentum)
```

## Design Tokens

| Token | Valeur |
|---|---|
| `--clr-primary` | `#FF3A00` (orange-rouge) |
| `--clr-secondary` | `#0D1B4B` (bleu marine) |
| `--clr-accent` | `#F5C400` (or) |
| `--font-heading` | Poppins |
| `--font-body` | Inter |

## Installation & Démarrage

### Prérequis
- Node.js >= 20
- npm >= 10

```bash
cd momentum-frontend
npm install
```

### Web (Angular)
```bash
npm run web
# → http://localhost:4200
```

### Mobile (Ionic dev browser)
```bash
npm run mobile
# → http://localhost:4201
```

### Build Android (APK)
```bash
npm run android
# Capacitor sync + Android Studio
```

### Build iOS
```bash
npm run ios
# Capacitor sync + Xcode
```

## Backend
Le frontend appelle le backend Spring Boot via `/api/v1/**`.

En développement, configurer un proxy dans `apps/web/proxy.conf.json` :
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

## Pages implémentées

### Web (/apps/web)
| Route | Statut |
|---|---|
| `/auth/login` | ✅ Complet |
| `/auth/register` | ✅ Complet |
| `/dashboard` | ✅ Complet |
| `/activities` | ✅ Liste + filtres |
| `/activities/create` | 🔧 Stub |
| `/activities/:id` | 🔧 Stub |
| `/rating` | ✅ Leaderboard |
| `/matching` | 🔧 Stub |
| `/coaching` | 🔧 Stub |
| `/highlights` | 🔧 Stub |
| `/scouting` | 🔧 Stub |
| `/profile` | 🔧 Stub |
| `/messages` | 🔧 Stub |

### Mobile (/apps/mobile)
| Onglet | Statut |
|---|---|
| Home (feed) | ✅ Complet |
| Activités | 🔧 Stub |
| Créer | 🔧 Stub |
| Chat | 🔧 Stub |
| Profil | 🔧 Stub |
| Login/Register | ✅ Complet |

## Composants UI partagés (@momentum/ui)

| Composant | Usage |
|---|---|
| `<mn-button>` | Boutons avec variants + loading |
| `<mn-card>` | Carte avec header optionnel |
| `<mn-badge>` | Badge coloré (status, niveau) |
| `<mn-avatar>` | Avatar avec initiales + indicateur online |

## Services API (@momentum/api-client)

| Service | Endpoints couverts |
|---|---|
| `AuthService` | login, register, profile, logout |
| `ActivityService` | create, search, join, leave |
| `RatingService` | rate, stats, leaderboard |
| `HighlightService` | publish, like, feed, today |