import React, { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import Board from "./Board";

const FLIP_DELAY = 1000;

const renderBoard = (mode: "single-player" | "two-players", forgetChance = 0) => {
    const board = (
        <Board
            player1="Ana"
            player2={mode === "single-player" ? "Computador" : "Bia"}
            amountCards={10}
            mode={mode}
            onExit={() => {}}
            computerForgetChance={forgetChance}
        />
    );
    return render(<StrictMode>{board}</StrictMode>);
};

const cardButtons = (): HTMLButtonElement[] =>
    Array.from(document.querySelectorAll<HTMLButtonElement>("button.Card"));

const faceOf = (index: number): string => {
    const image = cardButtons()[index].querySelectorAll("img")[1];
    return image?.getAttribute("src") ?? "";
};

const isRevealed = (index: number): boolean =>
    cardButtons()[index].classList.contains("is-flipped");

const advance = async (ms: number) => {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
        await act(async () => {
            vi.advanceTimersByTime(100);
        });
    }
};

const turnText = () => screen.getByTestId("turn-announcement").textContent ?? "";

const waitForTurn = async (name: string) => {
    for (let step = 0; step < 100; step++) {
        if (turnText().includes(name)) return;
        await advance(100);
    }
    throw new Error(`a vez de ${name} não chegou; turno atual: ${turnText()}`);
};

const firstMismatch = (): [number, number] => {
    for (let i = 0; i < cardButtons().length; i++) {
        for (let j = i + 1; j < cardButtons().length; j++) {
            if (faceOf(i) !== faceOf(j)) return [i, j];
        }
    }
    throw new Error("baralho sem cartas diferentes");
};

const scoreboardFor = (name: string): HTMLElement => {
    const board = Array.from(
        document.querySelectorAll<HTMLElement>("aside.Scoreboard"),
    ).find(
        (aside) =>
            aside.querySelector(".Scoreboard-name")?.textContent === name,
    );
    if (!board) throw new Error(`placar de ${name} não encontrado`);
    return board;
};

const twinOf = (index: number): number => {
    const face = faceOf(index);
    for (let i = 0; i < cardButtons().length; i++) {
        if (i !== index && faceOf(i) === face && !isRevealed(i)) return i;
    }
    throw new Error("sem par disponível");
};

describe("Board em modo 1 jogador", () => {
    it("anuncia a vez do computador na região aria-live", async () => {
        vi.useFakeTimers();
        renderBoard("single-player");

        expect(screen.getByTestId("turn-announcement")).toHaveAttribute(
            "aria-live",
            "polite",
        );
        expect(screen.getByTestId("turn-announcement")).toHaveTextContent("Ana");

        const [first, second] = firstMismatch();
        fireEvent.click(cardButtons()[first]);
        fireEvent.click(cardButtons()[second]);

        await advance(FLIP_DELAY);

        expect(screen.getByTestId("turn-announcement")).toHaveTextContent(
            "Computador",
        );
        vi.useRealTimers();
    });

    it("faz o computador jogar depois do erro do humano, com atraso", async () => {
        vi.useFakeTimers();
        renderBoard("single-player");

        const [first, second] = firstMismatch();
        fireEvent.click(cardButtons()[first]);
        fireEvent.click(cardButtons()[second]);

        await advance(FLIP_DELAY);
        expect(cardButtons().filter((_, index) => isRevealed(index))).toHaveLength(0);

        await advance(FLIP_DELAY);

        const revealed = cardButtons()
            .map((_, index) => index)
            .filter((index) => isRevealed(index));
        expect(revealed.length).toBeGreaterThan(0);
        vi.useRealTimers();
    });

    it("memoriza cartas reveladas e pontua sem trapacear", async () => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0);
        renderBoard("single-player", 0);

        const faces = cardButtons().map((_, index) => faceOf(index));
        const computerScore = () =>
            Number(
                scoreboardFor("Computador").querySelector(
                    ".Scoreboard-scoreValue",
                )?.textContent,
            );

        // O humano sempre erra o par; só a memória do computador pode pontuar.
        for (let round = 0; round < 40 && computerScore() === 0; round++) {
            await waitForTurn("Ana");
            const hidden = cardButtons()
                .map((_, index) => index)
                .filter((index) => !isRevealed(index));
            const first = hidden[0];
            const second = hidden.find(
                (index) => index !== first && faces[index] !== faces[first],
            );
            expect(second).toBeDefined();
            fireEvent.click(cardButtons()[first]);
            fireEvent.click(cardButtons()[second as number]);
            await advance(FLIP_DELAY * 2);
        }

        expect(computerScore()).toBeGreaterThan(0);
        expect(scoreboardFor("Ana")).toHaveTextContent("0pares");
        vi.useRealTimers();
    });

    it("joga a partida completa até o fim", async () => {
        vi.useFakeTimers();
        renderBoard("single-player", 0.5);

        for (let step = 0; step < 200; step++) {
            if (document.querySelector(".WinnerOverlay")) break;

            const hidden = cardButtons()
                .map((_, index) => index)
                .filter((index) => !isRevealed(index));

            if (hidden.length >= 2) {
                fireEvent.click(cardButtons()[hidden[0]]);
                fireEvent.click(cardButtons()[hidden[1]]);
            }

            await advance(FLIP_DELAY + FLIP_DELAY);
        }

        expect(document.querySelector(".WinnerOverlay")).not.toBeNull();
        expect(
            cardButtons().every((_, index) => isRevealed(index)),
        ).toBe(true);
        vi.useRealTimers();
    });
});

describe("Board em modo 2 jogadores", () => {
    it("passa a vez para o segundo jogador humano e não joga sozinho", async () => {
        vi.useFakeTimers();
        renderBoard("two-players");

        const [first, second] = firstMismatch();
        fireEvent.click(cardButtons()[first]);
        fireEvent.click(cardButtons()[second]);
        await advance(FLIP_DELAY);

        expect(screen.getByTestId("turn-announcement")).toHaveTextContent("Bia");

        await advance(FLIP_DELAY * 5);

        expect(screen.getByTestId("turn-announcement")).toHaveTextContent("Bia");
        expect(cardButtons().filter((_, index) => isRevealed(index))).toHaveLength(0);
        vi.useRealTimers();
    });

    it("marca um par para o jogador da vez", async () => {
        vi.useFakeTimers();
        renderBoard("two-players");

        fireEvent.click(cardButtons()[0]);
        fireEvent.click(cardButtons()[twinOf(0)]);
        await advance(FLIP_DELAY);

        expect(screen.getByTestId("turn-announcement")).toHaveTextContent("Ana");
        expect(scoreboardFor("Ana")).toHaveTextContent("1par");
        vi.useRealTimers();
    });
});
