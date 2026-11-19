import { beforeEach, describe, expect, it, vi } from "vitest";
import CardType from "../@Types/CardType";
import {
    GAME_STORAGE_KEY,
    clearGame,
    loadGame,
    saveGame,
    type StoredGame,
} from "./gameStorage";

const cards: CardType[] = [
    { id: 0, face: "/a.png", back: "/b.png", flipped: false, matched: false },
    { id: 1, face: "/a.png", back: "/b.png", flipped: false, matched: false },
    { id: 2, face: "/c.png", back: "/b.png", flipped: false, matched: false },
    { id: 3, face: "/c.png", back: "/b.png", flipped: false, matched: false },
];

const game = (overrides: Partial<StoredGame> = {}): StoredGame => ({
    cards,
    selected: [],
    turn: 0,
    players: [
        { name: "Ana", score: 0, pairs: [] },
        { name: "Bruno", score: 0, pairs: [] },
    ],
    moves: 0,
    seconds: 0,
    amountCards: 4,
    ...overrides,
});

const write = (value: unknown) =>
    window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(value));

describe("gameStorage", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("salva e recupera a partida", () => {
        saveGame(game({ moves: 3, seconds: 42, turn: 1 }));

        const loaded = loadGame();
        expect(loaded).not.toBeNull();
        expect(loaded!.moves).toBe(3);
        expect(loaded!.seconds).toBe(42);
        expect(loaded!.turn).toBe(1);
        expect(loaded!.cards).toHaveLength(4);
    });

    it("preserva a ordem e o estado das cartas", () => {
        const played = cards.map((card, index) =>
            index < 2 ? { ...card, matched: true, flipped: true } : card,
        );
        saveGame(game({ cards: played, players: [
            { name: "Ana", score: 1, pairs: ["/a.png"] },
            { name: "Bruno", score: 0, pairs: [] },
        ] }));

        const loaded = loadGame()!;
        expect(loaded.cards.map((c) => c.face)).toEqual(
            cards.map((c) => c.face),
        );
        expect(loaded.cards.slice(0, 2).every((c) => c.matched)).toBe(true);
        expect(loaded.players[0].score).toBe(1);
    });

    it("nao grava o campo back, que e constante", () => {
        saveGame(game());
        const raw = window.localStorage.getItem(GAME_STORAGE_KEY)!;
        expect(raw).not.toContain('"back"');
        expect(loadGame()!.cards.every((c) => c.back.length > 0)).toBe(true);
    });

    it("inclui a versao no payload", () => {
        saveGame(game());
        const raw = JSON.parse(window.localStorage.getItem(GAME_STORAGE_KEY)!);
        expect(raw.version).toBe(1);
    });

    it("devolve null quando nao ha nada salvo", () => {
        expect(loadGame()).toBeNull();
    });

    it("devolve null e limpa o registro com JSON invalido", () => {
        window.localStorage.setItem(GAME_STORAGE_KEY, "{isso nao e json");
        expect(loadGame()).toBeNull();
        expect(window.localStorage.getItem(GAME_STORAGE_KEY)).toBeNull();
    });

    it("rejeita versao desconhecida", () => {
        write({ version: 99, ...game() });
        expect(loadGame()).toBeNull();
    });

    it("rejeita formato invalido sem quebrar", () => {
        for (const payload of [
            null,
            [],
            "texto",
            { version: 1 },
            { version: 1, cards: [], selected: [], turn: 0, players: [], moves: 0, seconds: 0, amountCards: 0 },
        ]) {
            window.localStorage.clear();
            write(payload);
            expect(loadGame()).toBeNull();
        }
    });

    it("rejeita quantidade impar de cartas", () => {
        write({ version: 1, ...game(), cards: cards.slice(0, 3), amountCards: 3 });
        expect(loadGame()).toBeNull();
    });

    it("rejeita ids duplicados", () => {
        const duplicated = cards.map((card) => ({ ...card, id: 0 }));
        write({ version: 1, ...game({ cards: duplicated }) });
        expect(loadGame()).toBeNull();
    });

    it("rejeita selecao com ids inexistentes", () => {
        write({ version: 1, ...game({ selected: [999] }) });
        expect(loadGame()).toBeNull();
    });

    it("rejeita placar negativo ou nao numerico", () => {
        write({
            version: 1,
            ...game(),
            players: [
                { name: "Ana", score: -1, pairs: [] },
                { name: "Bruno", score: 0, pairs: [] },
            ],
        });
        expect(loadGame()).toBeNull();
    });

    it("rejeita turno fora de 0 e 1", () => {
        write({ version: 1, ...game(), turn: 2 });
        expect(loadGame()).toBeNull();
    });

    it("clearGame remove o registro", () => {
        saveGame(game());
        clearGame();
        expect(window.localStorage.getItem(GAME_STORAGE_KEY)).toBeNull();
        expect(loadGame()).toBeNull();
    });

    it("nao lanca quando o storage falha na escrita", () => {
        const spy = vi
            .spyOn(Storage.prototype, "setItem")
            .mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });

        expect(() => saveGame(game())).not.toThrow();
        spy.mockRestore();
    });

    it("nao lanca quando o storage falha na leitura", () => {
        const spy = vi
            .spyOn(Storage.prototype, "getItem")
            .mockImplementation(() => {
                throw new Error("SecurityError");
            });

        expect(loadGame()).toBeNull();
        spy.mockRestore();
    });
});
