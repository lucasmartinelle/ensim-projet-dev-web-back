# CLAUDE.md — ensim-projet-dev-web-back

Ce fichier est lu automatiquement par Claude Code à chaque conversation.

---

## Contexte du projet

Plateforme web de jeux en ligne multi-joueurs. Ce dépôt contient uniquement le **backend** (API REST + WebSockets).

- **Étudiant :** Lucas MARTINELLE — ENSIM 4A
- **Frontend :** dépôt `ensim-projet-dev-web-front` (Next.js 16, Tailwind CSS v4)

---

## Documentation à lire en priorité

Avant toute intervention, lire ces fichiers dans l'ordre :

1. [`wiki/cahier-des-charges.md`](./wiki/cahier-des-charges.md) — périmètre fonctionnel, releases, modèle de données
2. [`wiki/architecture-technique.md`](./wiki/architecture-technique.md) — stack, structure de fichiers, middlewares
3. [`wiki/plan-backend.md`](./wiki/plan-backend.md) — structure cible, schéma Prisma, étapes d'implémentation, conventions

---

## Stack technique (résumé)

| Couche | Outil |
|--------|-------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js 5 |
| Temps réel | Socket.io |
| ORM | Prisma |
| Base de données | PostgreSQL (Docker) |
| Auth | Passport.js local + JWT |
| Validation | Zod |
| Sécurité | Helmet, CORS |

---

## Conventions importantes

- **Architecture :** Routes → Controller → Service → Prisma. Pas de logique métier dans les routes ni les controllers.
- **Validation :** Zod dans les controllers, schemas dans des fichiers `*.schemas.ts` dédiés.
- **Erreurs :** `throw new Error(message)` dans les services — l'`errorMiddleware` centralise la réponse HTTP.
- **Types :** Pas de `any`. Tout est typé explicitement.
- **Socket.io :** Toute authentification Socket.io se fait via JWT dans le handshake. Les spectateurs n'ont pas le droit d'émettre `game-action` ou `chat:players`.
- **Scores :** L'état de jeu vit en mémoire (`match.state.ts`). Seul le score final est persisté en BDD.

---

## Organisation des releases

| Release | Objectif principal |
|---------|--------------------|
| Base (MVP) | Auth locale, jeux, leaderboard, dashboard admin |
| Avancée 1 | OAuth2 (Google, GitHub), nouveaux jeux |
| Avancée 2 | Mode spectateur, chat joueurs/spectateurs |

---

## Structure des routes REST

```
/api/health                        GET  public
/api/auth/register                 POST public
/api/auth/login                    POST public
/api/auth/me                       GET  isAuthenticated
/api/users/me                      GET/PATCH/DELETE isAuthenticated
/api/games                         GET  public
/api/games/:slug                   GET  public
/api/games/:slug/leaderboard       GET  public
/api/games/:slug/scores            POST isAuthenticated
/api/matches                       GET  public
/api/matches/:id                   GET  public
/api/matches                       POST isAuthenticated
/api/matches/:id/join              POST isAuthenticated
/api/admin/users                   GET  isAdmin
/api/admin/users/:id/suspend       PATCH isAdmin
/api/admin/home-content            GET  isAdmin
/api/admin/home-content/:key       PATCH isAdmin
```

---

## Gestion des branches (Git Flow)

La branche principale de développement est `develop`. `main` est réservée aux releases stables.

### Règles strictes

- Ne jamais committer directement sur `main` ou `develop`
- Une issue GitHub = une branche = une Pull Request vers `develop`
- Merger uniquement via PR (pas de merge local direct sur `develop`)

### Nommage des branches

```
feature/<numéro-issue>-<slug-court>   # nouvelle fonctionnalité
hotfix/<numéro-issue>-<slug-court>    # correctif urgent sur main
release/<version>                     # préparation d'une release (ex: release/1.0.0)
```

**Exemples :**
```
feature/3-docker-postgres
feature/7-auth-register
feature/20-socket-join-match
hotfix/42-fix-jwt-expiry
release/1.0.0
```

Le slug doit être court (2-4 mots), en kebab-case, lisible sans contexte.

---

## Conventions de commits (Conventional Commits)

Format obligatoire :

```
<type>(<scope>): <description courte>

[corps optionnel]

[footer optionnel — ex: Closes #12]
```

### Types autorisés

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Réécriture sans changement de comportement |
| `test` | Ajout ou modification de tests |
| `chore` | Maintenance, dépendances, config (pas de code métier) |
| `docs` | Documentation uniquement |
| `perf` | Amélioration de performance |

### Scopes suggérés

`auth` · `users` · `games` · `matches` · `scores` · `admin` · `sockets` · `prisma` · `config` · `middlewares`

### Règles de rédaction

- Description en **minuscules**, sans point final, en français ou en anglais (choisir et tenir
- Maximum **72 caractères** sur la première ligne
- Le footer `Closes #<n>` ferme automatiquement l'issue GitHub associée
- Un commit = une unité logique de travail (ne pas mélanger feat et fix dans le même commit)

### Exemples corrects

```
feat(auth): ajouter le service d'inscription avec bcrypt

Closes #7
```

```
feat(sockets): implémenter le handler join-match

Rejoindre une room Socket.io, mettre à jour matchStates,
émettre state-update au joueur connecté.

Closes #21
```

```
fix(auth): retourner 401 si le compte est suspendu

Closes #7
```

```
chore(prisma): créer la migration initiale

Closes #3
```

```
refactor(matches): extraire la logique d'état en mémoire dans match.state.ts
```

### Exemples incorrects

```
# Mauvais — pas de type
ajout de l'authentification

# Mauvais — trop vague
fix: corrections

# Mauvais — mélange de sujets
feat(auth): register + login + middleware jwt + tests

# Mauvais — majuscule et point final
feat(auth): Ajouter le service d'inscription.
```

---

## Commandes utiles

```bash
npm run dev       # Développement (nodemon + ts-node)
npm run build     # Compilation TypeScript
npm run start     # Production (dist/)
npm run lint      # ESLint

npx prisma migrate dev   # Appliquer les migrations
npx prisma studio        # Interface BDD
```
