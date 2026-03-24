import { Router } from 'express';
import * as adminController from './admin.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { isAdmin } from '../../middlewares/role.middleware';

export const adminRouter = Router();

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin — Users
 *     summary: Liste paginée des utilisateurs
 *     description: |
 *       Retourne la liste paginée de tous les utilisateurs.
 *       La recherche est insensible à la casse et porte sur `username` et `email`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre d'utilisateurs par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: alice
 *         description: Filtre par username ou email (insensible à la casse)
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   description: Nombre total d'utilisateurs (avant pagination)
 *                   example: 42
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/users', isAuthenticated, isAdmin, adminController.getUsers);

/**
 * @openapi
 * /admin/users/{id}/suspend:
 *   patch:
 *     tags:
 *       - Admin — Users
 *     summary: Suspendre ou réactiver un utilisateur
 *     description: |
 *       Un utilisateur suspendu ne peut plus se connecter (`POST /auth/login` retourne 400).
 *       Passez `suspended: false` pour lever la suspension.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [suspended]
 *             properties:
 *               suspended:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Le champ suspended est invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
adminRouter.patch('/users/:id/suspend', isAuthenticated, isAdmin, adminController.suspendUser);

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags:
 *       - Admin — Users
 *     summary: Supprimer un utilisateur
 *     description: Supprime définitivement le compte d'un utilisateur et toutes ses données associées.
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
 *       204:
 *         description: Utilisateur supprimé (aucun corps)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
adminRouter.delete('/users/:id', isAuthenticated, isAdmin, adminController.deleteUser);

/**
 * @openapi
 * /admin/home-content:
 *   get:
 *     tags:
 *       - Admin — Content
 *     summary: Contenu éditorial (admin)
 *     description: Retourne toutes les entrées de contenu, triées par clé alphabétique.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des entrées de contenu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HomeContent'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/home-content', isAuthenticated, isAdmin, adminController.getHomeContent);

/**
 * @openapi
 * /admin/home-content/{key}:
 *   patch:
 *     tags:
 *       - Admin — Content
 *     summary: Créer ou mettre à jour une entrée de contenu
 *     description: |
 *       Crée l'entrée si elle n'existe pas, la met à jour sinon (upsert).
 *
 *       **Clés disponibles après le seed :**
 *       - `hero_title` — Titre principal de la page d'accueil
 *       - `hero_subtitle` — Sous-titre
 *       - `hero_cta` — Texte du bouton d'appel à l'action
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: hero_title
 *         description: Clé de l'entrée de contenu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: string
 *                 example: "Bienvenue sur la plateforme de jeux !"
 *     responses:
 *       200:
 *         description: Entrée créée ou mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/HomeContent'
 *       400:
 *         description: Le champ value est manquant ou vide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.patch('/home-content/:key', isAuthenticated, isAdmin, adminController.upsertHomeContent);
