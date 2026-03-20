import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            message: 'Erreur de validation',
            errors: err.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
        return;
    }

    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Erreur interne du serveur' });
};