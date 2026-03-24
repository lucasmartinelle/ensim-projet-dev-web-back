import { Router } from 'express';
import * as matchesController from './matches.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';

export const matchesRouter = Router();

matchesRouter.post('/', isAuthenticated, matchesController.createMatch);
matchesRouter.get('/', matchesController.getActiveMatches);
matchesRouter.get('/:id', matchesController.getMatchById);
matchesRouter.post('/:id/join', isAuthenticated, matchesController.joinMatch);
