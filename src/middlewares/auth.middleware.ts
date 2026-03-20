import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { env } from '../config/env';

interface JwtPayload {
    sub: string;
    role: string;
}

export async function isAuthenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Non autorisé' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, username: true, role: true, suspended: true },
        });

        if (!user || user.suspended) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }

        req.user = { id: user.id, email: user.email, username: user.username, role: user.role };
        next();
    } catch {
        res.status(401).json({ message: 'Non autorisé' });
    }
}
