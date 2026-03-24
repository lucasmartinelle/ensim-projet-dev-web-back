import { prisma } from '../../db/prisma';
import type { Score } from '../../generated/prisma/client';

export async function submitScore(userId: string, gameId: string, value: number): Promise<Score> {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new Error('Jeu introuvable');

    return prisma.score.create({ data: { userId, gameId, value } });
}

export async function getLeaderboard(
    gameId: string,
    limit = 10,
): Promise<{ id: string; value: number; createdAt: Date; user: { id: string; username: string } }[]> {
    return prisma.score.findMany({
        where: { gameId },
        orderBy: { value: 'desc' },
        take: limit,
        select: {
            id: true,
            value: true,
            createdAt: true,
            user: { select: { id: true, username: true } },
        },
    });
}

export async function getUserScores(
    userId: string,
    gameId?: string,
): Promise<{ id: string; value: number; createdAt: Date; game: { id: string; name: string; slug: string } }[]> {
    return prisma.score.findMany({
        where: { userId, ...(gameId ? { gameId } : {}) },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            value: true,
            createdAt: true,
            game: { select: { id: true, name: true, slug: true } },
        },
    });
}
