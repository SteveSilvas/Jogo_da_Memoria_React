import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    STORAGE_KEY,
    STORAGE_VERSION,
    clearSavedGame,
    loadSavedGame,
    parseSavedGame,
    saveGame,
} from "./storage";
import type { SavedGame } from "./storage";

const FACE_A = "https://example.com/a.png";
const FACE_B = "https://example.com/b.png";

const validGame = (): SavedGame => ({
    version: STORAGE_VERSION,
    amountCards: 4,
    cards: [
        { id: 0, face: FACE_A, matched: true },
        { id: 1, face: FACE_B, matched: false },
        { id: 2, face: FACE_A, matched: true },
        { id: 3, face: FACE_B, matched: false },
    ],
    turn: 1,
    players: [
        { name: "Ana", score: 1, pairs: [FACE_A] },
        { name: "Bia", score: 0, pairs: [] },
    ],
});

describe("storage", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("salva e carrega a partida", () => {
        const game = validGame();
        expect(saveGame(game)).toBe(true);
        expect(loadSavedGame()).toEqual(game);
    });

    it("remove a partida salva", () => {
        saveGame(validGame());
        clearSavedGame();
        expect(loadSavedGame()).toBeNull();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("retorna null quando não há nada salvo", () => {
        expect(loadSavedGame()).toBeNull();
    });

    it("ignora JSON inválido sem lançar erro", () => {
        window.localStorage.setItem(STORAGE_KEY, "{isso não é json");
        expect(() => loadSavedGame()).not.toThrow();
        expect(loadSavedGame()).toBeNull();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("descarta payload de versão antiga", () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...validGame(), version: 0 }),
        );
        expect(loadSavedGame()).toBeNull();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("rejeita payload sem os campos obrigatórios", () => {
        expect(parseSavedGame({ version: STORAGE_VERSION })).toBeNull();
        expect(parseSavedGame(null)).toBeNull();
        expect(parseSavedGame("texto")).toBeNull();
    });

    it("rejeita carta com face fora de par", () => {
        const game = validGame();
        game.cards[3] = { id: 3, face: "https://example.com/c.png", matched: false };
        expect(parseSavedGame(game)).toBeNull();
    });

    it("rejeita placar que não casa com as cartas encontradas", () => {
        const game = validGame();
        game.players[0].score = 0;
        game.players[0].pairs = [];
        expect(parseSavedGame(game)).toBeNull();
    });

    it("rejeita partida já vencida", () => {
        const game: SavedGame = {
            version: STORAGE_VERSION,
            amountCards: 2,
            cards: [
                { id: 0, face: FACE_A, matched: true },
                { id: 1, face: FACE_A, matched: true },
            ],
            turn: 0,
            players: [
                { name: "Ana", score: 1, pairs: [FACE_A] },
                { name: "Bia", score: 0, pairs: [] },
            ],
        };
        expect(parseSavedGame(game)).toBeNull();
    });

    it("não quebra quando o localStorage lança erro ao gravar", () => {
        const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("QuotaExceededError");
        });

        expect(() => saveGame(validGame())).not.toThrow();
        expect(saveGame(validGame())).toBe(false);

        spy.mockRestore();
    });

    it("não quebra quando o localStorage lança erro ao ler", () => {
        const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("SecurityError");
        });

        expect(loadSavedGame()).toBeNull();

        spy.mockRestore();
    });
});
