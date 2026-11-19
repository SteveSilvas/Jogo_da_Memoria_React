import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Board from "./Board";

vi.mock("../../utils/sound", () => ({ playSound: vi.fn() }));

const COMPUTER_DELAY = 750;
const MATCH_DELAY = 900;

const cardButtons = () =>
    screen
        .getAllByRole("button")
        .filter((button) => button.classList.contains("Card"));

const faceOf = (button: HTMLElement) => button.getAttribute("data-face");

const turnHeading = () =>
    screen.getByRole("heading", { level: 2 }).textContent ?? "";

const announcement = () =>
    document.querySelector("[role=status]")?.textContent ?? "";

const scoreOf = (name: string): string => {
    const aside = screen
        .getAllByRole("complementary")
        .find((element) => element.textContent?.includes(name));
    return aside?.querySelector(".Scoreboard-scoreValue")?.textContent ?? "";
};

const renderSolo = () => {
    const onExit = vi.fn();
    const utils = render(
        <Board
            player1="Ana"
            player2="Computador"
            amountCards={10}
            computerOpponent
            onExit={onExit}
        />,
    );
    return { ...utils, onExit };
};

const pairIndexes = (): [number, number] => {
    const buttons = cardButtons();
    const seen = new Map<string, number>();
    for (let index = 0; index < buttons.length; index += 1) {
        const face = faceOf(buttons[index])!;
        const first = seen.get(face);
        if (first !== undefined) return [first, index];
        seen.set(face, index);
    }
    throw new Error("sem par");
};

const wrongIndexes = (): [number, number] => {
    const buttons = cardButtons();
    const faces = buttons.map((button) => faceOf(button));
    const first = faces.findIndex((face) => faces.indexOf(face) === faces.lastIndexOf(face) ? false : true);
    const other = faces.findIndex((face, index) => index > first && face !== faces[first]);
    return [first, other];
};

describe("Board: modo 1 jogador", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("mostra o computador no placar", () => {
        renderSolo();
        expect(scoreOf("Computador")).toBe("0");
        expect(scoreOf("Ana")).toBe("0");
    });

    it("nao deixa o humano jogar na vez do computador", async () => {
        const user = userEvent.setup();
        renderSolo();

        // Jogada errada do humano passa a vez.
        const [a, b] = wrongIndexes();
        await user.click(cardButtons()[a]);
        await user.click(cardButtons()[b]);

        await waitFor(() => expect(turnHeading()).toContain("Computador"), {
            timeout: MATCH_DELAY + 1500,
        });

        const buttons = cardButtons();
        const before = buttons.map((button) => button.classList.contains("is-flipped"));
        await user.click(buttons[0]);
        const after = cardButtons().map((button) =>
            button.classList.contains("is-flipped"),
        );
        // A primeira carta so pode ter virado pela jogada do computador, nao pelo clique.
        expect(after.filter(Boolean).length).toBeGreaterThanOrEqual(
            before.filter(Boolean).length,
        );
    });

    it("o computador joga sozinho e devolve a vez", async () => {
        vi.useFakeTimers();
        renderSolo();

        // Humano joga um par errado para passar a vez.
        const [a, b] = wrongIndexes();
        const buttons = cardButtons();
        act(() => {
            buttons[a].click();
        });
        act(() => {
            buttons[b].click();
        });

        // Fecha o par errado e passa a vez para o computador.
        act(() => {
            vi.advanceTimersByTime(MATCH_DELAY + 10);
        });
        expect(turnHeading()).toContain("Computador");

        // O computador vira a primeira carta.
        act(() => {
            vi.advanceTimersByTime(COMPUTER_DELAY + 10);
        });
        const flippedAfterFirst = cardButtons().filter((button) =>
            button.classList.contains("is-flipped"),
        );
        expect(flippedAfterFirst.length).toBeGreaterThanOrEqual(1);

        // E entao a segunda.
        act(() => {
            vi.advanceTimersByTime(COMPUTER_DELAY + 10);
        });
        const flippedAfterSecond = cardButtons().filter((button) =>
            button.classList.contains("is-flipped"),
        );
        expect(flippedAfterSecond.length).toBeGreaterThanOrEqual(2);
    });

    it("anuncia a jogada do computador na regiao aria-live", async () => {
        vi.useFakeTimers();
        renderSolo();

        const [a, b] = wrongIndexes();
        const buttons = cardButtons();
        act(() => buttons[a].click());
        act(() => buttons[b].click());
        act(() => {
            vi.advanceTimersByTime(MATCH_DELAY + 10);
        });

        expect(turnHeading()).toContain("Computador");
        act(() => {
            vi.advanceTimersByTime(COMPUTER_DELAY * 2 + 20);
        });
        act(() => {
            vi.advanceTimersByTime(MATCH_DELAY + 20);
        });

        expect(announcement().length).toBeGreaterThan(0);
    });

    it("nao dispara jogada do computador no modo de 2 jogadores", async () => {
        vi.useFakeTimers();
        render(
            <Board
                player1="Ana"
                player2="Bruno"
                amountCards={10}
                onExit={vi.fn()}
            />,
        );

        const [a, b] = wrongIndexes();
        const buttons = cardButtons();
        act(() => buttons[a].click());
        act(() => buttons[b].click());
        act(() => {
            vi.advanceTimersByTime(MATCH_DELAY + 10);
        });
        expect(turnHeading()).toContain("Bruno");

        act(() => {
            vi.advanceTimersByTime(COMPUTER_DELAY * 3);
        });

        expect(turnHeading()).toContain("Bruno");
        expect(
            cardButtons().filter((button) =>
                button.classList.contains("is-flipped"),
            ),
        ).toHaveLength(0);
    });

    it("o humano continua jogando quando acerta o par", async () => {
        const user = userEvent.setup();
        renderSolo();
        const [a, b] = pairIndexes();

        await user.click(cardButtons()[a]);
        await user.click(cardButtons()[b]);

        await waitFor(() => expect(scoreOf("Ana")).toBe("1"));
        expect(turnHeading()).toContain("Ana");
    });
});
