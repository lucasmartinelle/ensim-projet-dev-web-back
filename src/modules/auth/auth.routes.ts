import { Router } from 'express';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

// Route protégée — isAuthenticated sera branché en étape 9
authRouter.get('/me', authController.me);
