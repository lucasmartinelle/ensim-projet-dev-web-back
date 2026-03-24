import { Router } from 'express';
import * as usersController from './users.controller';
import * as scoresController from '../scores/scores.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

export const usersRouter = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Profil de l'utilisateur connecté
 *     description: Retourne le profil complet depuis la base de données.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Token absent ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
usersRouter.get('/me', isAuthenticated, usersController.getMe);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Mettre à jour son profil
 *     description: |
 *       Modifie le profil de l'utilisateur connecté.
 *       Au moins un des champs (`username` ou `email`) doit être renseigné.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 example: new_username
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Profil mis à jour
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
 *       401:
 *         description: Token absent ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
usersRouter.patch('/me', isAuthenticated, usersController.updateMe);

/**
 * @openapi
 * /users/me:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Supprimer son compte
 *     description: Supprime définitivement le compte de l'utilisateur connecté.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Compte supprimé avec succès (aucun corps)
 *       401:
 *         description: Token absent ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
usersRouter.delete('/me', isAuthenticated, usersController.deleteMe);

/**
 * @openapi
 * /users/me/scores:
 *   get:
 *     tags:
 *       - Users
 *     summary: Scores de l'utilisateur connecté
 *     description: |
 *       Retourne tous les scores de l'utilisateur connecté, triés par date décroissante.
 *       Peut être filtré par jeu via le paramètre `gameSlug`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gameSlug
 *         schema:
 *           type: string
 *           example: tic-tac-toe
 *         description: Filtre les scores par jeu (slug)
 *     responses:
 *       200:
 *         description: Liste des scores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scores:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserScore'
 *       401:
 *         description: Token absent ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Jeu introuvable (si gameSlug fourni et inconnu)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
usersRouter.get('/me/scores', isAuthenticated, scoresController.getUserScores);
