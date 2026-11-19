import CardType from "../@Types/CardType";

export type Turn = 0 | 1;

export type Player = { name: string; score: number; pairs: string[] };

export const initialPlayers = (
    player1: string,
    player2: string,
): [Player, Player] => [
    { name: player1, score: 0, pairs: [] },
    { name: player2, score: 0, pairs: [] },
];

export const nextTurn = (turn: Turn): Turn => (turn === 0 ? 1 : 0);

export const isMatch = (first: CardType, second: CardType): boolean =>
    first.face === second.face;

export const revealCards = (cards: CardType[], ids: number[]): CardType[] =>
    cards.map((card) => (ids.includes(card.id) ? { ...card, flipped: true } : card));

export const hideCards = (cards: CardType[], ids: number[]): CardType[] =>
    cards.map((card) => (ids.includes(card.id) ? { ...card, flipped: false } : card));

export const markMatched = (cards: CardType[], ids: number[]): CardType[] =>
    cards.map((card) =>
        ids.includes(card.id) ? { ...card, matched: true, flipped: true } : card,
    );

export const scorePair = (
    players: [Player, Player],
    turn: Turn,
    face: string,
): [Player, Player] => {
    const updated: [Player, Player] = [
        { ...players[0], pairs: [...players[0].pairs] },
        { ...players[1], pairs: [...players[1].pairs] },
    ];
    updated[turn].score += 1;
    updated[turn].pairs.push(face);
    return updated;
};

export type SelectionOutcome =
    | { kind: "match"; cards: CardType[]; players: [Player, Player] }
    | { kind: "miss" };

export const resolveSelection = (
    cards: CardType[],
    ids: [number, number],
    players: [Player, Player],
    turn: Turn,
): SelectionOutcome => {
    const [firstId, secondId] = ids;
    const first = cards.find((card) => card.id === firstId);
    const second = cards.find((card) => card.id === secondId);
    if (!first || !second || !isMatch(first, second)) return { kind: "miss" };

    return {
        kind: "match",
        cards: markMatched(cards, [firstId, secondId]),
        players: scorePair(players, turn, first.face),
    };
};

export const isBoardComplete = (cards: CardType[]): boolean =>
    cards.length > 0 && cards.every((card) => card.matched);

export const isDraw = (players: { score: number }[]): boolean =>
    players.length > 1 &&
    players.every((player) => player.score === players[0].score);
