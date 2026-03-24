import { Router } from 'express';
import * as adminController from './admin.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { isAdmin } from '../../middlewares/role.middleware';

export const adminRouter = Router();

adminRouter.get('/users', isAuthenticated, isAdmin, adminController.getUsers);
adminRouter.patch('/users/:id/suspend', isAuthenticated, isAdmin, adminController.suspendUser);
adminRouter.delete('/users/:id', isAuthenticated, isAdmin, adminController.deleteUser);

adminRouter.get('/home-content', isAuthenticated, isAdmin, adminController.getHomeContent);
adminRouter.patch('/home-content/:key', isAuthenticated, isAdmin, adminController.upsertHomeContent);
