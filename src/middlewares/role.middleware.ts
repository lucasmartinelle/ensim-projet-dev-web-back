import type { Request, Response, NextFunction } from 'express';

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    next();
}
