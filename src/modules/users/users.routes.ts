import { Router } from 'express';
import * as usersController from './users.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { isAdmin } from '../../middlewares/role.middleware';

export const usersRouter = Router();

usersRouter.get('/me', isAuthenticated, usersController.getMe);
usersRouter.patch('/me', isAuthenticated, usersController.updateMe);
usersRouter.delete('/me', isAuthenticated, usersController.deleteMe);

usersRouter.get('/', isAuthenticated, isAdmin, usersController.listAll);
usersRouter.patch('/:id/suspend', isAuthenticated, isAdmin, usersController.suspendUser);
usersRouter.delete('/:id', isAuthenticated, isAdmin, usersController.deleteUser);
