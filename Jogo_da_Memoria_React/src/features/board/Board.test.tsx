import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Board from "./Board";

const MATCH_DELAY = 900;

const getCards = (container: HTMLElement): HTMLButtonElement[] =>
    Array.from(container.querySelectorAll<HTMLButtonElement>(".Card"));

const faceOf = (card: HTMLButtonElement): string => {
    const images = card.querySelectorAll("img");
    return images[images.length - 1]?.getAttribute("src") ?? "";
};

const findMismatchedPair = (cards: HTMLButtonElement[]): [number, number] => {
    for (let i = 0; i < cards.length; i += 1) {
        for (let j = i + 1; j < cards.length; j += 1) {
            if (faceOf(cards[i]) !== faceOf(cards[j])) return [i, j];
        }
    }
    throw new Error("nenhum par de cartas diferentes encontrado");
};

const statValue = (label: string): string => {
    const labelEl = screen.getByText(label);
    return labelEl.parentElement?.querySelector(".Board-statValue")?.textContent ?? "";
};

const timerText = (container: HTMLElement): string =>
    container.querySelector('[role="timer"]')?.textContent ?? "";

const advance = (ms: number) => {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
};

const renderBoard = (amountCards = 10) =>
    render(<Board player1="Ana" player2="Bia" amountCards={amountCards} onExit={() => {}} />);

describe("Board — contador de jogadas e cronômetro", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("começa com zero jogadas e cronômetro parado em 00:00", () => {
        const { container } = renderBoard();

        expect(statValue("Jogadas")).toBe("0");
        expect(timerText(container)).toBe("00:00");

        advance(5_000);

        expect(timerText(container)).toBe("00:00");
        expect(statValue("Jogadas")).toBe("0");
    });

    it("conta uma jogada por par de cartas virado, não por carta", () => {
        const { container } = renderBoard();
        const cards = getCards(container);
        const [a, b] = findMismatchedPair(cards);

        fireEvent.click(cards[a]);
        expect(statValue("Jogadas")).toBe("0");

        fireEvent.click(cards[b]);
        expect(statValue("Jogadas")).toBe("1");

        advance(MATCH_DELAY);
        fireEvent.click(cards[0]);
        fireEvent.click(cards[1]);
        expect(statValue("Jogadas")).toBe("2");
    });

    it("inicia o cronômetro no primeiro clique, não na montagem", () => {
        const { container } = renderBoard();

        advance(4_000);
        expect(timerText(container)).toBe("00:00");

        fireEvent.click(getCards(container)[0]);
        advance(65_000);

        expect(timerText(container)).toBe("01:05");
    });

    it("zera jogadas e tempo ao reiniciar", () => {
        const { container } = renderBoard();
        const cards = getCards(container);
        const [a, b] = findMismatchedPair(cards);

        fireEvent.click(cards[a]);
        fireEvent.click(cards[b]);
        advance(12_000);

        expect(statValue("Jogadas")).toBe("1");
        expect(timerText(container)).toBe("00:12");

        fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));

        expect(statValue("Jogadas")).toBe("0");
        expect(timerText(container)).toBe("00:00");

        advance(3_000);
        expect(timerText(container)).toBe("00:00");
    });

    it("mostra jogadas e tempo finais no WinnerPanel e para o cronômetro", () => {
        const { container } = renderBoard(10);
        const cards = getCards(container);

        const byFace = new Map<string, number[]>();
        cards.forEach((card, index) => {
            const face = faceOf(card);
            byFace.set(face, [...(byFace.get(face) ?? []), index]);
        });

        let moves = 0;
        for (const pair of byFace.values()) {
            fireEvent.click(cards[pair[0]]);
            fireEvent.click(cards[pair[1]]);
            moves += 1;
            advance(1_000);
        }

        const dialog = screen.getByRole("dialog");
        const summary = dialog.querySelectorAll(".WinnerPanel-summaryValue");
        expect(within(dialog).getByText("Jogadas")).toBeInTheDocument();
        expect(within(dialog).getByText("Tempo")).toBeInTheDocument();
        expect(summary[0]?.textContent).toBe(String(moves));
        expect(summary[1]?.textContent).toMatch(/^\d{2}:\d{2}$/);

        const frozen = timerText(container);
        expect(frozen).toMatch(/^\d{2}:\d{2}$/);

        advance(30_000);
        expect(timerText(container)).toBe(frozen);
    });

    it("anuncia jogadas e tempo na região aria-live", () => {
        const { container } = renderBoard();
        const cards = getCards(container);
        const [a, b] = findMismatchedPair(cards);

        fireEvent.click(cards[a]);
        fireEvent.click(cards[b]);

        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion?.textContent).toContain("Jogada 1");
    });

    it("limpa o intervalo do cronômetro no unmount", () => {
        const setIntervalSpy = vi.spyOn(window, "setInterval");
        const clearIntervalSpy = vi.spyOn(window, "clearInterval");
        const { container, unmount } = renderBoard();

        fireEvent.click(getCards(container)[0]);
        const intervalId = setIntervalSpy.mock.results[0]?.value;
        expect(intervalId).toBeDefined();

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
        setIntervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
    });

    it("limpa o intervalo do cronômetro ao reiniciar", () => {
        const setIntervalSpy = vi.spyOn(window, "setInterval");
        const clearIntervalSpy = vi.spyOn(window, "clearInterval");
        const { container } = renderBoard();

        fireEvent.click(getCards(container)[0]);
        const intervalId = setIntervalSpy.mock.results[0]?.value;

        fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));

        expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
        setIntervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
    });
});
