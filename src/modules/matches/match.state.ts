export interface GameState {
    matchId: string;
    gameSlug: string;
    board: unknown;
    currentTurn: string;
    players: string[];
    spectators: string[];
    socketIds: Map<string, string>;
    startedAt: Date;
}

export const matchStates = new Map<string, GameState>();

export function getState(matchId: string): GameState | undefined {
    return matchStates.get(matchId);
}

export function setState(matchId: string, state: GameState): void {
    matchStates.set(matchId, state);
}

export function deleteState(matchId: string): void {
    matchStates.delete(matchId);
}
