import type { Request, Response, NextFunction } from 'express';
import { UpdateProfileSchema } from './users.schemas';
import * as usersService from './users.service';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await usersService.findById(req.user!.id);
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = UpdateProfileSchema.parse(req.body);
        const user = await usersService.updateProfile(req.user!.id, data);
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await usersService.deleteAccount(req.user!.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const result = await usersService.listAll({ page, limit });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { suspended } = req.body;
        if (typeof suspended !== 'boolean') {
            res.status(400).json({ message: 'Le champ suspended doit être un booléen' });
            return;
        }
        const user = await usersService.suspend(String(req.params.id), suspended);
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await usersService.deleteAccount(String(req.params.id));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
