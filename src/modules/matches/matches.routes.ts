import { Router } from 'express';
import * as matchesController from './matches.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

export const matchesRouter = Router();

/**
 * @openapi
 * /matches:
 *   post:
 *     tags:
 *       - Matches
 *     summary: Créer un match
 *     description: |
 *       Crée un nouveau match en attente d'un second joueur.
 *       Le créateur est automatiquement inscrit comme premier joueur.
 *       Le match passe en statut `WAITING` jusqu'à ce qu'un second joueur le rejoigne.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [gameId]
 *             properties:
 *               gameId:
 *                 type: string
 *                 format: uuid
 *                 description: Identifiant du jeu
 *                 example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *     responses:
 *       201:
 *         description: Match créé (statut WAITING)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 match:
 *                   $ref: '#/components/schemas/Match'
 *       400:
 *         description: Validation échouée ou jeu introuvable
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
matchesRouter.post('/', isAuthenticated, matchesController.createMatch);

/**
 * @openapi
 * /matches:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Matches actifs
 *     description: |
 *       Liste tous les matches en cours (statut `WAITING` ou `ONGOING`),
 *       triés par date de création décroissante.
 *     responses:
 *       200:
 *         description: Liste des matches actifs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Match'
 */
matchesRouter.get('/', matchesController.getActiveMatches);

/**
 * @openapi
 * /matches/{id}:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Détails d'un match
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant du match
 *     responses:
 *       200:
 *         description: Détails du match
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 match:
 *                   $ref: '#/components/schemas/Match'
 *       404:
 *         description: Match introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
matchesRouter.get('/:id', matchesController.getMatchById);

/**
 * @openapi
 * /matches/{id}/join:
 *   post:
 *     tags:
 *       - Matches
 *     summary: Rejoindre un match
 *     description: |
 *       Inscrit l'utilisateur connecté à un match en attente (`WAITING`).
 *
 *       Dès que **2 joueurs** sont inscrits, le match passe automatiquement
 *       en statut `ONGOING` et le GameState est initialisé en mémoire.
 *       Les deux joueurs doivent ensuite se connecter via **Socket.io** pour jouer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Match rejoint (peut être WAITING ou ONGOING)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 match:
 *                   $ref: '#/components/schemas/Match'
 *       400:
 *         description: Impossible de rejoindre le match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               nonRejoignable:
 *                 value: { message: "Cette partie ne peut plus être rejointe" }
 *               dejaInscrit:
 *                 value: { message: "Vous êtes déjà inscrit à cette partie" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Match introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
matchesRouter.post('/:id/join', isAuthenticated, matchesController.joinMatch);
