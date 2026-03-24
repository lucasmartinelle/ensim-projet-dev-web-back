import type { Server, Socket } from 'socket.io';
import { prisma } from '../db/prisma';
import { getState, setState } from '../modules/matches/match.state';

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

            const state = getState(matchId);
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

    socket.on('leave-match', async ({ matchId }: { matchId: string }) => {
        await socket.leave(`match:${matchId}`);

        const state = getState(matchId);
        if (state) {
            state.socketIds.delete(socket.data.userId);
            state.spectators = state.spectators.filter((id) => id !== socket.data.userId);
            setState(matchId, state);
        }
    });
}
