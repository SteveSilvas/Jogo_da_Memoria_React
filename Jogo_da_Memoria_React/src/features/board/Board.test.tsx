import React from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import Board from "./Board";
import {
    STORAGE_KEY,
    STORAGE_VERSION,
    loadSavedGame,
} from "../../utils/storage";
import type { SavedGame } from "../../utils/storage";

const FACE_A = "https://example.com/a.png";
const FACE_B = "https://example.com/b.png";

const cardFaces = (): string[] =>
    Array.from(document.querySelectorAll(".Card")).map(
        (card) => (card.querySelectorAll("img")[1] as HTMLImageElement).getAttribute("src") ?? "",
    );

const clickCard = (index: number) => {
    const card = document.querySelectorAll<HTMLButtonElement>(".Card")[index];
    act(() => card.click());
};

const findPairIndices = (): [number, number] => {
    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".Card"));
    const faces = cards.map(
        (card) => (card.querySelectorAll("img")[1] as HTMLImageElement).getAttribute("src") ?? "",
    );
    for (let i = 0; i < cards.length; i += 1) {
        if (cards[i].classList.contains("is-matched")) continue;
        for (let j = i + 1; j < cards.length; j += 1) {
            if (cards[j].classList.contains("is-matched")) continue;
            if (faces[i] === faces[j]) return [i, j];
        }
    }
    throw new Error("nenhum par encontrado no tabuleiro");
};

const renderBoard = (props: Partial<React.ComponentProps<typeof Board>> = {}) =>
    render(
        <Board
            player1="Ana"
            player2="Bia"
            amountCards={4}
            onExit={() => undefined}
            onNewGame={() => undefined}
            {...props}
        />,
    );

const storedGame = (): SavedGame | null => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedGame) : null;
};

const savedGame = (): SavedGame => ({
    version: STORAGE_VERSION,
    amountCards: 4,
    cards: [
        { id: 0, face: FACE_A, matched: true },
        { id: 1, face: FACE_B, matched: false },
        { id: 2, face: FACE_B, matched: false },
        { id: 3, face: FACE_A, matched: true },
    ],
    turn: 1,
    players: [
        { name: "Ana", score: 1, pairs: [FACE_A] },
        { name: "Bia", score: 0, pairs: [] },
    ],
});

describe("Board — persistência da partida", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("salva o estado inicial em localStorage", () => {
        renderBoard({ amountCards: 20 });

        const saved = storedGame();
        expect(saved?.version).toBe(STORAGE_VERSION);
        expect(saved?.amountCards).toBe(20);
        expect(saved?.cards).toHaveLength(20);
        expect(saved?.turn).toBe(0);
        expect(saved?.players.map((p) => p.name)).toEqual(["Ana", "Bia"]);
    });

    it("não persiste o campo 'back' das cartas", () => {
        renderBoard();

        const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
        expect(raw).not.toContain("back");
        expect(storedGame()?.cards[0]).toEqual({
            id: expect.any(Number),
            face: expect.any(String),
            matched: expect.any(Boolean),
        });
    });

    it("salva pares encontrados e placar após um acerto", () => {
        renderBoard();
        const [first, second] = findPairIndices();

        clickCard(first);
        clickCard(second);

        const saved = storedGame();
        expect(saved?.players[0].score).toBe(1);
        expect(saved?.players[0].pairs).toHaveLength(1);
        expect(saved?.cards.filter((card) => card.matched)).toHaveLength(2);
        expect(saved?.turn).toBe(0);
    });

    it("restaura o tabuleiro exatamente como foi salvo", () => {
        const game = savedGame();
        renderBoard({ initialGame: game });

        expect(cardFaces()).toEqual([FACE_A, FACE_B, FACE_B, FACE_A]);
        expect(document.querySelector(".Board-progress")?.textContent).toContain(
            "2 pares · 1 encontrados",
        );
        // O turno salvo (1) é restaurado: Bia começa jogando.
        expect(document.querySelector(".Board-title strong")?.textContent).toBe("Bia");
        expect(screen.getByText("Ana")).toBeTruthy();
        expect(document.querySelectorAll(".Card.is-matched")).toHaveLength(2);
        expect(storedGame()).toEqual(game);
    });

    it("limpa a partida salva ao vencer", () => {
        renderBoard();

        for (let round = 0; round < 2; round += 1) {
            const [first, second] = findPairIndices();
            clickCard(first);
            clickCard(second);
        }

        expect(screen.getByRole("dialog")).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(loadSavedGame()).toBeNull();
    });

    it("'Reiniciar' regrava o estado zerado", () => {
        renderBoard();
        const [first, second] = findPairIndices();
        clickCard(first);
        clickCard(second);
        expect(storedGame()?.players[0].score).toBe(1);

        act(() => screen.getByRole("button", { name: "Reiniciar" }).click());

        const saved = storedGame();
        expect(saved?.players[0].score).toBe(0);
        expect(saved?.players[1].score).toBe(0);
        expect(saved?.cards.every((card) => !card.matched)).toBe(true);
        expect(saved?.cards).toHaveLength(4);
    });

    it("'Novo jogo' descarta a partida salva", () => {
        let newGameCalls = 0;
        renderBoard({
            onNewGame: () => {
                newGameCalls += 1;
            },
        });

        act(() => screen.getByRole("button", { name: "Novo jogo" }).click());

        expect(newGameCalls).toBe(1);
    });
});
