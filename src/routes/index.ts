import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { gamesRouter } from '../modules/games/games.routes';
import { matchesRouter } from '../modules/matches/matches.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import * as adminService from '../modules/admin/admin.service';

export const router = Router();

router.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/games', gamesRouter);
router.use('/matches', matchesRouter);
router.use('/admin', adminRouter);
router.get('/home-content', async (req, res, next) => {
    try {
        const content = await adminService.getHomeContent();
        res.status(200).json({ content });
    } catch (err) {
        next(err);
    }
});