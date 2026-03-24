import { Router } from 'express';
import * as usersController from './users.controller';
import * as scoresController from '../scores/scores.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

export const usersRouter = Router();

usersRouter.get('/me', isAuthenticated, usersController.getMe);
usersRouter.patch('/me', isAuthenticated, usersController.updateMe);
usersRouter.delete('/me', isAuthenticated, usersController.deleteMe);
usersRouter.get('/me/scores', isAuthenticated, scoresController.getUserScores);
