import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { gamesRouter } from '../modules/games/games.routes';
import { matchesRouter } from '../modules/matches/matches.routes';
import { adminRouter } from '../modules/admin/admin.routes';

export const router = Router();

router.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/games', gamesRouter);
router.use('/matches', matchesRouter);
router.use('/admin', adminRouter);