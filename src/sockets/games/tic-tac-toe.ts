export type TicTacToeBoard = (string | null)[];

export interface TicTacToeAction {
    index: number; // 0-8
}

export interface TicTacToeResult {
    board: TicTacToeBoard;
    winner: string | null; // userId ou null
    isDraw: boolean;
    isTerminal: boolean;
}

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
    [0, 4, 8], [2, 4, 6],             // diagonales
];

export function createBoard(): TicTacToeBoard {
    return Array(9).fill(null);
}

export function applyAction(
    board: TicTacToeBoard,
    action: TicTacToeAction,
    userId: string,
): TicTacToeResult {
    if (action.index < 0 || action.index > 8 || board[action.index] !== null) {
        throw new Error('Action invalide');
    }

    const newBoard = [...board];
    newBoard[action.index] = userId;

    const winner = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every((cell) => cell !== null);

    return {
        board: newBoard,
        winner,
        isDraw,
        isTerminal: winner !== null || isDraw,
    };
}

function checkWinner(board: TicTacToeBoard): string | null {
    for (const [a, b, c] of WINNING_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] as string;
        }
    }
    return null;
}
