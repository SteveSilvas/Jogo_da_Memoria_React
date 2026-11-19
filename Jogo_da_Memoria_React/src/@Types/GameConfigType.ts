export type GameMode = "single-player" | "two-players";

type GameConfigType = {
    player1: string;
    player2: string;
    amountCards: number;
    mode: GameMode;
};

export default GameConfigType;
