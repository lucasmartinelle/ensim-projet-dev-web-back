import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import type { RegisterInput, LoginInput } from './auth.schemas';

type SafeUser = {
    id: string;
    email: string;
    username: string;
    role: string;
    createdAt: Date;
};

function toSafeUser(user: { id: string; email: string; username: string; role: string; createdAt: Date }): SafeUser {
    return { id: user.id, email: user.email, username: user.username, role: user.role, createdAt: user.createdAt };
}

export function generateToken(user: SafeUser): string {
    return jwt.sign(
        { sub: user.id, role: user.role },
        env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export async function register(data: RegisterInput): Promise<SafeUser> {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new Error('Cette adresse email est déjà utilisée');

    const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
    if (existingUsername) throw new Error("Ce nom d'utilisateur est déjà pris");

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: { email: data.email, username: data.username, passwordHash },
    });

    return toSafeUser(user);
}

export async function login(data: LoginInput): Promise<{ token: string; user: SafeUser }> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash) throw new Error('Identifiants invalides');

    if (user.suspended) throw new Error('Ce compte est suspendu');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new Error('Identifiants invalides');

    const safeUser = toSafeUser(user);
    const token = generateToken(safeUser);

    return { token, user: safeUser };
}
