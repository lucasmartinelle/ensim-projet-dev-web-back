import { Router } from 'express';
import * as gamesController from './games.controller';
import { scoresRouter } from '../scores/scores.routes';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { isAdmin } from '../../middlewares/role.middleware';

export const gamesRouter = Router();

/**
 * @openapi
 * /games:
 *   get:
 *     tags:
 *       - Games
 *     summary: Liste des jeux
 *     description: Retourne tous les jeux disponibles sur la plateforme.
 *     responses:
 *       200:
 *         description: Liste des jeux
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 */
gamesRouter.get('/', gamesController.listGames);

/**
 * @openapi
 * /games:
 *   post:
 *     tags:
 *       - Games
 *     summary: Créer un jeu (Admin)
 *     description: Crée un nouveau jeu. Réservé aux administrateurs.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Chess
 *               slug:
 *                 type: string
 *                 description: Identifiant unique en kebab-case
 *                 example: chess
 *               description:
 *                 type: string
 *                 example: Le jeu d'échecs classique.
 *               coverImage:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/chess.png
 *     responses:
 *       201:
 *         description: Jeu créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       400:
 *         description: Validation échouée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
gamesRouter.post('/', isAuthenticated, isAdmin, gamesController.createGame);

/**
 * @openapi
 * /games/{slug}:
 *   get:
 *     tags:
 *       - Games
 *     summary: Détails d'un jeu
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: tic-tac-toe
 *         description: Slug unique du jeu
 *     responses:
 *       200:
 *         description: Détails du jeu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       404:
 *         description: Jeu introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
gamesRouter.get('/:slug', gamesController.getGameBySlug);

/**
 * @openapi
 * /games/{slug}:
 *   patch:
 *     tags:
 *       - Games
 *     summary: Modifier un jeu (Admin)
 *     description: Met à jour les informations d'un jeu. Réservé aux administrateurs.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: tic-tac-toe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 example: Morpion
 *               description:
 *                 type: string
 *                 example: Nouvelle description.
 *               coverImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Jeu mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       400:
 *         description: Validation échouée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Jeu introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
gamesRouter.patch('/:slug', isAuthenticated, isAdmin, gamesController.updateGame);

/**
 * @openapi
 * /games/{slug}:
 *   delete:
 *     tags:
 *       - Games
 *     summary: Supprimer un jeu (Admin)
 *     description: Supprime définitivement un jeu. Réservé aux administrateurs.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: tic-tac-toe
 *     responses:
 *       204:
 *         description: Jeu supprimé (aucun corps)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Jeu introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
gamesRouter.delete('/:slug', isAuthenticated, isAdmin, gamesController.deleteGame);

/**
 * @openapi
 * /games/{slug}/leaderboard:
 *   get:
 *     tags:
 *       - Games
 *     summary: Classement d'un jeu
 *     description: Retourne les meilleurs scores pour ce jeu, triés par valeur décroissante.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: tic-tac-toe
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'entrées à retourner
 *     responses:
 *       200:
 *         description: Classement du jeu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *       404:
 *         description: Jeu introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
gamesRouter.get('/:slug/leaderboard', gamesController.getLeaderboard);

/**
 * @openapi
 * /games/{slug}/scores:
 *   post:
 *     tags:
 *       - Scores
 *     summary: Soumettre un score
 *     description: |
 *       Soumet manuellement un score pour un jeu donné.
 *
 *       > **Note :** En pratique, les scores de match sont soumis **automatiquement**
 *       > par le serveur via Socket.io à la fin de chaque partie. Cet endpoint est
 *       > disponible pour des soumissions manuelles éventuelles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: tic-tac-toe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1
 *     responses:
 *       201:
 *         description: Score enregistré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   $ref: '#/components/schemas/Score'
 *       400:
 *         description: Validation échouée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Jeu introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
gamesRouter.use('/:slug/scores', (req, res, next) => {
    req.params.gameSlug = req.params.slug;
    next();
}, scoresRouter);
