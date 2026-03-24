import { Router } from 'express';
import * as authController from './auth.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Inscription
 *     description: Crée un nouveau compte utilisateur avec le rôle `PLAYER`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 description: "3–20 caractères : lettres, chiffres, underscores"
 *                 example: my_username
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: monMotDePasse123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation échouée ou email/username déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/Error'
 *             examples:
 *               emailPris:
 *                 summary: Email déjà utilisé
 *                 value:
 *                   message: "Cette adresse email est déjà utilisée"
 *               usernamePris:
 *                 summary: Username déjà pris
 *                 value:
 *                   message: "Ce nom d'utilisateur est déjà pris"
 */
authRouter.post('/register', authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Connexion
 *     description: |
 *       Authentifie un utilisateur et retourne un token JWT valable **7 jours**.
 *
 *       Utilisez ce token dans le header `Authorization: Bearer <token>` pour
 *       toutes les requêtes authentifiées.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: Admin1234!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT Bearer
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Identifiants invalides ou compte suspendu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalides:
 *                 value: { message: "Identifiants invalides" }
 *               suspendu:
 *                 value: { message: "Ce compte est suspendu" }
 */
authRouter.post('/login', authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Profil depuis le token JWT
 *     description: |
 *       Retourne les données embarquées dans le payload JWT (pas de requête BDD).
 *       Préférer `GET /users/me` pour des données fraîches depuis la base.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du payload JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [PLAYER, ADMIN]
 *       401:
 *         description: Token absent ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.get('/me', isAuthenticated, authController.me);
