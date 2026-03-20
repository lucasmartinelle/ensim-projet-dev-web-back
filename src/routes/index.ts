import {Router} from 'express';
//import userRoutes from './user.routes';

export const router = Router();

router.get('/health', (req, res) => res.json({status: 'OK'}));
//router.use('/users', userRoutes);