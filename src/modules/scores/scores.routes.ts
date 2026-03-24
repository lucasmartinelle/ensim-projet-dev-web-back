import { Router } from 'express';
import * as scoresController from './scores.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

export const scoresRouter = Router({ mergeParams: true });

scoresRouter.post('/', isAuthenticated, scoresController.submitScore);
