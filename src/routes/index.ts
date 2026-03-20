import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';

export const router = Router();

router.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
router.use('/auth', authRouter);