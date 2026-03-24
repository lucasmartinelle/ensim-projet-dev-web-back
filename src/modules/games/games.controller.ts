import type { Request, Response, NextFunction } from 'express';
import * as gamesService from './games.service';
import * as scoresService from '../scores/scores.service';
import { CreateGameSchema, UpdateGameSchema } from './games.schemas';

export async function listGames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const games = await gamesService.listGames();
        res.status(200).json({ games });
    } catch (err) {
        next(err);
    }
}

export async function getGameBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const game = await gamesService.getGameBySlug(String(req.params.slug));
        res.status(200).json({ game });
    } catch (err) {
        next(err);
    }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const game = await gamesService.getGameBySlug(String(req.params.slug));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const leaderboard = await scoresService.getLeaderboard(game.id, limit);
        res.status(200).json({ leaderboard });
    } catch (err) {
        next(err);
    }
}

export async function createGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = CreateGameSchema.parse(req.body);
        const game = await gamesService.createGame(data);
        res.status(201).json({ game });
    } catch (err) {
        next(err);
    }
}

export async function updateGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = UpdateGameSchema.parse(req.body);
        const game = await gamesService.updateGame(String(req.params.slug), data);
        res.status(200).json({ game });
    } catch (err) {
        next(err);
    }
}

export async function deleteGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await gamesService.deleteGame(String(req.params.slug));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
