import { prisma } from '../../db/prisma';
import type { UpdateProfileInput } from './users.schemas';

type SafeUser = {
    id: string;
    email: string;
    username: string;
    role: string;
    suspended: boolean;
    createdAt: Date;
    updatedAt: Date;
};

const safeUserSelect = {
    id: true,
    email: true,
    username: true,
    role: true,
    suspended: true,
    createdAt: true,
    updatedAt: true,
} as const;

export async function findById(id: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
    if (!user) throw new Error('Utilisateur introuvable');
    return user;
}

export async function updateProfile(id: string, data: UpdateProfileInput): Promise<SafeUser> {
    if (data.username) {
        const existing = await prisma.user.findFirst({ where: { username: data.username, NOT: { id } } });
        if (existing) throw new Error("Ce nom d'utilisateur est déjà pris");
    }
    if (data.email) {
        const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
        if (existing) throw new Error('Cette adresse email est déjà utilisée');
    }
    return prisma.user.update({ where: { id }, data, select: safeUserSelect });
}

export async function deleteAccount(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
}

export async function listAll({ page, limit }: { page: number; limit: number }): Promise<{
    data: SafeUser[];
    total: number;
    page: number;
    limit: number;
}> {
    const [data, total] = await Promise.all([
        prisma.user.findMany({
            select: safeUserSelect,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
    ]);
    return { data, total, page, limit };
}

export async function suspend(id: string, suspended: boolean): Promise<SafeUser> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Utilisateur introuvable');
    return prisma.user.update({ where: { id }, data: { suspended }, select: safeUserSelect });
}
