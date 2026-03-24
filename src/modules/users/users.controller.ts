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

