import {Router} from 'express';
//import userRoutes from './user.routes';

export const router = Router();

router.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
//router.use('/users', userRoutes);