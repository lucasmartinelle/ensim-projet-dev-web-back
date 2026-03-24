# API Reference — GamePlatform Backend

Documentation destinée à l'équipe frontend (Next.js). Décrit l'ensemble des endpoints REST et des événements Socket.io disponibles.

---

## Sommaire

1. [Informations générales](#1-informations-générales)
2. [Authentification](#2-authentification)
3. [Format des erreurs](#3-format-des-erreurs)
4. [Modèles de données](#4-modèles-de-données)
5. [Endpoints REST](#5-endpoints-rest)
   - [Health](#51-health)
   - [Auth](#52-auth)
   - [Utilisateur connecté](#53-utilisateur-connecté)
   - [Jeux](#54-jeux)
   - [Scores](#55-scores)
   - [Matches](#56-matches)
   - [Contenu de la page d'accueil (public)](#57-contenu-de-la-page-daccueil-public)
   - [Admin — Utilisateurs](#58-admin--utilisateurs)
   - [Admin — Contenu de la page d'accueil](#59-admin--contenu-de-la-page-daccueil)
6. [WebSocket (Socket.io)](#6-websocket-socketio)
   - [Connexion](#61-connexion)
   - [Événements émis par le client](#62-événements-émis-par-le-client)
   - [Événements reçus par le client](#63-événements-reçus-par-le-client)
   - [Cycle de vie d'un match](#64-cycle-de-vie-dun-match)
   - [Format du GameState](#65-format-du-gamestate)
   - [Logique Tic-Tac-Toe](#66-logique-tic-tac-toe)

---

## 1. Informations générales

| Propriété | Valeur |
|-----------|--------|
| Base URL (développement) | `http://localhost:3000/api` |
| Format des requêtes | `application/json` |
| Format des réponses | `application/json` |
| Authentification | JWT Bearer token |
| WebSocket | `http://localhost:3000` (Socket.io v4) |

Toutes les routes sont préfixées par `/api`. Exemple : `GET http://localhost:3000/api/health`.

---

## 2. Authentification

Les routes protégées nécessitent un **Bearer token JWT** dans le header `Authorization` :

```
Authorization: Bearer <token>
```

Le token est obtenu lors du login (`POST /api/auth/login`) et est valable **7 jours**.

### Niveaux d'accès

| Niveau | Description |
|--------|-------------|
| Public | Aucun token requis |
| `isAuthenticated` | Token JWT valide requis |
| `isAdmin` | Token JWT avec `role: "ADMIN"` requis |

### Payload JWT

Le token contient les champs suivants (décodables côté client) :

```json
{
  "sub": "uuid-utilisateur",
  "role": "PLAYER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 3. Format des erreurs

Toutes les erreurs suivent un format unifié.

### Erreur de validation (400)

Déclenchée lorsque le body d'une requête ne passe pas la validation Zod.

```json
{
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "email",
      "message": "Adresse email invalide"
    },
    {
      "field": "password",
      "message": "Le mot de passe doit contenir au moins 8 caractères"
    }
  ]
}
```

### Erreur métier (400 / 401 / 403 / 404 / 500)

```json
{
  "message": "Description de l'erreur"
}
```

### Codes HTTP utilisés

| Code | Cas d'usage |
|------|-------------|
| `200` | Succès avec corps |
| `201` | Ressource créée |
| `204` | Succès sans corps (DELETE) |
| `400` | Validation échouée ou règle métier violée |
| `401` | Token absent ou invalide |
| `403` | Token valide mais droits insuffisants |
| `404` | Ressource introuvable |
| `500` | Erreur interne serveur |

---

## 4. Modèles de données

### User

```ts
{
  id: string;          // UUID
  email: string;
  username: string;    // 3-20 caractères, alphanumérique + underscore
  role: "PLAYER" | "ADMIN";
  suspended: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

> Le champ `passwordHash` n'est jamais renvoyé au client.

### Game

```ts
{
  id: string;           // UUID
  name: string;
  slug: string;         // ex: "tic-tac-toe"
  description: string | null;
  coverImage: string | null;
  createdAt: string;    // ISO 8601
}
```

### Match

```ts
{
  id: string;           // UUID
  status: "WAITING" | "ONGOING" | "FINISHED";
  createdAt: string;    // ISO 8601
  endedAt: string | null;
  gameId: string;
  game: {
    id: string;
    name: string;
    slug: string;
  };
  players: MatchPlayer[];
}
```

### MatchPlayer

```ts
{
  matchId: string;
  userId: string;
  role: "PLAYER" | "SPECTATOR";
  score: number | null;
  user: {
    id: string;
    username: string;
  };
}
```

### Score

```ts
{
  id: string;           // UUID
  value: number;        // entier positif
  createdAt: string;    // ISO 8601
  user?: {              // présent dans le leaderboard
    id: string;
    username: string;
  };
  game?: {              // présent dans les scores de l'utilisateur
    id: string;
    name: string;
    slug: string;
  };
}
```

### HomeContent

```ts
{
  id: string;
  key: string;          // ex: "hero_title"
  value: string;
  updatedAt: string;    // ISO 8601
}
```

Clés disponibles après le seed :

| Clé | Valeur par défaut |
|-----|-------------------|
| `hero_title` | `"Bienvenue sur GamePlatform"` |
| `hero_subtitle` | `"Affrontez vos amis en ligne sur nos jeux classiques."` |
| `hero_cta` | `"Commencer à jouer"` |

---

## 5. Endpoints REST

### 5.1 Health

#### `GET /api/health`

Vérifie que le serveur est opérationnel.

**Accès :** Public

**Réponse `200` :**
```json
{
  "status": "OK",
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

---

### 5.2 Auth

#### `POST /api/auth/register`

Crée un nouveau compte utilisateur.

**Accès :** Public

**Body :**
```json
{
  "email": "user@example.com",
  "username": "my_username",
  "password": "monMotDePasse123"
}
```

| Champ | Contraintes |
|-------|-------------|
| `email` | Email valide |
| `username` | 3–20 caractères, `[a-zA-Z0-9_]` uniquement |
| `password` | Minimum 8 caractères |

**Réponse `201` :**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "my_username",
    "role": "PLAYER",
    "createdAt": "2026-03-24T10:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `400` — Email déjà utilisé : `"Cette adresse email est déjà utilisée"`
- `400` — Username déjà pris : `"Ce nom d'utilisateur est déjà pris"`
- `400` — Validation échouée

---

#### `POST /api/auth/login`

Authentifie un utilisateur et retourne un token JWT.

**Accès :** Public

**Body :**
```json
{
  "email": "user@example.com",
  "password": "monMotDePasse123"
}
```

**Réponse `200` :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "my_username",
    "role": "PLAYER",
    "createdAt": "2026-03-24T10:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `400` — Identifiants invalides : `"Identifiants invalides"`
- `400` — Compte suspendu : `"Ce compte est suspendu"`

> Le token doit être stocké côté client (localStorage ou cookie httpOnly) et envoyé dans le header `Authorization: Bearer <token>` pour toutes les requêtes protégées.

---

#### `GET /api/auth/me`

Retourne les informations de l'utilisateur à partir de son token JWT.

**Accès :** `isAuthenticated`

**Réponse `200` :**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "my_username",
    "role": "PLAYER"
  }
}
```

> Retourne les données du payload JWT, pas une requête BDD. Préférer `GET /api/users/me` pour les données fraîches.

---

### 5.3 Utilisateur connecté

#### `GET /api/users/me`

Retourne le profil complet de l'utilisateur connecté depuis la base de données.

**Accès :** `isAuthenticated`

**Réponse `200` :**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "my_username",
    "role": "PLAYER",
    "suspended": false,
    "createdAt": "2026-03-24T10:00:00.000Z",
    "updatedAt": "2026-03-24T10:00:00.000Z"
  }
}
```

---

#### `PATCH /api/users/me`

Met à jour le profil de l'utilisateur connecté.

**Accès :** `isAuthenticated`

**Body :** (au moins un champ requis)
```json
{
  "username": "new_username",
  "email": "newemail@example.com"
}
```

| Champ | Contraintes |
|-------|-------------|
| `username` | Optionnel, 3–20 caractères, `[a-zA-Z0-9_]` |
| `email` | Optionnel, email valide |

**Réponse `200` :**
```json
{
  "user": {
    "id": "uuid",
    "email": "newemail@example.com",
    "username": "new_username",
    "role": "PLAYER",
    "suspended": false,
    "createdAt": "2026-03-24T10:00:00.000Z",
    "updatedAt": "2026-03-24T10:05:00.000Z"
  }
}
```

**Erreurs possibles :**
- `400` — Aucun champ fourni
- `400` — Email ou username déjà utilisé

---

#### `DELETE /api/users/me`

Supprime définitivement le compte de l'utilisateur connecté.

**Accès :** `isAuthenticated`

**Réponse `204` :** (aucun corps)

---

#### `GET /api/users/me/scores`

Retourne les scores de l'utilisateur connecté. Filtrable par jeu.

**Accès :** `isAuthenticated`

**Query params :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `gameSlug` | `string` (optionnel) | Filtre par jeu (ex: `tic-tac-toe`) |

**Exemple :** `GET /api/users/me/scores?gameSlug=tic-tac-toe`

**Réponse `200` :**
```json
{
  "scores": [
    {
      "id": "uuid",
      "value": 1,
      "createdAt": "2026-03-24T10:00:00.000Z",
      "game": {
        "id": "uuid",
        "name": "Tic-Tac-Toe",
        "slug": "tic-tac-toe"
      }
    }
  ]
}
```

---

### 5.4 Jeux

#### `GET /api/games`

Liste tous les jeux disponibles.

**Accès :** Public

**Réponse `200` :**
```json
{
  "games": [
    {
      "id": "uuid",
      "name": "Tic-Tac-Toe",
      "slug": "tic-tac-toe",
      "description": "Le classique jeu de morpion à deux joueurs.",
      "coverImage": null,
      "createdAt": "2026-03-24T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/games/:slug`

Retourne les détails d'un jeu par son slug.

**Accès :** Public

**Exemple :** `GET /api/games/tic-tac-toe`

**Réponse `200` :**
```json
{
  "game": {
    "id": "uuid",
    "name": "Tic-Tac-Toe",
    "slug": "tic-tac-toe",
    "description": "Le classique jeu de morpion à deux joueurs.",
    "coverImage": null,
    "createdAt": "2026-03-24T10:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `404` — `"Jeu introuvable"`

---

#### `GET /api/games/:slug/leaderboard`

Retourne le classement du jeu.

**Accès :** Public

**Query params :**
| Paramètre | Type | Défaut | Maximum |
|-----------|------|--------|---------|
| `limit` | `number` | `10` | `100` |

**Exemple :** `GET /api/games/tic-tac-toe/leaderboard?limit=5`

**Réponse `200` :**
```json
{
  "leaderboard": [
    {
      "id": "uuid",
      "value": 1,
      "createdAt": "2026-03-24T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "username": "champion"
      }
    }
  ]
}
```

> Les scores sont triés par valeur décroissante.

---

#### `POST /api/games` — Admin

Crée un nouveau jeu.

**Accès :** `isAdmin`

**Body :**
```json
{
  "name": "Chess",
  "slug": "chess",
  "description": "Le jeu d'échecs classique.",
  "coverImage": "https://example.com/chess.png"
}
```

| Champ | Contraintes |
|-------|-------------|
| `name` | Requis, string non vide |
| `slug` | Requis, format kebab-case unique |
| `description` | Optionnel |
| `coverImage` | Optionnel, URL |

**Réponse `201` :**
```json
{
  "game": { ... }
}
```

---

#### `PATCH /api/games/:slug` — Admin

Met à jour un jeu existant.

**Accès :** `isAdmin`

**Body :** (tous les champs optionnels)
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

**Réponse `200` :**
```json
{
  "game": { ... }
}
```

---

#### `DELETE /api/games/:slug` — Admin

Supprime un jeu.

**Accès :** `isAdmin`

**Réponse `204` :** (aucun corps)

---

### 5.5 Scores

#### `POST /api/games/:gameSlug/scores`

Soumet un score pour un jeu.

**Accès :** `isAuthenticated`

**Exemple :** `POST /api/games/tic-tac-toe/scores`

**Body :**
```json
{
  "value": 1
}
```

| Champ | Contraintes |
|-------|-------------|
| `value` | Entier positif ou nul |

**Réponse `201` :**
```json
{
  "score": {
    "id": "uuid",
    "value": 1,
    "createdAt": "2026-03-24T10:00:00.000Z",
    "userId": "uuid",
    "gameId": "uuid"
  }
}
```

> En pratique, les scores de match sont soumis **automatiquement** par le serveur à la fin d'un match via Socket.io. Cet endpoint est disponible pour des soumissions manuelles éventuelles.

---

### 5.6 Matches

#### `GET /api/matches`

Liste les matches actifs (statut `WAITING` ou `ONGOING`).

**Accès :** Public

**Réponse `200` :**
```json
{
  "matches": [
    {
      "id": "uuid",
      "status": "WAITING",
      "createdAt": "2026-03-24T10:00:00.000Z",
      "endedAt": null,
      "gameId": "uuid",
      "game": {
        "id": "uuid",
        "name": "Tic-Tac-Toe",
        "slug": "tic-tac-toe"
      },
      "players": [
        {
          "matchId": "uuid",
          "userId": "uuid",
          "role": "PLAYER",
          "score": null,
          "user": {
            "id": "uuid",
            "username": "player1"
          }
        }
      ]
    }
  ]
}
```

---

#### `GET /api/matches/:id`

Retourne les détails d'un match spécifique.

**Accès :** Public

**Réponse `200` :**
```json
{
  "match": {
    "id": "uuid",
    "status": "ONGOING",
    "createdAt": "2026-03-24T10:00:00.000Z",
    "endedAt": null,
    "game": { ... },
    "players": [ ... ]
  }
}
```

**Erreurs possibles :**
- `404` — `"Match introuvable"`

---

#### `POST /api/matches`

Crée un nouveau match.

**Accès :** `isAuthenticated`

**Body :**
```json
{
  "gameId": "uuid-du-jeu"
}
```

**Réponse `201` :**
```json
{
  "match": {
    "id": "uuid",
    "status": "WAITING",
    "game": { ... },
    "players": [
      {
        "userId": "uuid-du-créateur",
        "role": "PLAYER",
        "score": null,
        "user": { "id": "uuid", "username": "player1" }
      }
    ]
  }
}
```

> Le créateur est automatiquement inscrit comme premier joueur. Le match passe en `WAITING` jusqu'à ce qu'un second joueur rejoigne.

---

#### `POST /api/matches/:id/join`

Rejoint un match en attente.

**Accès :** `isAuthenticated`

**Réponse `200` :**
```json
{
  "match": {
    "id": "uuid",
    "status": "ONGOING",
    "game": { ... },
    "players": [
      { "userId": "uuid-player1", "role": "PLAYER", "score": null, "user": { ... } },
      { "userId": "uuid-player2", "role": "PLAYER", "score": null, "user": { ... } }
    ]
  }
}
```

> Quand 2 joueurs sont inscrits, le statut passe automatiquement à `ONGOING` et le `GameState` est initialisé en mémoire. Les deux joueurs doivent ensuite se connecter via Socket.io pour jouer.

**Erreurs possibles :**
- `400` — `"Cette partie ne peut plus être rejointe"` (statut != WAITING)
- `400` — `"Vous êtes déjà inscrit à cette partie"`
- `404` — `"Match introuvable"`

---

### 5.7 Contenu de la page d'accueil (public)

#### `GET /api/home-content`

Retourne le contenu éditorial de la page d'accueil.

**Accès :** Public

**Réponse `200` :**
```json
{
  "content": [
    { "id": "uuid", "key": "hero_cta", "value": "Commencer à jouer", "updatedAt": "..." },
    { "id": "uuid", "key": "hero_subtitle", "value": "Affrontez vos amis en ligne sur nos jeux classiques.", "updatedAt": "..." },
    { "id": "uuid", "key": "hero_title", "value": "Bienvenue sur GamePlatform", "updatedAt": "..." }
  ]
}
```

> Le tableau est trié par clé alphabétique.

---

### 5.8 Admin — Utilisateurs

Tous les endpoints ci-dessous nécessitent un token avec `role: "ADMIN"`.

#### `GET /api/admin/users`

Liste paginée des utilisateurs avec filtre de recherche optionnel.

**Accès :** `isAdmin`

**Query params :**
| Paramètre | Type | Défaut | Maximum |
|-----------|------|--------|---------|
| `page` | `number` | `1` | — |
| `limit` | `number` | `20` | `100` |
| `search` | `string` | — | — |

**Exemple :** `GET /api/admin/users?page=1&limit=20&search=alice`

La recherche porte sur `username` et `email` (insensible à la casse).

**Réponse `200` :**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "alice@example.com",
      "username": "alice",
      "role": "PLAYER",
      "suspended": false,
      "createdAt": "2026-03-24T10:00:00.000Z",
      "updatedAt": "2026-03-24T10:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### `PATCH /api/admin/users/:id/suspend`

Suspend ou réactive un compte utilisateur.

**Accès :** `isAdmin`

**Body :**
```json
{
  "suspended": true
}
```

| Champ | Contraintes |
|-------|-------------|
| `suspended` | Booléen requis |

**Réponse `200` :**
```json
{
  "user": {
    "id": "uuid",
    "email": "alice@example.com",
    "username": "alice",
    "role": "PLAYER",
    "suspended": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Erreurs possibles :**
- `400` — `"Le champ suspended doit être un booléen"`
- `404` — `"Utilisateur introuvable"`

---

#### `DELETE /api/admin/users/:id`

Supprime définitivement un compte utilisateur.

**Accès :** `isAdmin`

**Réponse `204` :** (aucun corps)

**Erreurs possibles :**
- `404` — `"Utilisateur introuvable"`

---

### 5.9 Admin — Contenu de la page d'accueil

#### `GET /api/admin/home-content`

Retourne tout le contenu éditorial (identique au endpoint public).

**Accès :** `isAdmin`

**Réponse `200` :**
```json
{
  "content": [
    { "id": "uuid", "key": "hero_title", "value": "Bienvenue sur GamePlatform", "updatedAt": "..." }
  ]
}
```

---

#### `PATCH /api/admin/home-content/:key`

Crée ou met à jour une entrée de contenu par sa clé.

**Accès :** `isAdmin`

**Exemple :** `PATCH /api/admin/home-content/hero_title`

**Body :**
```json
{
  "value": "Bienvenue sur la plateforme de jeux !"
}
```

| Champ | Contraintes |
|-------|-------------|
| `value` | String non vide, requis |

**Réponse `200` :**
```json
{
  "item": {
    "id": "uuid",
    "key": "hero_title",
    "value": "Bienvenue sur la plateforme de jeux !",
    "updatedAt": "2026-03-24T10:05:00.000Z"
  }
}
```

---

## 6. WebSocket (Socket.io)

Le serveur expose un serveur Socket.io sur le même port que l'API REST.

### 6.1 Connexion

La connexion **requiert un token JWT** passé dans les options d'authentification du handshake.

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
});

socket.on('connect', () => {
  console.log('Connecté :', socket.id);
});

socket.on('connect_error', (err) => {
  // err.message === 'Unauthorized' si le token est absent ou invalide
  console.error('Erreur de connexion :', err.message);
});
```

> Sans token valide, la connexion est rejetée avec `connect_error`.

---

### 6.2 Événements émis par le client

#### `join-match`

Rejoint la room Socket.io d'un match en tant que **joueur**.

> Prérequis : l'utilisateur doit d'abord avoir rejoint le match via `POST /api/matches/:id/join` (REST).

```ts
socket.emit('join-match', { matchId: 'uuid-du-match' });
```

**Payload :**
```ts
{ matchId: string }
```

**Effets :**
- Le client intègre la room `match:<matchId>`
- Le serveur envoie immédiatement un événement `state-update` avec l'état courant du match

**Erreurs possibles (via événement `error`) :**
- `"Match introuvable"`
- `"Vous ne faites pas partie de cette partie"`
- `"Erreur lors de la connexion à la partie"`

---

#### `join-as-spectator`

Rejoint la room d'un match en tant que **spectateur**.

```ts
socket.emit('join-as-spectator', { matchId: 'uuid-du-match' });
```

**Payload :**
```ts
{ matchId: string }
```

**Conditions :**
- Le match doit être en statut `ONGOING`
- Le spectateur reçoit `state-update` mais ne peut pas émettre `game-action`

**Erreurs possibles (via événement `error`) :**
- `"Cette partie ne peut pas être observée"` (match non ONGOING ou introuvable)

---

#### `game-action`

Joue un coup dans le match.

```ts
socket.emit('game-action', {
  matchId: 'uuid-du-match',
  action: { index: 4 }, // case du plateau (0-8)
});
```

**Payload :**
```ts
{
  matchId: string;
  action: { index: number }; // 0 à 8 pour Tic-Tac-Toe
}
```

**Conditions :**
- L'émetteur doit être un joueur (pas un spectateur)
- C'est le tour de l'émetteur (`state.currentTurn === userId`)
- La case doit être libre

**Effets en cas de succès :**
- L'état du plateau est mis à jour
- Tous les membres de la room reçoivent `state-update`
- Si la partie est terminée, tous reçoivent `match-end`

**Erreurs possibles (via événement `error`) :**
- `"Partie introuvable en mémoire"`
- `"Ce n'est pas votre tour"`
- `"Cette case est déjà occupée"` (ou toute erreur de logique Tic-Tac-Toe)

---

#### `leave-match`

Quitte la room d'un match proprement (sans forfait).

```ts
socket.emit('leave-match', { matchId: 'uuid-du-match' });
```

**Payload :**
```ts
{ matchId: string }
```

> Un spectateur qui quitte ne déclenche aucune fin de match.

---

### 6.3 Événements reçus par le client

#### `state-update`

Reçu après `join-match`, `join-as-spectator` ou après chaque `game-action`.

```ts
socket.on('state-update', (state: GameState) => {
  // Mettre à jour l'affichage du plateau
});
```

**Voir [section 6.5](#65-format-du-gamestate) pour le format complet.**

---

#### `match-end`

Reçu par tous les membres de la room quand le match se termine (victoire, nul ou forfait).

```ts
socket.on('match-end', (data) => {
  console.log('Fin du match :', data);
});
```

**Payload :**
```ts
{
  scores: Array<{
    userId: string;
    score: number;  // 1 = victoire, 0 = défaite/nul
  }>;
  winnerId: string | null;  // null en cas de match nul
  isDraw: boolean;
  reason?: 'forfeit';       // présent uniquement en cas de déconnexion
}
```

**Exemples :**

Victoire normale :
```json
{
  "scores": [
    { "userId": "player1-id", "score": 1 },
    { "userId": "player2-id", "score": 0 }
  ],
  "winnerId": "player1-id",
  "isDraw": false
}
```

Match nul :
```json
{
  "scores": [
    { "userId": "player1-id", "score": 0 },
    { "userId": "player2-id", "score": 0 }
  ],
  "winnerId": null,
  "isDraw": true
}
```

Forfait (déconnexion) :
```json
{
  "scores": [
    { "userId": "player1-id", "score": 1 },
    { "userId": "player2-id", "score": 0 }
  ],
  "winnerId": "player1-id",
  "isDraw": false,
  "reason": "forfeit"
}
```

---

#### `error`

Reçu en cas d'erreur côté serveur lors du traitement d'un événement.

```ts
socket.on('error', (data: { message: string }) => {
  console.error('Erreur serveur :', data.message);
});
```

---

### 6.4 Cycle de vie d'un match

```
┌─────────────────────────────────────────────────────────┐
│                    FLUX COMPLET                          │
└─────────────────────────────────────────────────────────┘

1. Player 1  →  POST /api/matches          (crée, status: WAITING)
2. Player 2  →  POST /api/matches/:id/join (status: ONGOING, GameState init)

3. Player 1  →  socket.emit('join-match', { matchId })
                ← state-update (plateau vide, tour de Player 1)

4. Player 2  →  socket.emit('join-match', { matchId })
                ← state-update (plateau vide, tour de Player 1)

5. Player 1  →  socket.emit('game-action', { matchId, action: { index: 4 } })
                ← state-update (plateau mis à jour, tour de Player 2)

6. Player 2  →  socket.emit('game-action', { matchId, action: { index: 0 } })
                ← state-update

   ... (alternance des tours) ...

7. Fin de partie
                ← match-end { scores, winnerId, isDraw }
```

> **Important :** Si un joueur se déconnecte pendant un match `ONGOING`, l'adversaire gagne automatiquement par forfait et `match-end` est émis avec `reason: "forfeit"`.

---

### 6.5 Format du GameState

L'état reçu via `state-update` :

```ts
interface GameState {
  matchId: string;
  gameSlug: string;        // ex: "tic-tac-toe"
  board: (string | null)[] | null;  // null avant le premier coup
  currentTurn: string;     // userId du joueur dont c'est le tour
  players: string[];       // [userId1, userId2] — ordre fixe
  spectators: string[];    // userIds des spectateurs connectés
  startedAt: string;       // Date ISO
}
```

> **Note :** Le champ `socketIds` (Map interne) n'est pas sérialisable en JSON et sera absent ou vide dans la réponse.

---

### 6.6 Logique Tic-Tac-Toe

Le plateau est un tableau de 9 cases, indexées de 0 à 8 :

```
 0 | 1 | 2
-----------
 3 | 4 | 5
-----------
 6 | 7 | 8
```

Chaque case contient :
- `null` — case vide
- `string` — `userId` du joueur qui a joué cette case

**Combinaisons gagnantes :**
```
Lignes    : [0,1,2], [3,4,5], [6,7,8]
Colonnes  : [0,3,6], [1,4,7], [2,5,8]
Diagonales: [0,4,8], [2,4,6]
```

**La partie se termine quand :**
- Un joueur aligne 3 cases → `isDraw: false`, `winnerId: userId`
- Les 9 cases sont remplies sans vainqueur → `isDraw: true`, `winnerId: null`

**Exemple de plateau après quelques coups :**
```json
{
  "board": [
    "player2-id", null,         "player1-id",
    null,         "player1-id", null,
    null,         null,         null
  ],
  "currentTurn": "player2-id"
}
```

---

## Récapitulatif des routes

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/health` | Public | Santé du serveur |
| `POST` | `/api/auth/register` | Public | Inscription |
| `POST` | `/api/auth/login` | Public | Connexion, retourne token |
| `GET` | `/api/auth/me` | Auth | Profil depuis le token |
| `GET` | `/api/users/me` | Auth | Profil depuis la BDD |
| `PATCH` | `/api/users/me` | Auth | Modifier son profil |
| `DELETE` | `/api/users/me` | Auth | Supprimer son compte |
| `GET` | `/api/users/me/scores` | Auth | Ses propres scores |
| `GET` | `/api/games` | Public | Liste des jeux |
| `GET` | `/api/games/:slug` | Public | Détails d'un jeu |
| `GET` | `/api/games/:slug/leaderboard` | Public | Classement d'un jeu |
| `POST` | `/api/games` | Admin | Créer un jeu |
| `PATCH` | `/api/games/:slug` | Admin | Modifier un jeu |
| `DELETE` | `/api/games/:slug` | Admin | Supprimer un jeu |
| `POST` | `/api/games/:gameSlug/scores` | Auth | Soumettre un score |
| `GET` | `/api/matches` | Public | Matches actifs |
| `GET` | `/api/matches/:id` | Public | Détails d'un match |
| `POST` | `/api/matches` | Auth | Créer un match |
| `POST` | `/api/matches/:id/join` | Auth | Rejoindre un match |
| `GET` | `/api/home-content` | Public | Contenu page d'accueil |
| `GET` | `/api/admin/users` | Admin | Liste paginée des users |
| `PATCH` | `/api/admin/users/:id/suspend` | Admin | Suspendre/réactiver un user |
| `DELETE` | `/api/admin/users/:id` | Admin | Supprimer un user |
| `GET` | `/api/admin/home-content` | Admin | Contenu éditorial (admin) |
| `PATCH` | `/api/admin/home-content/:key` | Admin | Modifier contenu éditorial |
