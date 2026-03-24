/**
 * Script de test manuel pour les WebSockets.
 *
 * Prérequis :
 *   1. Serveur démarré : npm run dev
 *   2. Deux joueurs inscrits et un match créé via Bruno
 *
 * Usage :
 *   TOKEN_A=<jwt_joueur_a> TOKEN_B=<jwt_joueur_b> MATCH_ID=<uuid> npx ts-node scripts/test-socket.ts
 */

import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';
const TOKEN_A = process.env.TOKEN_A ?? '';
const TOKEN_B = process.env.TOKEN_B ?? '';
const MATCH_ID = process.env.MATCH_ID ?? '';

if (!TOKEN_A || !TOKEN_B || !MATCH_ID) {
    console.error('Usage: TOKEN_A=<jwt> TOKEN_B=<jwt> MATCH_ID=<uuid> npx ts-node scripts/test-socket.ts');
    process.exit(1);
}

function createClient(name: string, token: string) {
    const socket = io(BASE_URL, { auth: { token } });

    socket.on('connect', () => console.log(`[${name}] connecté (${socket.id})`));
    socket.on('connect_error', (err) => console.error(`[${name}] connect_error:`, err.message));
    socket.on('state-update', (state) => console.log(`[${name}] state-update:`, JSON.stringify(state.board)));
    socket.on('match-end', (data) => {
        console.log(`[${name}] match-end:`, data);
        process.exit(0);
    });
    socket.on('error', (err) => console.error(`[${name}] error:`, err));

    return socket;
}

const playerA = createClient('Joueur A', TOKEN_A);
const playerB = createClient('Joueur B', TOKEN_B);

// Séquence de jeu : A et B rejoignent la partie, puis jouent en alternance
setTimeout(() => {
    console.log('\n--- Les deux joueurs rejoignent la partie ---');
    playerA.emit('join-match', { matchId: MATCH_ID });
    playerB.emit('join-match', { matchId: MATCH_ID });
}, 500);

// Séquence gagnante pour A : cases 0, 3, 6 (colonne gauche)
// B joue cases 1, 4
const moves = [
    { delay: 1000, player: playerA, name: 'A', action: { index: 0 } },
    { delay: 1500, player: playerB, name: 'B', action: { index: 1 } },
    { delay: 2000, player: playerA, name: 'A', action: { index: 3 } },
    { delay: 2500, player: playerB, name: 'B', action: { index: 4 } },
    { delay: 3000, player: playerA, name: 'A', action: { index: 6 } }, // A gagne
];

moves.forEach(({ delay, player, name, action }) => {
    setTimeout(() => {
        console.log(`\n--- ${name} joue case ${action.index} ---`);
        player.emit('game-action', { matchId: MATCH_ID, action });
    }, delay);
});

// Timeout de sécurité
setTimeout(() => {
    console.error('Timeout — aucune fin de partie détectée');
    process.exit(1);
}, 5000);
