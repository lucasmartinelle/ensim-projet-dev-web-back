import fs from 'fs';
import path from 'path';
import { prisma } from '../../db/prisma';
import type { Game } from '../../generated/prisma/client';

export async function listGames(): Promise<Game[]> {
    return prisma.game.findMany({ orderBy: { name: 'asc' } });
}

export async function getGameBySlug(slug: string): Promise<Game> {
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) throw new Error('Jeu introuvable');
    return game;
}

export async function createGame(data: { name: string; slug: string; description?: string; coverImage?: string }): Promise<Game> {
    return prisma.game.create({ data });
}

export async function updateGame(slug: string, data: { name?: string; slug?: string; description?: string; coverImage?: string }): Promise<Game> {
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) throw new Error('Jeu introuvable');
    return prisma.game.update({ where: { slug }, data });
}

export async function updateGameCover(slug: string, filename: string): Promise<Game> {
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) throw new Error('Jeu introuvable');

    // Supprimer l'ancienne image si elle était stockée localement
    if (game.coverImage?.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), game.coverImage);
        fs.rm(oldPath, { force: true }, () => undefined);
    }

    return prisma.game.update({
        where: { slug },
        data: { coverImage: `/uploads/games/${filename}` },
    });
}

export async function deleteGame(slug: string): Promise<void> {
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) throw new Error('Jeu introuvable');
    await prisma.game.delete({ where: { slug } });
}
