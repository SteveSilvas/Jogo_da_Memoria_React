import React from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import InitMemoryGame from "./InitMemoryGame";
import { STORAGE_KEY, STORAGE_VERSION } from "../../utils/storage";
import type { SavedGame } from "../../utils/storage";

const FACE_A = "https://example.com/a.png";
const FACE_B = "https://example.com/b.png";

const savedGame = (): SavedGame => ({
    version: STORAGE_VERSION,
    amountCards: 4,
    cards: [
        { id: 0, face: FACE_A, matched: false },
        { id: 1, face: FACE_B, matched: true },
        { id: 2, face: FACE_B, matched: true },
        { id: 3, face: FACE_A, matched: false },
    ],
    turn: 1,
    players: [
        { name: "Ana", score: 0, pairs: [] },
        { name: "Bia", score: 1, pairs: [FACE_B] },
    ],
});

const storedGame = (): SavedGame | null => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedGame) : null;
};

describe("InitMemoryGame — restauração da partida", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("abre o tabuleiro restaurado quando existe partida salva", () => {
        const game = savedGame();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));

        render(<InitMemoryGame />);

        expect(screen.queryByRole("button", { name: "Jogar" })).toBeNull();
        expect(document.querySelectorAll(".Card")).toHaveLength(4);
        expect(document.querySelectorAll(".Card.is-matched")).toHaveLength(2);
        expect(document.querySelector(".Board-title strong")?.textContent).toBe("Bia");
        expect(screen.getByText("Ana")).toBeTruthy();
        expect(storedGame()).toEqual(game);
    });

    it("inicia um jogo novo quando o localStorage está corrompido", () => {
        window.localStorage.setItem(STORAGE_KEY, "{{{ não é json");

        expect(() => render(<InitMemoryGame />)).not.toThrow();

        expect(screen.getByRole("button", { name: "Jogar" })).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("inicia um jogo novo quando o payload tem versão antiga", () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...savedGame(), version: 0 }),
        );

        render(<InitMemoryGame />);

        expect(screen.getByRole("button", { name: "Jogar" })).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("permite descartar a partida salva pelo tabuleiro", () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGame()));

        render(<InitMemoryGame />);

        act(() => screen.getByRole("button", { name: "Novo jogo" }).click());

        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(screen.getByRole("button", { name: "Jogar" })).toBeTruthy();
    });

    it("mantém a partida salva ao voltar para o início e permite continuar", () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGame()));

        render(<InitMemoryGame />);

        act(() => screen.getByRole("button", { name: "Voltar" }).click());

        expect(screen.getByText("Partida em andamento")).toBeTruthy();

        act(() => screen.getByRole("button", { name: "Continuar partida" }).click());

        expect(document.querySelectorAll(".Card")).toHaveLength(4);
        expect(screen.queryByText("Partida em andamento")).toBeNull();
    });

    it("descarta a partida salva pela tela inicial", () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGame()));

        render(<InitMemoryGame />);

        act(() => screen.getByRole("button", { name: "Voltar" }).click());
        act(() =>
            screen.getByRole("button", { name: "Descartar e começar do zero" }).click(),
        );

        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(screen.queryByText("Partida em andamento")).toBeNull();
        expect(screen.getByRole("button", { name: "Jogar" })).toBeTruthy();
    });
});
