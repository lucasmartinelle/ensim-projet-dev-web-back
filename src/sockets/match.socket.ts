import type { Server, Socket } from 'socket.io';
import { prisma } from '../db/prisma';
import { getState, setState } from '../modules/matches/match.state';
import { applyAction, createBoard } from './games/tic-tac-toe';
import { endMatch } from '../modules/matches/matches.service';

export function registerMatchHandlers(io: Server, socket: Socket): void {
    socket.on('join-match', async ({ matchId }: { matchId: string }) => {
        try {
            const match = await prisma.match.findUnique({
                where: { id: matchId },
                include: { players: true },
            });

            if (!match) {
                socket.emit('error', { message: 'Match introuvable' });
                return;
            }

            const isPlayer = match.players.some((p) => p.userId === socket.data.userId);
            if (!isPlayer) {
                socket.emit('error', { message: 'Vous ne faites pas partie de cette partie' });
                return;
            }

            await socket.join(`match:${matchId}`);

            let state = getState(matchId);

            // Réinitialiser le GameState si le serveur a redémarré (match ONGOING mais état perdu)
            if (!state && match.status === 'ONGOING') {
                const game = await prisma.game.findUnique({ where: { id: match.gameId } });
                state = {
                    matchId,
                    gameSlug: game?.slug ?? '',
                    board: Array(9).fill(null),
                    currentTurn: match.players[0].userId,
                    players: match.players.map((p) => p.userId),
                    spectators: [],
                    socketIds: new Map(),
                    startedAt: match.createdAt,
                };
                setState(matchId, state);
            }

            if (state) {
                state.socketIds.set(socket.data.userId, socket.id);
                setState(matchId, state);
                socket.emit('state-update', state);
            }
        } catch {
            socket.emit('error', { message: 'Erreur lors de la connexion à la partie' });
        }
    });

    socket.on('join-as-spectator', async ({ matchId }: { matchId: string }) => {
        try {
            const match = await prisma.match.findUnique({ where: { id: matchId } });

            if (!match || match.status !== 'ONGOING') {
                socket.emit('error', { message: 'Cette partie ne peut pas être observée' });
                return;
            }

            await socket.join(`match:${matchId}`);
            socket.data.role = 'spectator';

            const state = getState(matchId);
            if (state) {
                if (!state.spectators.includes(socket.data.userId)) {
                    state.spectators.push(socket.data.userId);
                    setState(matchId, state);
                }
                socket.emit('state-update', state);
            }
        } catch {
            socket.emit('error', { message: 'Erreur lors de la connexion en spectateur' });
        }
    });

    socket.on('game-action', async ({ matchId, action }: { matchId: string; action: { index: number } }) => {
        if (socket.data.role === 'spectator') return;

        try {
            const state = getState(matchId);
            if (!state) {
                socket.emit('error', { message: 'Partie introuvable en mémoire' });
                return;
            }

            if (state.currentTurn !== socket.data.userId) {
                socket.emit('error', { message: "Ce n'est pas votre tour" });
                return;
            }

            const board = Array.isArray(state.board) ? state.board : createBoard();
            const result = applyAction(board as (string | null)[], action, socket.data.userId);

            const nextTurn = state.players.find((id) => id !== socket.data.userId) ?? socket.data.userId;
            const updatedState = { ...state, board: result.board, currentTurn: nextTurn };
            setState(matchId, updatedState);

            io.to(`match:${matchId}`).emit('state-update', updatedState);

            if (result.isTerminal) {
                const scores = state.players.map((userId) => ({
                    userId,
                    score: userId === result.winner ? 1 : 0,
                }));

                await endMatch(matchId, scores);

                io.to(`match:${matchId}`).emit('match-end', {
                    scores,
                    winnerId: result.winner,
                    isDraw: result.isDraw,
                });
            }
        } catch (err) {
            socket.emit('error', { message: err instanceof Error ? err.message : 'Action invalide' });
        }
    });

    socket.on('leave-match', async ({ matchId }: { matchId: string }) => {
        await socket.leave(`match:${matchId}`);

        const state = getState(matchId);
        if (state) {
            state.socketIds.delete(socket.data.userId);
            state.spectators = state.spectators.filter((id) => id !== socket.data.userId);
            setState(matchId, state);
        }
    });

    socket.on('disconnect', async () => {
        if (socket.data.role === 'spectator') return;

        // Chercher les parties ONGOING où ce joueur est connecté
        for (const [matchId, state] of (await import('../modules/matches/match.state')).matchStates) {
            if (!state.players.includes(socket.data.userId)) continue;

            const match = await prisma.match.findUnique({ where: { id: matchId } });
            if (!match || match.status !== 'ONGOING') continue;

            // Forfait : l'adversaire gagne
            const winnerId = state.players.find((id) => id !== socket.data.userId) ?? null;
            const scores = state.players.map((userId) => ({
                userId,
                score: userId === winnerId ? 1 : 0,
            }));

            try {
                await endMatch(matchId, scores);
            } catch {
                // La partie a peut-être déjà été terminée
            }

            io.to(`match:${matchId}`).emit('match-end', {
                scores,
                winnerId,
                isDraw: false,
                reason: 'forfeit',
            });
        }
    });
}
