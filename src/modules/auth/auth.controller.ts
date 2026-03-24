import type { Request, Response, NextFunction } from 'express';
import { RegisterSchema, LoginSchema } from './auth.schemas';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = RegisterSchema.parse(req.body);
        const user = await authService.register(data);
        res.status(201).json({ user });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = LoginSchema.parse(req.body);
        const result = await authService.login(data);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export function me(req: Request, res: Response): void {
    res.status(200).json({ user: req.user });
}
