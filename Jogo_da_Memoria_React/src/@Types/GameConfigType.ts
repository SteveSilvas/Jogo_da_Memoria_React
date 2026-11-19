type GameMode = "two-players" | "single-player";

type GameConfigType = {
    player1: string;
    player2: string;
    amountCards: number;
    /** Ausente equivale a "two-players", mantendo compatibilidade. */
    mode?: GameMode;
};

export type { GameMode };
export default GameConfigType;
