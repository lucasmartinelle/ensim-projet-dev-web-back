import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface JwtPayload {
    sub: string;
    role: string;
}

export function initSockets(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token as string | undefined;
        if (!token) return next(new Error('Unauthorized'));

        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
            socket.data.userId = payload.sub;
            socket.data.role = 'player';
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    return io;
}
