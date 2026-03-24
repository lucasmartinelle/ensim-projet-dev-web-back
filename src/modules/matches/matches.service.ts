import { prisma } from '../../db/prisma';
import { setState, deleteState } from './match.state';
import type { Match, MatchPlayer } from '../../generated/prisma/client';

type MatchWithRelations = Match & {
    game: { id: string; name: string; slug: string };
    players: (MatchPlayer & { user: { id: string; username: string } })[];
};

export async function createMatch(gameId: string, creatorId: string): Promise<MatchWithRelations> {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new Error('Jeu introuvable');

    const match = await prisma.match.create({
        data: {
            gameId,
            players: { create: { userId: creatorId } },
        },
        include: {
            game: { select: { id: true, name: true, slug: true } },
            players: { include: { user: { select: { id: true, username: true } } } },
        },
    });

    return match;
}

export async function joinMatch(matchId: string, userId: string): Promise<MatchWithRelations> {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            game: { select: { id: true, name: true, slug: true } },
            players: { include: { user: { select: { id: true, username: true } } } },
        },
    });

    if (!match) throw new Error('Match introuvable');
    if (match.status !== 'WAITING') throw new Error('Cette partie ne peut plus être rejointe');

    const alreadyIn = match.players.some((p) => p.userId === userId);
    if (alreadyIn) throw new Error('Vous êtes déjà inscrit à cette partie');

    await prisma.matchPlayer.create({ data: { matchId, userId } });

    const updatedMatch = await prisma.match.findUniqueOrThrow({
        where: { id: matchId },
        include: {
            game: { select: { id: true, name: true, slug: true } },
            players: { include: { user: { select: { id: true, username: true } } } },
        },
    });

    const playerCount = updatedMatch.players.filter((p) => p.role === 'PLAYER').length;
    if (playerCount >= 2) {
        await prisma.match.update({ where: { id: matchId }, data: { status: 'ONGOING' } });

        setState(matchId, {
            matchId,
            gameSlug: updatedMatch.game.slug,
            board: null,
            currentTurn: updatedMatch.players[0].userId,
            players: updatedMatch.players.map((p) => p.userId),
            spectators: [],
            socketIds: new Map(),
            startedAt: new Date(),
        });

        return prisma.match.findUniqueOrThrow({
            where: { id: matchId },
            include: {
                game: { select: { id: true, name: true, slug: true } },
                players: { include: { user: { select: { id: true, username: true } } } },
            },
        });
    }

    return updatedMatch;
}

export async function getActiveMatches(): Promise<MatchWithRelations[]> {
    return prisma.match.findMany({
        where: { status: 'ONGOING' },
        include: {
            game: { select: { id: true, name: true, slug: true } },
            players: { include: { user: { select: { id: true, username: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getMatchById(matchId: string): Promise<MatchWithRelations> {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            game: { select: { id: true, name: true, slug: true } },
            players: { include: { user: { select: { id: true, username: true } } } },
        },
    });
    if (!match) throw new Error('Match introuvable');
    return match;
}

export async function endMatch(
    matchId: string,
    scores: { userId: string; score: number }[],
): Promise<void> {
    const match = await prisma.match.findUnique({ where: { id: matchId }, include: { game: true } });
    if (!match) throw new Error('Match introuvable');

    await Promise.all(
        scores.map(({ userId, score }) =>
            Promise.all([
                prisma.matchPlayer.update({
                    where: { matchId_userId: { matchId, userId } },
                    data: { score },
                }),
                prisma.score.create({ data: { userId, gameId: match.gameId, value: score } }),
            ]),
        ),
    );

    await prisma.match.update({
        where: { id: matchId },
        data: { status: 'FINISHED', endedAt: new Date() },
    });

    deleteState(matchId);
}
