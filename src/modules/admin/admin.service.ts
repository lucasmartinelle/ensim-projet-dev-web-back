import { prisma } from '../../db/prisma';
import type { HomeContent } from '../../generated/prisma/client';

const safeUserSelect = {
    id: true,
    email: true,
    username: true,
    role: true,
    suspended: true,
    createdAt: true,
    updatedAt: true,
} as const;

export async function getUsers({
    page,
    limit,
    search,
}: {
    page: number;
    limit: number;
    search?: string;
}): Promise<{ data: object[]; total: number; page: number; limit: number }> {
    const where = search
        ? {
              OR: [
                  { username: { contains: search, mode: 'insensitive' as const } },
                  { email: { contains: search, mode: 'insensitive' as const } },
              ],
          }
        : {};

    const [data, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: safeUserSelect,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
}

export async function suspendUser(id: string, suspended: boolean): Promise<object> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Utilisateur introuvable');
    return prisma.user.update({ where: { id }, data: { suspended }, select: safeUserSelect });
}

export async function deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Utilisateur introuvable');
    await prisma.user.delete({ where: { id } });
}

export async function getHomeContent(): Promise<HomeContent[]> {
    return prisma.homeContent.findMany({ orderBy: { key: 'asc' } });
}

export async function upsertHomeContent(key: string, value: string): Promise<HomeContent> {
    return prisma.homeContent.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}
