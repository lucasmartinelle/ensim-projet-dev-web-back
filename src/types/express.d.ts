import type { Role } from '../generated/prisma/client';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            username: string;
            role: Role;
        }
    }
}

export {};
