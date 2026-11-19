import CardType from "../@Types/CardType";
import { CARD_BACK } from "../data/cardFaces";

export const GAME_STORAGE_KEY = "jogo-da-memoria:partida";
const VERSION = 1;

export type StoredPlayer = { name: string; score: number; pairs: string[] };

export type StoredGame = {
    cards: CardType[];
    selected: number[];
    turn: 0 | 1;
    players: [StoredPlayer, StoredPlayer];
    moves: number;
    seconds: number;
    amountCards: number;
};

type Payload = StoredGame & { version: number };

type SavedCard = Omit<CardType, "back">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const isCard = (value: unknown): value is SavedCard =>
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.face === "string" &&
    value.face.length > 0 &&
    typeof value.flipped === "boolean" &&
    typeof value.matched === "boolean";

const isPlayer = (value: unknown): value is StoredPlayer =>
    isRecord(value) &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    typeof value.score === "number" &&
    Number.isFinite(value.score) &&
    value.score >= 0 &&
    Array.isArray(value.pairs) &&
    value.pairs.every((pair) => typeof pair === "string");

const isSavedGame = (value: unknown): value is Payload => {
    if (!isRecord(value) || value.version !== VERSION) return false;

    const { cards, selected, turn, players, moves, seconds, amountCards } = value;

    if (!Array.isArray(cards) || cards.length === 0 || cards.length % 2 !== 0) {
        return false;
    }
    if (!cards.every(isCard)) return false;

    const ids = new Set(cards.map((card) => card.id));
    if (ids.size !== cards.length) return false;

    if (!Array.isArray(selected) || !selected.every((id) => ids.has(id))) {
        return false;
    }
    if (selected.length > 2) return false;

    if (turn !== 0 && turn !== 1) return false;

    if (!Array.isArray(players) || players.length !== 2) return false;
    if (!players.every(isPlayer)) return false;

    if (typeof moves !== "number" || !Number.isFinite(moves) || moves < 0) {
        return false;
    }
    if (
        typeof seconds !== "number" ||
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return false;
    }
    if (amountCards !== cards.length) return false;

    return true;
};

const normalizeCards = (cards: CardType[]): CardType[] =>
    cards.map((card) => ({ ...card, back: CARD_BACK }));

const stripBack = (cards: CardType[]) =>
    cards.map(({ id, face, flipped, matched }) => ({
        id,
        face,
        flipped,
        matched,
    }));

export const loadGame = (): StoredGame | null => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
        if (!raw) return null;

        const parsed: unknown = JSON.parse(raw);
        if (!isSavedGame(parsed)) {
            window.localStorage.removeItem(GAME_STORAGE_KEY);
            return null;
        }

        return {
            cards: normalizeCards(parsed.cards as CardType[]),
            selected: parsed.selected,
            turn: parsed.turn,
            players: parsed.players,
            moves: parsed.moves,
            seconds: parsed.seconds,
            amountCards: parsed.amountCards,
        };
    } catch {
        // Registro ilegivel (JSON invalido) nao pode travar o jogo.
        clearGame();
        return null;
    }
};

export const saveGame = (game: StoredGame): void => {
    if (typeof window === "undefined") return;
    try {
        const payload = {
            version: VERSION,
            ...game,
            cards: stripBack(game.cards),
        };
        window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        /* storage indisponivel ou cheio: a partida segue so em memoria */
    }
};

export const clearGame = (): void => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(GAME_STORAGE_KEY);
    } catch {
        /* storage indisponivel */
    }
};
