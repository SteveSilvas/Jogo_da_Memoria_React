export const STORAGE_KEY = "jogo-da-memoria:partida";
export const STORAGE_VERSION = 1;

export type SavedCard = {
    id: number;
    face: string;
    matched: boolean;
};

export type SavedPlayer = {
    name: string;
    score: number;
    pairs: string[];
};

export type SavedGame = {
    version: typeof STORAGE_VERSION;
    amountCards: number;
    cards: SavedCard[];
    turn: 0 | 1;
    players: [SavedPlayer, SavedPlayer];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const getStorage = (): Storage | null => {
    try {
        if (typeof window === "undefined") return null;
        return window.localStorage;
    } catch {
        return null;
    }
};

const parseCard = (value: unknown): SavedCard | null => {
    if (!isRecord(value)) return null;
    const { id, face, matched } = value;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 0) return null;
    if (typeof face !== "string" || face.length === 0) return null;
    if (typeof matched !== "boolean") return null;
    return { id, face, matched };
};

const parsePlayer = (value: unknown): SavedPlayer | null => {
    if (!isRecord(value)) return null;
    const { name, score, pairs } = value;
    if (typeof name !== "string" || name.trim().length === 0) return null;
    if (typeof score !== "number" || !Number.isInteger(score) || score < 0) return null;
    if (!Array.isArray(pairs)) return null;
    if (!pairs.every((pair) => typeof pair === "string")) return null;
    if (pairs.length !== score) return null;
    return { name, score, pairs: [...pairs] };
};

const countFaces = (cards: SavedCard[]): Map<string, number> => {
    const counts = new Map<string, number>();
    cards.forEach((card) => counts.set(card.face, (counts.get(card.face) ?? 0) + 1));
    return counts;
};

export const parseSavedGame = (value: unknown): SavedGame | null => {
    if (!isRecord(value)) return null;
    if (value.version !== STORAGE_VERSION) return null;

    const { amountCards, cards, turn, players } = value;

    if (
        typeof amountCards !== "number" ||
        !Number.isInteger(amountCards) ||
        amountCards <= 0 ||
        amountCards % 2 !== 0
    ) {
        return null;
    }
    if (!Array.isArray(cards) || cards.length !== amountCards) return null;

    const parsedCards: SavedCard[] = [];
    for (const card of cards) {
        const parsed = parseCard(card);
        if (!parsed) return null;
        parsedCards.push(parsed);
    }

    if (new Set(parsedCards.map((card) => card.id)).size !== parsedCards.length) return null;
    for (const count of countFaces(parsedCards).values()) {
        if (count !== 2) return null;
    }

    if (turn !== 0 && turn !== 1) return null;

    if (!Array.isArray(players) || players.length !== 2) return null;
    const player1 = parsePlayer(players[0]);
    const player2 = parsePlayer(players[1]);
    if (!player1 || !player2) return null;

    const matchedCards = parsedCards.filter((card) => card.matched).length;
    if (matchedCards !== (player1.score + player2.score) * 2) return null;

    // Partida já vencida não deve ser retomada.
    if (matchedCards === parsedCards.length) return null;

    return {
        version: STORAGE_VERSION,
        amountCards,
        cards: parsedCards,
        turn,
        players: [player1, player2],
    };
};

export const clearSavedGame = (): void => {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.removeItem(STORAGE_KEY);
    } catch {
        /* localStorage indisponível */
    }
};

export const saveGame = (game: SavedGame): boolean => {
    const storage = getStorage();
    if (!storage) return false;
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(game));
        return true;
    } catch {
        /* cota cheia ou modo privado */
        return false;
    }
};

export const loadSavedGame = (): SavedGame | null => {
    const storage = getStorage();
    if (!storage) return null;

    let raw: string | null;
    try {
        raw = storage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
    if (!raw) return null;

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        clearSavedGame();
        return null;
    }

    const game = parseSavedGame(parsed);
    if (!game) {
        clearSavedGame();
        return null;
    }
    return game;
};
