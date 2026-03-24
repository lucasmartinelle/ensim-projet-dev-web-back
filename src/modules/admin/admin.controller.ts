import type { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const search = req.query.search as string | undefined;
        const result = await adminService.getUsers({ page, limit, search });
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
        const user = await adminService.suspendUser(String(req.params.id), suspended);
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await adminService.deleteUser(String(req.params.id));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function getHomeContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const content = await adminService.getHomeContent();
        res.status(200).json({ content });
    } catch (err) {
        next(err);
    }
}

export async function upsertHomeContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { value } = req.body;
        if (typeof value !== 'string' || !value.trim()) {
            res.status(400).json({ message: 'Le champ value est requis' });
            return;
        }
        const item = await adminService.upsertHomeContent(String(req.params.key), value);
        res.status(200).json({ item });
    } catch (err) {
        next(err);
    }
}
