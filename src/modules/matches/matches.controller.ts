import type { Request, Response, NextFunction } from 'express';
import { CreateMatchSchema } from './matches.schemas';
import * as matchesService from './matches.service';

export async function createMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { gameId } = CreateMatchSchema.parse(req.body);
        const match = await matchesService.createMatch(gameId, req.user!.id);
        res.status(201).json({ match });
    } catch (err) {
        next(err);
    }
}

export async function getActiveMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const matches = await matchesService.getActiveMatches();
        res.status(200).json({ matches });
    } catch (err) {
        next(err);
    }
}

export async function getMatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const match = await matchesService.getMatchById(String(req.params.id));
        res.status(200).json({ match });
    } catch (err) {
        next(err);
    }
}

export async function joinMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const match = await matchesService.joinMatch(String(req.params.id), req.user!.id);
        res.status(200).json({ match });
    } catch (err) {
        next(err);
    }
}
