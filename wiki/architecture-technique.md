# Architecture technique

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        Navigateur                           │
│              Next.js 16 + React 19 + Tailwind CSS           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Backend                              │
│              Express.js 5 + TypeScript                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Routes  │  │Middleware│  │ Services │  │  Passport │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                                             │
│              Prisma ORM (client PostgreSQL)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (conteneur Docker)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend (`ensim-projet-dev-web-back`)

### Structure de fichiers

```
src/
├── app.ts                    # Point d'entrée Express, middlewares globaux
├── config/
│   └── env.ts                # Variables d'environnement (dotenv + Zod)
├── middlewares/
└── routes/
```

### Middlewares globaux (dans l'ordre)

| Middleware | Rôle |
|------------|------|
| `helmet` | En-têtes de sécurité HTTP |
| `cors` | Gestion du Cross-Origin |
| `morgan` | Logging des requêtes (dev) |
| `express.json` | Parsing du body JSON |
| `express.urlencoded` | Parsing des formulaires |
| `errorMiddleware` | Capture des erreurs (dernier) |

### Configuration (`src/config/env.ts`)

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `PORT` | `3000` | Port du serveur |
| `NODE_ENV` | `development` | Environnement |
| `DATABASE_URL` | — | URL PostgreSQL (Prisma) |
| `JWT_SECRET` | `secret` | Clé de signature JWT |

### Scripts disponibles

```bash
npm run dev     # Démarrage en développement (nodemon + ts-node)
npm run build   # Compilation TypeScript → dist/
npm run start   # Démarrage depuis dist/ (production)
npm run lint    # ESLint

sudo docker compose -f <docker-compose.yml> up -d # en mode détaché
sudo docker logs -f # voir les logs au premier plan
sudo docker ps # voir l'état des conteneurs
sudo docker down # arrêt des conteneurs
```

### Route de santé

```
GET /api/health → { status: "OK" }
```

---

## Frontend (`ensim-projet-dev-web-front`)

### Stack

| Outil | Version | Rôle |
|-------|---------|------|
| Next.js | 16.2.0 | Framework React SSR/SSG |
| React | 19.2.4 | Bibliothèque UI |
| TypeScript | ^5 | Typage statique |
| Tailwind CSS | ^4 | Styling utilitaire |

### Structure de fichiers

```
app/
├── layout.tsx      # Layout racine (HTML, metadata)
├── page.tsx        # Page d'accueil
└── globals.css     # Styles globaux Tailwind
public/             # Assets statiques
```

---

## Base de données

- **SGBD :** PostgreSQL
- **ORM :** Prisma — schéma versionné, migrations gérées par `prisma migrate`
- **Hébergement :** conteneur Docker (local en dev, potentiellement cloud en prod)

### Variables d'environnement Prisma

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gameplatform"
```

---

## Authentification

- **Stratégie initiale :** Passport.js local (email + mot de passe hashé avec bcrypt)
- **Sessions :** JWT signé (`JWT_SECRET`)
- **Release avancée 1 :** OAuth2 (Google, GitHub) via Passport strategies
