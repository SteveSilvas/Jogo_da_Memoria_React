type ScoredPlayer = { name: string; score: number };

export const winnersOf = (players: ScoredPlayer[]): ScoredPlayer[] => {
    const best = Math.max(...players.map((p) => p.score));
    return players.filter((p) => p.score === best);
};

export const isDraw = (players: ScoredPlayer[]): boolean =>
    winnersOf(players).length !== 1;

export const winnerHeadline = (players: ScoredPlayer[]): string =>
    isDraw(players) ? "Empate!" : `Parabéns, ${winnersOf(players)[0].name}!`;
