import type { Request, Response, NextFunction } from 'express';
import { SubmitScoreSchema } from './scores.schemas';
import * as scoresService from './scores.service';
import * as gamesService from '../games/games.service';

export async function submitScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = SubmitScoreSchema.parse(req.body);
        const game = await gamesService.getGameBySlug(String(req.params.gameSlug));
        const score = await scoresService.submitScore(req.user!.id, game.id, data.value);
        res.status(201).json({ score });
    } catch (err) {
        next(err);
    }
}

export async function getUserScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const gameSlug = req.query.gameSlug as string | undefined;
        let gameId: string | undefined;
        if (gameSlug) {
            const game = await gamesService.getGameBySlug(gameSlug);
            gameId = game.id;
        }
        const scores = await scoresService.getUserScores(req.user!.id, gameId);
        res.status(200).json({ scores });
    } catch (err) {
        next(err);
    }
}
