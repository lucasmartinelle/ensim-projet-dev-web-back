import { Router } from 'express';
import * as gamesController from './games.controller';
import { scoresRouter } from '../scores/scores.routes';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { isAdmin } from '../../middlewares/role.middleware';

export const gamesRouter = Router();

gamesRouter.get('/', gamesController.listGames);
gamesRouter.post('/', isAuthenticated, isAdmin, gamesController.createGame);
gamesRouter.get('/:slug', gamesController.getGameBySlug);
gamesRouter.patch('/:slug', isAuthenticated, isAdmin, gamesController.updateGame);
gamesRouter.delete('/:slug', isAuthenticated, isAdmin, gamesController.deleteGame);
gamesRouter.get('/:slug/leaderboard', gamesController.getLeaderboard);

gamesRouter.use('/:slug/scores', (req, res, next) => {
    req.params.gameSlug = req.params.slug;
    next();
}, scoresRouter);
