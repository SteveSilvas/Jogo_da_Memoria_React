import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Board from "./Board";
import { playSound } from "../../utils/sound";

vi.mock("../../utils/sound", () => ({ playSound: vi.fn() }));

const MATCH_DELAY = 900;

// Math.random fixo perto de 1 mantém a ordem original no shuffle, então a
// posição do botão no DOM é o próprio id da carta.
const IDENTITY_RANDOM = 0.9999;

const onExit = vi.fn();

let user: ReturnType<typeof userEvent.setup>;
let container: HTMLElement;

const renderBoard = (amountCards: number) => {
    ({ container } = render(
        <Board
            player1="Ana"
            player2="Bia"
            amountCards={amountCards}
            onExit={onExit}
        />,
    ));
};

const cards = () => Array.from(container.querySelectorAll<HTMLButtonElement>(".Card"));

const clickCard = async (index: number) => {
    await user.click(cards()[index]);
};

const advancePastReveal = async () => {
    await act(async () => {
        vi.advanceTimersByTime(MATCH_DELAY);
    });
};

const scoreOf = (index: 0 | 1) => {
    const scoreboard = screen.getAllByRole("complementary")[index];
    return within(scoreboard).getByText(/^\d+$/).textContent;
};

const turn = () => screen.getByRole("heading", { name: /Vez de/ }).textContent;

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(Math, "random").mockReturnValue(IDENTITY_RANDOM);
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    onExit.mockReset();
});

describe("Board", () => {
    it("renderiza a quantidade de cartas e começa com Ana jogando", () => {
        renderBoard(10);

        expect(cards()).toHaveLength(10);
        expect(turn()).toBe("Vez de Ana");
        expect(scoreOf(0)).toBe("0");
        expect(scoreOf(1)).toBe("0");
        expect(screen.getByText(/5 pares · 0 encontrados/)).toBeInTheDocument();
    });

    it("virar duas cartas iguais marca o par e mantém a vez do jogador", async () => {
        renderBoard(10);

        await clickCard(0);
        await clickCard(5);

        expect(cards()[0]).toHaveClass("is-matched");
        expect(cards()[5]).toHaveClass("is-matched");
        expect(scoreOf(0)).toBe("1");
        expect(scoreOf(1)).toBe("0");
        expect(turn()).toBe("Vez de Ana");
        expect(screen.getByText(/1 encontrados/)).toBeInTheDocument();
        expect(playSound).toHaveBeenCalled();
    });

    it("virar duas cartas diferentes desvira ambas e troca a vez", async () => {
        renderBoard(10);

        await clickCard(0);
        await clickCard(1);

        expect(cards()[0]).toHaveClass("is-flipped");
        expect(cards()[1]).toHaveClass("is-flipped");
        expect(turn()).toBe("Vez de Ana");

        await advancePastReveal();

        expect(cards()[0]).not.toHaveClass("is-flipped");
        expect(cards()[1]).not.toHaveClass("is-flipped");
        expect(turn()).toBe("Vez de Bia");
        expect(scoreOf(0)).toBe("0");
        expect(scoreOf(1)).toBe("0");
    });

    it("mantém o tabuleiro bloqueado durante a revelação e não aceita terceiro clique", async () => {
        renderBoard(10);

        await clickCard(0);
        await clickCard(1);

        expect(cards().every((card) => card.disabled)).toBe(true);

        const third = cards()[2];
        await user.click(third);

        expect(third).not.toHaveClass("is-flipped");
        expect(third).toHaveAccessibleName("Carta virada para baixo");

        await advancePastReveal();

        expect(turn()).toBe("Vez de Bia");
        expect(cards()[2]).not.toHaveClass("is-flipped");
        expect(cards().filter((c) => c.classList.contains("is-flipped"))).toHaveLength(0);
    });

    it("não permite clicar duas vezes na mesma carta", async () => {
        renderBoard(10);

        await clickCard(0);
        await clickCard(0);

        expect(cards()[0]).toHaveClass("is-flipped");
        expect(cards()[0]).toBeDisabled();
        expect(cards().filter((c) => c.classList.contains("is-flipped"))).toHaveLength(1);

        // o segundo clique é ignorado: segue a vez de Ana e nenhum par foi feito
        expect(turn()).toBe("Vez de Ana");
        expect(scoreOf(0)).toBe("0");

        // a carta revelada continua valendo como a primeira escolha da rodada
        await clickCard(5);

        expect(cards()[5]).toHaveClass("is-matched");
        expect(scoreOf(0)).toBe("1");
    });

    it("mostra o WinnerPanel ao encontrar todos os pares", async () => {
        renderBoard(4);

        await clickCard(0);
        await clickCard(2);
        await clickCard(1);
        await clickCard(3);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Parabéns, Ana!")).toBeInTheDocument();
        expect(scoreOf(0)).toBe("2");
        expect(scoreOf(1)).toBe("0");
        expect(screen.getByText(/2 pares · 2 encontrados/)).toBeInTheDocument();
    });

    it("trata empate corretamente", async () => {
        renderBoard(8);

        await clickCard(0);
        await clickCard(4);
        await clickCard(1);
        await clickCard(5);

        await clickCard(2);
        await clickCard(3);
        await advancePastReveal();

        await clickCard(2);
        await clickCard(6);
        await clickCard(3);
        await clickCard(7);

        expect(scoreOf(0)).toBe("2");
        expect(scoreOf(1)).toBe("2");
        expect(screen.getByText("Empate!")).toBeInTheDocument();
        expect(screen.getByText("Ninguém venceu desta vez")).toBeInTheDocument();
    });

    it("Reiniciar zera o placar e vira todas as cartas", async () => {
        renderBoard(10);

        await clickCard(0);
        await clickCard(5);
        expect(scoreOf(0)).toBe("1");

        await user.click(screen.getByRole("button", { name: "Reiniciar" }));

        expect(scoreOf(0)).toBe("0");
        expect(scoreOf(1)).toBe("0");
        expect(turn()).toBe("Vez de Ana");
        expect(screen.getByText(/0 encontrados/)).toBeInTheDocument();
        expect(
            cards().every(
                (card) =>
                    card.getAttribute("aria-label") === "Carta virada para baixo" &&
                    !card.classList.contains("is-flipped") &&
                    !card.classList.contains("is-matched"),
            ),
        ).toBe(true);
    });

    it("Voltar aciona a saída do jogo", async () => {
        renderBoard(10);

        await user.click(screen.getByRole("button", { name: "Voltar" }));

        expect(onExit).toHaveBeenCalledTimes(1);
    });
});
