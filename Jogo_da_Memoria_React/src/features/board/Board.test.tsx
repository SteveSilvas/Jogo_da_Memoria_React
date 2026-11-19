import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Board from "./Board";

vi.mock("../../utils/shuffle", () => ({
    shuffle: <T,>(items: T[]): T[] => [...items],
}));

vi.mock("../../utils/sound", () => ({
    playSound: vi.fn(),
}));

const PAIRS_IN_10_CARDS = 5;

const playWholeGame = async (user: ReturnType<typeof userEvent.setup>) => {
    const cards = screen.getAllByRole("button", {
        name: "Carta virada para baixo",
    });
    for (let pair = 0; pair < PAIRS_IN_10_CARDS; pair += 1) {
        await user.click(cards[pair]);
        await user.click(cards[pair + PAIRS_IN_10_CARDS]);
    }
};

describe("Board + WinnerPanel (integração)", () => {
    it("abre o painel com foco dentro e ESC volta para a tela inicial", async () => {
        const onExit = vi.fn();
        const user = userEvent.setup();

        render(
            <Board
                player1="Ana"
                player2="Bia"
                amountCards={10}
                onExit={onExit}
            />,
        );

        await playWholeGame(user);

        const dialog = await screen.findByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Jogar de novo" }),
        );

        await user.keyboard("{Escape}");
        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it("restaura o foco no botão Reiniciar ao reiniciar pelo painel", async () => {
        const user = userEvent.setup();

        render(
            <Board
                player1="Ana"
                player2="Bia"
                amountCards={10}
                onExit={vi.fn()}
            />,
        );

        const restart = screen.getByRole("button", { name: "Reiniciar" });
        restart.focus();

        await playWholeGame(user);
        await screen.findByRole("dialog");

        await user.click(screen.getByRole("button", { name: "Jogar de novo" }));

        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Reiniciar" }),
        );
    });
});
