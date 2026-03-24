import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GamePlatform API',
            version: '1.0.0',
            description:
                'API REST de la plateforme de jeux en ligne multi-joueurs.\n\n' +
                '## Authentification\n' +
                'Les routes protégées nécessitent un token JWT dans le header `Authorization: Bearer <token>`.\n' +
                'Obtenez un token via `POST /auth/login`. Durée de vie : **7 jours**.\n\n' +
                '## Format des erreurs\n' +
                '- **Validation (400)** : `{ message, errors: [{ field, message }] }`\n' +
                '- **Métier** : `{ message }`',
            contact: {
                name: 'Lucas Martinelle — ENSIM 4A',
            },
        },
        servers: [
            {
                url: '/api',
                description: 'Serveur local (développement)',
            },
        ],
        tags: [
            { name: 'Health', description: 'Santé du serveur' },
            { name: 'Auth', description: 'Inscription, connexion, profil JWT' },
            { name: 'Users', description: "Profil de l'utilisateur connecté" },
            { name: 'Games', description: 'Jeux disponibles et leaderboard' },
            { name: 'Scores', description: 'Soumission de scores' },
            { name: 'Matches', description: 'Gestion des parties (REST)' },
            { name: 'Home', description: "Contenu éditorial de la page d'accueil (public)" },
            { name: 'Admin — Users', description: "Gestion des utilisateurs (réservé ADMIN)" },
            { name: 'Admin — Content', description: "Gestion du contenu éditorial (réservé ADMIN)" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenu via POST /auth/login',
                },
            },
            schemas: {
                // ── Utilisateur ──────────────────────────────────────────────
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        username: { type: 'string', minLength: 3, maxLength: 20, example: 'my_username' },
                        role: { type: 'string', enum: ['PLAYER', 'ADMIN'], example: 'PLAYER' },
                        suspended: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                // ── Jeu ──────────────────────────────────────────────────────
                Game: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Tic-Tac-Toe' },
                        slug: { type: 'string', example: 'tic-tac-toe' },
                        description: { type: 'string', nullable: true, example: 'Le classique jeu de morpion à deux joueurs.' },
                        coverImage: { type: 'string', nullable: true, example: null },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                // ── Match ─────────────────────────────────────────────────────
                MatchPlayer: {
                    type: 'object',
                    properties: {
                        matchId: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        role: { type: 'string', enum: ['PLAYER', 'SPECTATOR'] },
                        score: { type: 'integer', nullable: true },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                username: { type: 'string' },
                            },
                        },
                    },
                },
                Match: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        status: { type: 'string', enum: ['WAITING', 'ONGOING', 'FINISHED'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        endedAt: { type: 'string', format: 'date-time', nullable: true },
                        gameId: { type: 'string', format: 'uuid' },
                        game: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                slug: { type: 'string' },
                            },
                        },
                        players: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MatchPlayer' },
                        },
                    },
                },
                // ── Score ─────────────────────────────────────────────────────
                Score: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        value: { type: 'integer', minimum: 0, example: 1 },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                LeaderboardEntry: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        value: { type: 'integer', example: 1 },
                        createdAt: { type: 'string', format: 'date-time' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                username: { type: 'string' },
                            },
                        },
                    },
                },
                UserScore: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        value: { type: 'integer', example: 1 },
                        createdAt: { type: 'string', format: 'date-time' },
                        game: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                slug: { type: 'string' },
                            },
                        },
                    },
                },
                // ── HomeContent ───────────────────────────────────────────────
                HomeContent: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        key: { type: 'string', example: 'hero_title' },
                        value: { type: 'string', example: 'Bienvenue sur GamePlatform' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                // ── Erreurs ───────────────────────────────────────────────────
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Ressource introuvable' },
                    },
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Erreur de validation' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string', example: 'email' },
                                    message: { type: 'string', example: 'Adresse email invalide' },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    // swagger-jsdoc scanne ces fichiers pour extraire les annotations @openapi
    apis: [
        path.join(__dirname, '../routes/index.ts'),
        path.join(__dirname, '../modules/**/*.routes.ts'),
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
