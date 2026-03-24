import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { gamesRouter } from '../modules/games/games.routes';
import { matchesRouter } from '../modules/matches/matches.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import * as adminService from '../modules/admin/admin.service';

export const router = Router();

/**
 * @openapi
 * components:
 *   responses:
 *     Unauthorized:
 *       description: Token absent ou invalide
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             message: "Token manquant ou invalide"
 *     Forbidden:
 *       description: Droits insuffisants (rôle ADMIN requis)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             message: "Accès refusé"
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Santé du serveur
 *     description: Vérifie que le serveur est opérationnel.
 *     responses:
 *       200:
 *         description: Serveur opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/games', gamesRouter);
router.use('/matches', matchesRouter);
router.use('/admin', adminRouter);

/**
 * @openapi
 * /home-content:
 *   get:
 *     tags:
 *       - Home
 *     summary: Contenu de la page d'accueil
 *     description: |
 *       Retourne le contenu éditorial public de la page d'accueil,
 *       trié par clé alphabétique.
 *
 *       **Clés disponibles :**
 *       - `hero_cta` — Texte du bouton d'appel à l'action
 *       - `hero_subtitle` — Sous-titre
 *       - `hero_title` — Titre principal
 *     responses:
 *       200:
 *         description: Contenu de la page d'accueil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HomeContent'
 *             example:
 *               content:
 *                 - id: "uuid"
 *                   key: "hero_cta"
 *                   value: "Commencer à jouer"
 *                   updatedAt: "2026-03-24T10:00:00.000Z"
 *                 - id: "uuid"
 *                   key: "hero_subtitle"
 *                   value: "Affrontez vos amis en ligne sur nos jeux classiques."
 *                   updatedAt: "2026-03-24T10:00:00.000Z"
 *                 - id: "uuid"
 *                   key: "hero_title"
 *                   value: "Bienvenue sur GamePlatform"
 *                   updatedAt: "2026-03-24T10:00:00.000Z"
 */
router.get('/home-content', async (req, res, next) => {
    try {
        const content = await adminService.getHomeContent();
        res.status(200).json({ content });
    } catch (err) {
        next(err);
    }
});
