# Plan d'implémentation — Backend

> Référence : [Cahier des charges](./cahier-des-charges.md) | [Architecture technique](./architecture-technique.md)

---

## Table des matières

1. [Structure cible du projet](#1-structure-cible-du-projet)
2. [Schéma Prisma cible](#2-schéma-prisma-cible)
3. [Étape 1 — Fondations & Infrastructure](#étape-1--fondations--infrastructure)
4. [Étape 2 — Authentification locale](#étape-2--authentification-locale)
5. [Étape 3 — Utilisateurs & Profil](#étape-3--utilisateurs--profil)
6. [Étape 4 — Jeux & Leaderboard](#étape-4--jeux--leaderboard)
7. [Étape 5 — Gestion des Matches (REST)](#étape-5--gestion-des-matches-rest)
8. [Étape 6 — Multijoueur temps réel (Socket.io)](#étape-6--multijoueur-temps-réel-socketio)
9. [Étape 7 — Dashboard Administrateur](#étape-7--dashboard-administrateur)
10. [Étape 8 — OAuth2 (Release avancée 1)](#étape-8--oauth2-release-avancée-1)
11. [Étape 9 — Spectateurs & Chat (Release avancée 2)](#étape-9--spectateurs--chat-release-avancée-2)
12. [Conventions de code](#conventions-de-code)
13. [Variables d'environnement](#variables-denvironnement)

---

## 1. Structure cible du projet

```
src/
├── app.ts                        # Express + middlewares globaux (sans listen)
├── server.ts                     # httpServer + Socket.io + listen()
├── config/
│   └── env.ts                    # Variables d'environnement validées par Zod
├── db/
│   └── prisma.ts                 # Singleton PrismaClient
├── middlewares/
│   ├── error.middleware.ts       # Gestion centralisée des erreurs (dernier middleware)
│   ├── auth.middleware.ts        # Vérification JWT → req.user
│   └── role.middleware.ts        # Vérification req.user.role === 'ADMIN'
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts        # Déclaration des routes /auth
│   │   ├── auth.controller.ts    # Parsing req/res, appel service
│   │   ├── auth.service.ts       # Logique : register, login, génération JWT
│   │   └── auth.schemas.ts       # Zod : RegisterSchema, LoginSchema
│   ├── users/
│   │   ├── users.routes.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts      # findById, updateProfile, deleteAccount, list, suspend
│   │   └── users.schemas.ts      # Zod : UpdateProfileSchema
│   ├── games/
│   │   ├── games.routes.ts
│   │   ├── games.controller.ts
│   │   └── games.service.ts      # listGames, getGameBySlug, createGame (admin)
│   ├── matches/
│   │   ├── matches.routes.ts
│   │   ├── matches.controller.ts
│   │   ├── matches.service.ts    # createMatch, joinMatch, getActiveMatches, endMatch
│   │   ├── matches.schemas.ts    # Zod : CreateMatchSchema
│   │   └── match.state.ts        # Map en mémoire matchId → GameState
│   ├── scores/
│   │   ├── scores.routes.ts
│   │   ├── scores.controller.ts
│   │   ├── scores.service.ts     # submitScore, getLeaderboard
│   │   └── scores.schemas.ts     # Zod : SubmitScoreSchema
│   └── admin/
│       ├── admin.routes.ts
│       ├── admin.controller.ts
│       └── admin.service.ts      # getUsers, suspendUser, getHomeContent, updateHomeContent
├── sockets/
│   ├── index.ts                  # Init Socket.io, auth handshake JWT, register handlers
│   ├── match.socket.ts           # Handlers : join-match, game-action, disconnect, match-end
│   └── chat.socket.ts            # Handlers : chat:players, chat:spectators (Release 2)
└── routes/
    └── index.ts                  # Agrégation de tous les routeurs REST sous /api
```

---

## 2. Schéma Prisma cible

Fichier : `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  username     String        @unique
  passwordHash String
  role         Role          @default(PLAYER)
  suspended    Boolean       @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  scores       Score[]
  matchPlayers MatchPlayer[]
  // Release avancée 1
  googleId     String?       @unique
  githubId     String?       @unique
}

model Game {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  coverImage  String?
  createdAt   DateTime @default(now())
  scores      Score[]
  matches     Match[]
}

model Score {
  id        String   @id @default(uuid())
  value     Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  game      Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  gameId    String
}

model Match {
  id        String        @id @default(uuid())
  status    MatchStatus   @default(WAITING)
  createdAt DateTime      @default(now())
  endedAt   DateTime?
  game      Game          @relation(fields: [gameId], references: [id])
  gameId    String
  players   MatchPlayer[]
}

model MatchPlayer {
  match     Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  matchId   String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  role      MatchRole @default(PLAYER)
  score     Int?      // score final, renseigné à la fin de la partie
  @@id([matchId, userId])
}

model HomeContent {
  id        String   @id @default(uuid())
  key       String   @unique  // ex: "hero_title", "hero_subtitle", "hero_cta"
  value     String
  updatedAt DateTime @updatedAt
}

enum Role {
  PLAYER
  ADMIN
}

enum MatchStatus {
  WAITING   // en attente de joueurs
  ONGOING   // partie en cours
  FINISHED  // partie terminée, scores persistés
}

enum MatchRole {
  PLAYER
  SPECTATOR
}
```

---

## Étape 1 — Fondations & Infrastructure

**Objectif :** serveur opérationnel avec base de données accessible.

### 1.1 — Docker & PostgreSQL

- [ ] Créer `docker-compose.yml` à la racine du projet :
  ```yaml
  services:
    db:
      image: postgres:16
      restart: always
      environment:
        POSTGRES_USER: gameuser
        POSTGRES_PASSWORD: gamepass
        POSTGRES_DB: gameplatform
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data
  volumes:
    pgdata:
  ```
- [ ] Vérifier la connexion : `docker compose up -d && npx prisma db push`

### 1.2 — Variables d'environnement

- [ ] Créer `.env` à partir de `.env.example` (voir section [Variables d'environnement](#variables-denvironnement))
- [ ] Refaire `src/config/env.ts` avec validation Zod — le serveur doit planter au démarrage si une variable obligatoire est manquante :
  ```typescript
  import { z } from 'zod';
  const schema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
  });
  export const env = schema.parse(process.env);
  ```

### 1.3 — Prisma

- [ ] Installer `@prisma/client` : `npm install @prisma/client`
- [ ] Initialiser Prisma : `npx prisma init`
- [ ] Écrire le schéma complet (voir section 2)
- [ ] Créer `src/db/prisma.ts` — singleton pour éviter trop de connexions en dev :
  ```typescript
  import { PrismaClient } from '@prisma/client';
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  export const prisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```
- [ ] Créer la première migration : `npx prisma migrate dev --name init`

### 1.4 — Séparation app / server

- [ ] Créer `src/server.ts` qui importe `app` et crée le `httpServer` :
  ```typescript
  import { createServer } from 'http';
  import app from './app';
  import { env } from './config/env';

  const httpServer = createServer(app);

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  export { httpServer };
  ```
- [ ] Supprimer tout `app.listen()` depuis `app.ts`
- [ ] Mettre à jour le script `dev` dans `package.json` : `nodemon src/server.ts`

### 1.5 — Vérification

- [ ] `GET /api/health` répond `{ status: "OK", timestamp: "<ISO>" }`
- [ ] Prisma se connecte sans erreur au démarrage (log de confirmation)

---

## Étape 2 — Authentification locale

**Objectif :** inscription, connexion, protection des routes par JWT.

### 2.1 — Dépendances

- [ ] `npm install passport passport-local jsonwebtoken bcrypt`
- [ ] `npm install -D @types/passport @types/passport-local @types/jsonwebtoken @types/bcrypt`

### 2.2 — Zod schemas (`src/modules/auth/auth.schemas.ts`)

- [ ] `RegisterSchema` :
  - `email` : string, format email
  - `username` : string, 3–20 caractères, alphanumérique + underscore
  - `password` : string, min 8 caractères
- [ ] `LoginSchema` :
  - `email` : string, format email
  - `password` : string, non vide

### 2.3 — Service (`src/modules/auth/auth.service.ts`)

- [ ] `register(data)` :
  1. Vérifier email et username non pris (sinon throw `'Email already used'`)
  2. Hasher le password : `bcrypt.hash(password, 10)`
  3. Créer l'utilisateur via Prisma
  4. Retourner l'utilisateur sans `passwordHash`
- [ ] `login(email, password)` :
  1. Trouver l'utilisateur par email (sinon throw `'Invalid credentials'`)
  2. Vérifier si le compte est suspendu (sinon throw `'Account suspended'`)
  3. Comparer le password : `bcrypt.compare(password, user.passwordHash)`
  4. Générer un JWT : `jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' })`
  5. Retourner `{ token, user }` (sans `passwordHash`)
- [ ] `generateToken(user)` : helper réutilisable (utilisé aussi par OAuth2 plus tard)

### 2.4 — Controller (`src/modules/auth/auth.controller.ts`)

- [ ] `register` : parse body avec `RegisterSchema`, appelle `auth.service.register`, retourne 201
- [ ] `login` : parse body avec `LoginSchema`, appelle `auth.service.login`, retourne 200 `{ token, user }`
- [ ] `me` : retourne `req.user` (injecté par le middleware auth)
- [ ] Chaque controller wrap l'appel service dans un try/catch et passe l'erreur à `next(err)`

### 2.5 — Middleware JWT (`src/middlewares/auth.middleware.ts`)

- [ ] Lire le header `Authorization: Bearer <token>`
- [ ] Vérifier et décoder le JWT avec `jwt.verify(token, env.JWT_SECRET)`
- [ ] Charger l'utilisateur complet depuis Prisma par `sub` (l'id)
- [ ] Attacher à `req.user`
- [ ] Si token absent/invalide → `res.status(401).json({ message: 'Unauthorized' })`
- [ ] Étendre le type Express Request pour inclure `user` :
  ```typescript
  // src/types/express.d.ts
  declare namespace Express {
    interface Request {
      user?: { id: string; email: string; username: string; role: Role };
    }
  }
  ```

### 2.6 — Middleware rôle (`src/middlewares/role.middleware.ts`)

- [ ] Vérifier `req.user?.role === 'ADMIN'`
- [ ] Si non → `res.status(403).json({ message: 'Forbidden' })`
- [ ] Toujours utiliser après `isAuthenticated`

### 2.7 — Routes (`src/modules/auth/auth.routes.ts`)

```
POST /api/auth/register   → public              → authController.register
POST /api/auth/login      → public              → authController.login
GET  /api/auth/me         → isAuthenticated     → authController.me
```

### 2.8 — Vérification

- [ ] `POST /api/auth/register` avec des données valides → 201 + user sans passwordHash
- [ ] `POST /api/auth/register` email dupliqué → 400 ou 409
- [ ] `POST /api/auth/login` correct → 200 + token JWT
- [ ] `POST /api/auth/login` mauvais mdp → 401
- [ ] `GET /api/auth/me` avec token valide → 200 + user
- [ ] `GET /api/auth/me` sans token → 401

---

## Étape 3 — Utilisateurs & Profil

**Objectif :** gestion du profil utilisateur et administration des comptes.

### 3.1 — Zod schemas (`src/modules/users/users.schemas.ts`)

- [ ] `UpdateProfileSchema` :
  - `username` : string, 3–20 caractères (optionnel)
  - `email` : string, format email (optionnel)
  - Au moins un champ requis (`.refine()`)

### 3.2 — Service (`src/modules/users/users.service.ts`)

- [ ] `findById(id)` : retourne l'utilisateur sans `passwordHash`
- [ ] `updateProfile(id, data)` :
  1. Si nouveau username → vérifier unicité
  2. Si nouvel email → vérifier unicité
  3. `prisma.user.update()`
- [ ] `deleteAccount(id)` : `prisma.user.delete()` (cascade sur scores et matchPlayers)
- [ ] `listAll()` : `prisma.user.findMany()` sans `passwordHash`, avec pagination (offset/limit)
- [ ] `suspend(id, suspended: boolean)` : `prisma.user.update({ suspended })`

### 3.3 — Routes

```
GET    /api/users/me          → isAuthenticated    → usersController.getMe
PATCH  /api/users/me          → isAuthenticated    → usersController.updateMe
DELETE /api/users/me          → isAuthenticated    → usersController.deleteMe
GET    /api/users             → isAdmin            → usersController.listAll
PATCH  /api/users/:id/suspend → isAdmin            → usersController.suspend
DELETE /api/users/:id         → isAdmin            → usersController.deleteUser
```

### 3.4 — Vérification

- [ ] `PATCH /api/users/me` avec nouveau username → 200 + user mis à jour
- [ ] `PATCH /api/users/me` avec username déjà pris → 409
- [ ] `DELETE /api/users/me` → 204, le compte n'existe plus
- [ ] `GET /api/users` sans token admin → 403
- [ ] `PATCH /api/users/:id/suspend` → l'utilisateur suspendu ne peut plus se connecter

---

## Étape 4 — Jeux & Leaderboard

**Objectif :** catalogue de jeux et classements publics.

### 4.1 — Service jeux (`src/modules/games/games.service.ts`)

- [ ] `listGames()` : `prisma.game.findMany()` — tous les jeux
- [ ] `getGameBySlug(slug)` : `prisma.game.findUnique({ where: { slug } })` — 404 si absent
- [ ] `createGame(data)` : réservé à l'usage admin/seed, pas exposé en route publique

### 4.2 — Service scores (`src/modules/scores/scores.service.ts`)

- [ ] `submitScore(userId, gameId, value)` :
  1. Vérifier que le jeu existe (sinon throw)
  2. `prisma.score.create()`
  3. Retourner le score créé
- [ ] `getLeaderboard(gameId, limit = 10)` :
  ```typescript
  prisma.score.findMany({
    where: { gameId },
    orderBy: { value: 'desc' },
    take: limit,
    include: { user: { select: { id: true, username: true } } },
  })
  ```
- [ ] `getUserScores(userId, gameId?)` : historique des scores d'un joueur, optionnellement filtré par jeu

### 4.3 — Routes

```
GET  /api/games                          → public            → listGames
GET  /api/games/:slug                    → public            → getGameBySlug
GET  /api/games/:slug/leaderboard        → public            → getLeaderboard
GET  /api/games/:slug/leaderboard?limit= → public (param)    → getLeaderboard
POST /api/games/:slug/scores             → isAuthenticated   → submitScore
GET  /api/users/me/scores                → isAuthenticated   → getUserScores
```

### 4.4 — Vérification

- [ ] `GET /api/games` → liste de tous les jeux (tableau, peut être vide)
- [ ] `GET /api/games/tic-tac-toe` → jeu ou 404
- [ ] `GET /api/games/tic-tac-toe/leaderboard` → top 10 avec username
- [ ] `POST /api/games/tic-tac-toe/scores` → 201 + score créé
- [ ] `POST /api/games/tic-tac-toe/scores` sans auth → 401

---

## Étape 5 — Gestion des Matches (REST)

**Objectif :** créer et rejoindre des parties, exposer l'état pour le frontend et les spectateurs.

### 5.1 — État en mémoire (`src/modules/matches/match.state.ts`)

L'état de jeu en cours n'est PAS en base de données — trop volatile et trop fréquent. Il vit en mémoire :

```typescript
export interface GameState {
  matchId: string;
  gameSlug: string;
  board: unknown;          // structure dépend du jeu
  currentTurn: string;     // userId
  players: string[];       // [userId, userId]
  spectators: string[];    // [userId, ...]
  socketIds: Map<string, string>; // userId → socketId
  startedAt: Date;
}

export const matchStates = new Map<string, GameState>();
```

### 5.2 — Service (`src/modules/matches/matches.service.ts`)

- [ ] `createMatch(gameId, creatorId)` :
  1. Vérifier que le jeu existe
  2. `prisma.match.create({ status: 'WAITING' })`
  3. Ajouter le créateur comme premier joueur (`MatchPlayer`)
  4. Retourner le match avec ses joueurs
- [ ] `joinMatch(matchId, userId)` :
  1. Vérifier que le match est en `WAITING`
  2. Vérifier que le joueur n'est pas déjà dans la partie
  3. Vérifier que la partie n'est pas pleine (logique dépend du jeu)
  4. Ajouter le joueur → `prisma.matchPlayer.create()`
  5. Si la partie est maintenant pleine → passer à `ONGOING`, initialiser `GameState` en mémoire
- [ ] `getActiveMatches()` : `prisma.match.findMany({ where: { status: 'ONGOING' }, include: { game: true, players: true } })`
- [ ] `endMatch(matchId, scores: { userId: string, score: number }[])` :
  1. Persister les scores dans `MatchPlayer` et dans `Score`
  2. `prisma.match.update({ status: 'FINISHED', endedAt: new Date() })`
  3. Supprimer l'état en mémoire : `matchStates.delete(matchId)`

### 5.3 — Zod schemas (`src/modules/matches/matches.schemas.ts`)

- [ ] `CreateMatchSchema` : `{ gameId: string (uuid) }`

### 5.4 — Routes

```
POST /api/matches           → isAuthenticated   → createMatch
GET  /api/matches           → public            → getActiveMatches
GET  /api/matches/:id       → public            → getMatchById
POST /api/matches/:id/join  → isAuthenticated   → joinMatch
```

### 5.5 — Vérification

- [ ] `POST /api/matches` → 201 + match en WAITING
- [ ] `POST /api/matches/:id/join` 2ème joueur → match passe en ONGOING
- [ ] `GET /api/matches` → liste les parties ONGOING avec infos jeu + joueurs
- [ ] Rejoindre une partie ONGOING ou FINISHED → 400

---

## Étape 6 — Multijoueur temps réel (Socket.io)

**Objectif :** synchroniser l'état de jeu entre les joueurs en temps réel.

### 6.1 — Dépendances

- [ ] `npm install socket.io`
- [ ] (côté front) `npm install socket.io-client`

### 6.2 — Initialisation (`src/sockets/index.ts`)

- [ ] Attacher Socket.io au `httpServer`
- [ ] Configurer les CORS de Socket.io en cohérence avec Express
- [ ] Authentifier chaque connexion via le JWT dans le handshake :
  ```typescript
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.data.userId = payload.sub;
      socket.data.role = 'player'; // sera mis à jour au join
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  ```
- [ ] Enregistrer les handlers : `registerMatchHandlers(io)`

### 6.3 — Handlers de match (`src/sockets/match.socket.ts`)

- [ ] `join-match` `({ matchId })` :
  1. Vérifier que le match existe en BDD et que l'utilisateur en fait partie
  2. `socket.join(`match:${matchId}`)`
  3. Mettre à jour `matchStates` avec le socketId
  4. Émettre `state-update` avec le `GameState` courant

- [ ] `join-as-spectator` `({ matchId })` :
  1. Vérifier que le match est ONGOING
  2. `socket.join(`match:${matchId}`)`
  3. `socket.data.role = 'spectator'`
  4. Ajouter l'userId dans `gameState.spectators`
  5. Émettre `state-update` à ce socket uniquement

- [ ] `game-action` `({ matchId, action })` :
  1. Si `socket.data.role === 'spectator'` → retourner sans rien faire
  2. Récupérer `GameState` depuis `matchStates`
  3. Vérifier que c'est bien le tour de ce joueur
  4. Appliquer l'action → calculer le nouvel état
  5. Broadcaster `state-update` à toute la room `match:${matchId}`
  6. Si l'état est terminal (victoire, match nul) → appeler `matches.service.endMatch()` et émettre `match-end`

- [ ] `leave-match` `({ matchId })` :
  1. `socket.leave(`match:${matchId}`)`
  2. Mettre à jour l'état mémoire

- [ ] `disconnect` :
  1. Identifier dans quelles rooms était ce socket
  2. Si une partie ONGOING → gérer l'abandon (fin de partie par forfait ou pause selon la logique du jeu)

### 6.4 — Événements complets

| Direction | Événement | Payload | Description |
|-----------|-----------|---------|-------------|
| C → S | `join-match` | `{ matchId }` | Rejoindre une partie comme joueur |
| C → S | `join-as-spectator` | `{ matchId }` | Rejoindre en lecture seule |
| C → S | `game-action` | `{ matchId, action }` | Envoyer une action (ignoré si spectateur) |
| C → S | `leave-match` | `{ matchId }` | Quitter la room |
| S → C | `state-update` | `GameState` | Nouvel état broadcasté à toute la room |
| S → C | `match-end` | `{ scores, winnerId? }` | Fin de partie |
| S → C | `error` | `{ message }` | Erreur métier (action invalide, etc.) |

### 6.5 — Vérification

- [ ] Deux clients connectés à la même room reçoivent bien `state-update` en temps réel
- [ ] Un client sans token JWT est refusé au handshake (event `connect_error`)
- [ ] Un spectateur émettant `game-action` ne déclenche aucune action
- [ ] À la fin d'une partie, les scores sont bien persistés en BDD

---

## Étape 7 — Dashboard Administrateur

**Objectif :** gérer les utilisateurs et le contenu de la page d'accueil.

### 7.1 — Service (`src/modules/admin/admin.service.ts`)

- [ ] `getUsers({ page, limit, search? })` : liste paginée + filtre optionnel par username/email
- [ ] `suspendUser(id, suspended)` : toggle suspension
- [ ] `deleteUser(id)` : suppression complète (cascade Prisma)
- [ ] `getHomeContent()` : `prisma.homeContent.findMany()`
- [ ] `upsertHomeContent(key, value)` : `prisma.homeContent.upsert()`

### 7.2 — Routes

```
GET    /api/admin/users                 → isAdmin   → getUsers (avec ?page=&limit=&search=)
PATCH  /api/admin/users/:id/suspend     → isAdmin   → suspendUser
DELETE /api/admin/users/:id             → isAdmin   → deleteUser
GET    /api/admin/home-content          → isAdmin   → getHomeContent
PATCH  /api/admin/home-content/:key     → isAdmin   → upsertHomeContent
```

Également exposé en public (lecture seule) :
```
GET /api/home-content          → public   → getHomeContent (pour la page d'accueil)
```

### 7.3 — Seed initial

- [ ] Créer `prisma/seed.ts` :
  - Un utilisateur ADMIN par défaut
  - Les jeux disponibles (au moins Tic-Tac-Toe)
  - Des `HomeContent` par défaut (`hero_title`, `hero_subtitle`)
- [ ] Ajouter dans `package.json` : `"prisma": { "seed": "ts-node prisma/seed.ts" }`
- [ ] Commande : `npx prisma db seed`

### 7.4 — Vérification

- [ ] Connexion admin → accès à `GET /api/admin/users`
- [ ] Connexion joueur → `GET /api/admin/users` → 403
- [ ] `PATCH /api/admin/users/:id/suspend` → compte ciblé ne peut plus se connecter
- [ ] `PATCH /api/admin/home-content/hero_title` → nouvelle valeur retournée par `GET /api/home-content`

---

## Étape 8 — OAuth2 (Release avancée 1)

**Objectif :** permettre la connexion via Google et GitHub.

### 8.1 — Dépendances

- [ ] `npm install passport-google-oauth20 passport-github2`
- [ ] `npm install -D @types/passport-google-oauth20 @types/passport-github2`

### 8.2 — Migration Prisma

- [ ] Ajouter `googleId String? @unique` et `githubId String? @unique` sur `User`
- [ ] Rendre `passwordHash` nullable : `passwordHash String?`
- [ ] `npx prisma migrate dev --name add-oauth`

### 8.3 — Logique OAuth (`src/modules/auth/auth.service.ts`)

- [ ] `findOrCreateFromOAuth(provider, profileId, email, username)` :
  1. Chercher l'utilisateur par `googleId` / `githubId`
  2. Sinon chercher par email
  3. Si trouvé → mettre à jour l'id OAuth
  4. Sinon → créer un nouvel utilisateur (sans `passwordHash`)
  5. Retourner un JWT

### 8.4 — Routes

```
GET /api/auth/google           → redirect vers Google
GET /api/auth/google/callback  → échange code → JWT → redirect frontend
GET /api/auth/github           → redirect vers GitHub
GET /api/auth/github/callback  → échange code → JWT → redirect frontend
```

Le callback redirige vers le frontend avec le token dans l'URL (`?token=...`) ou via un cookie.

### 8.5 — Variables d'environnement supplémentaires

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
FRONTEND_URL=http://localhost:3001
```

---

## Étape 9 — Spectateurs & Chat (Release avancée 2)

**Objectif :** mode spectateur et messagerie en partie.

### 9.1 — Page spectateur (REST)

- [ ] `GET /api/matches` retourne déjà les parties ONGOING — aucune modification nécessaire
- [ ] Ajouter le nombre de spectateurs dans la réponse

### 9.2 — Handlers chat (`src/sockets/chat.socket.ts`)

- [ ] `chat:players` `({ matchId, message })` :
  1. Vérifier `socket.data.role !== 'spectator'` (sinon émettre `error`)
  2. Broadcaster uniquement aux sockets de la room ayant `role === 'player'` :
     ```typescript
     // Filtrer les sockets de la room par rôle
     const sockets = await io.in(`match:${matchId}`).fetchSockets();
     const playerSockets = sockets.filter(s => s.data.role === 'player');
     playerSockets.forEach(s => s.emit('chat:players', { from: socket.data.userId, message }));
     ```

- [ ] `chat:spectators` `({ matchId, message })` :
  1. Broadcaster aux sockets de la room ayant `role === 'spectator'`
  2. Les joueurs ne reçoivent pas ce message

### 9.3 — Événements chat

| Direction | Événement | Payload | Destinataires |
|-----------|-----------|---------|---------------|
| C → S | `chat:players` | `{ matchId, message }` | Joueurs uniquement |
| C → S | `chat:spectators` | `{ matchId, message }` | Spectateurs uniquement |
| S → C | `chat:players` | `{ from, message, timestamp }` | Joueurs |
| S → C | `chat:spectators` | `{ from, message, timestamp }` | Spectateurs |

### 9.4 — Vérification

- [ ] Un spectateur émettant `chat:players` reçoit `error` en retour
- [ ] Les joueurs ne reçoivent pas les messages du chat spectateurs
- [ ] Les spectateurs ne reçoivent pas les messages du chat joueurs

---

## Conventions de code

### Architecture
- **Routes** : déclaration des chemins et des middlewares uniquement — aucune logique
- **Controllers** : parsing et validation des entrées (Zod), appel du service, formatage de la réponse HTTP
- **Services** : toute la logique métier, interaction avec Prisma — ne connaissent pas `req`/`res`
- **Prisma** : uniquement dans les services, jamais dans les controllers ou les routes

### Gestion des erreurs
- Dans les services : `throw new Error('message lisible')` — pas de codes HTTP
- Dans les controllers : `try/catch` → `next(err)` pour déléguer à `errorMiddleware`
- `errorMiddleware` retourne toujours `{ message }` en JSON

### Validation
- Toute entrée externe validée par Zod dans le controller, avant d'appeler le service
- En cas d'erreur Zod : retourner 400 avec les détails de validation

### Typage
- Pas de `any`
- Retourner explicitement les types des fonctions de service
- Utiliser les types Prisma générés (`User`, `Game`, etc.) — ne pas redéfinir des interfaces équivalentes

### Nommage
- `camelCase` : variables, fonctions, propriétés
- `PascalCase` : types, interfaces, classes, enums
- `SCREAMING_SNAKE_CASE` : constantes d'environnement
- Fichiers : `<nom>.<type>.ts` (ex: `auth.service.ts`, `auth.schemas.ts`)

---

## Variables d'environnement

Fichier `.env.example` à committer :

```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
DATABASE_URL="postgresql://gameuser:gamepass@localhost:5432/gameplatform"

# JWT
JWT_SECRET="min_16_characters_secret_here"

# OAuth2 (Release avancée 1)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Frontend (pour les redirects OAuth)
FRONTEND_URL=http://localhost:3001
```
