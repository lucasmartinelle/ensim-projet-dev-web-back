# Cahier des charges — Plateforme de jeux en ligne

**Étudiant :** Lucas MARTINELLE
**Contexte :** Projet Fullstack — ENSIM 4A
**Date :** Mars 2026

---

## 1. Présentation du projet

### 1.1 Description générale

L'objectif est de développer une **plateforme web multi-jeux** accessible depuis un navigateur, sans installation requise. Les joueurs peuvent s'affronter en ligne ou jouer en solo, et suivre leurs performances via un système de classement global (leaderboard).

La plateforme inclut :
- Un catalogue de jeux simples jouables en ligne
- Un système de comptes utilisateurs avec authentification
- Un leaderboard public affichant les meilleurs scores par jeu
- Un dashboard d'administration pour gérer le contenu et les utilisateurs

### 1.2 Catégories d'utilisateurs

| Rôle | Description |
|------|-------------|
| **Visiteur** | Utilisateur non authentifié — accès public limité |
| **Joueur** | Utilisateur authentifié — accès aux fonctionnalités complètes |
| **Administrateur** | Gestion de la plateforme, du contenu et des utilisateurs |

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Node.js, Express.js 5, TypeScript |
| Temps réel | Socket.io (WebSockets) |
| Base de données | PostgreSQL (instance Dockerisée) |
| ORM | Prisma |
| Authentification | Passport.js (local strategy) |
| Validation | Zod |
| Sécurité | Helmet, CORS |
| Logging | Morgan |

---

## 3. Gestion de projet

- **Versioning :** GitHub (Git Flow)
- **Issues & Milestones :** GitHub Issues — une issue par fonctionnalité, une branche par issue
- **Workflow :** Les milestones et issues sont générés automatiquement via `gh` CLI après planification

### Conventions de branches (Git Flow)

```
main          ← production stable
develop       ← intégration continue
feature/*     ← nouvelles fonctionnalités
hotfix/*      ← correctifs urgents
release/*     ← préparation des releases
```

---

## 4. Releases

### Release de base (MVP)

**Fonctionnalités publiques (non authentifié) :**
- Page d'accueil avec contenu configurable par l'administrateur
- Inscription et connexion (email + mot de passe)
- Accès aux jeux sans sauvegarde de score
- Consultation du leaderboard global

**Fonctionnalités protégées (authentifié) :**
- Sauvegarde automatique des scores après chaque partie
- Historique des parties jouées
- Profil utilisateur

**Fonctionnalités administrateur :**
- Dashboard d'administration
- Gestion des utilisateurs (liste, suspension, suppression)
- Édition du contenu de la page d'accueil

---

### Release avancée 1

- Authentification OAuth2 (Google, GitHub)
- Ajout de nouveaux jeux à la plateforme

---

### Release avancée 2

- **Mode spectateur :** page listant toutes les parties en cours avec possibilité de rejoindre en lecture seule
- **Messagerie en partie :**
  - Chat entre joueurs (`chat:players`)
  - Chat entre spectateurs (`chat:spectators`)
  - Les spectateurs ne peuvent pas écrire aux joueurs (refus serveur)

---

## 5. Modèle de données (prévisionnel)

```
User
  id, email, username, passwordHash, role, createdAt

Game
  id, name, slug, description, coverImage

Score
  id, userId, gameId, value, createdAt

Match
  id, gameId, status (waiting | ongoing | finished), createdAt
  players: User[]
  spectators: User[]

HomeContent
  id, key, value, updatedAt
```

---

## 6. Multijoueur temps réel

Le multijoueur est géré via **Socket.io** (WebSockets) monté sur le même serveur HTTP qu'Express.

### Architecture d'une partie

Chaque partie est isolée dans une **room Socket.io** identifiée par l'UUID du match :

```
Client A ──┐
           ├──► Room "match:<uuid>" ──► Server ──► Prisma ──► BDD
Client B ──┘         ▲
                     │ (lecture seule)
                Spectateurs
```

### Flux d'événements

| Événement (client → serveur) | Description |
|------------------------------|-------------|
| `join-match` | Rejoindre une partie en tant que joueur |
| `join-as-spectator` | Rejoindre en lecture seule |
| `game-action` | Envoyer une action de jeu (ignoré si spectateur) |
| `chat:players` | Message dans le chat joueurs |
| `chat:spectators` | Message dans le chat spectateurs |

| Événement (serveur → client) | Description |
|------------------------------|-------------|
| `state-update` | Nouvel état du jeu broadcasté à la room |
| `match-end` | Fin de partie avec scores finaux |

### Règles métier

- L'état d'une partie en cours vit **en mémoire serveur** (Map) — seul le score final est persisté en BDD
- Un spectateur ne peut pas envoyer de `game-action` ni de `chat:players`
- La room est détruite à la fin de la partie

---

## 7. Contraintes techniques

- L'API REST expose ses routes sous le préfixe `/api`
- Le serveur WebSocket partage le même port que l'API REST (`httpServer`)
- La base de données PostgreSQL tourne dans un conteneur Docker
- Les variables d'environnement sensibles sont gérées via `.env` (non versionné)
- La validation des entrées est assurée par Zod côté backend
- Les mots de passe sont hachés avant stockage (bcrypt)
- Les sessions / tokens JWT sont utilisés pour l'authentification
