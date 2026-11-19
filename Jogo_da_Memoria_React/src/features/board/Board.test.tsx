import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Board from "./Board";

const MATCH_DELAY = 900;

const renderBoard = (amountCards = 10) => {
    const onExit = vi.fn();
    const utils = render(
        <Board
            player1="Ana"
            player2="Bruno"
            amountCards={amountCards}
            onExit={onExit}
        />,
    );
    return { ...utils, onExit };
};

const cardButtons = () =>
    screen
        .getAllByRole("button")
        .filter((button) => button.classList.contains("Card"));

const turnText = () => screen.getByRole("heading", { level: 2 }).textContent;

const scoreOf = (playerName: string): string => {
    const aside = screen
        .getAllByRole("complementary")
        .find((element) => element.textContent?.includes(playerName));
    return aside?.querySelector(".Scoreboard-scoreValue")?.textContent ?? "";
};

describe("Board", () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it("renderiza a quantidade de cartas pedida", () => {
        renderBoard(10);
        expect(cardButtons()).toHaveLength(10);
    });

    it("mostra o nome do jogador da vez", () => {
        renderBoard();
        expect(turnText()).toContain("Ana");
    });

    it("nao revela nenhuma carta no inicio", () => {
        renderBoard();
        for (const card of cardButtons()) {
            expect(card).toHaveAttribute("aria-label", "Carta virada para baixo");
        }
    });

    it("nao permite clicar duas vezes na mesma carta", async () => {
        const user = userEvent.setup();
        renderBoard();
        const [first] = cardButtons();

        await user.click(first);
        expect(first).toHaveAttribute("aria-label", "Carta revelada");
        expect(first).toBeDisabled();

        await user.click(first);
        expect(first).toHaveAttribute("aria-label", "Carta revelada");
    });

    it("ao virar duas cartas iguais, marca o par e mantem a vez", async () => {
        const user = userEvent.setup();
        renderBoard();
        const buttons = cardButtons();

        await user.click(buttons[0]);
        const faceA = buttons[0].querySelectorAll("img")[1]?.getAttribute("src");

        const twin = buttons.find(
            (button, index) =>
                index > 0 &&
                button.querySelectorAll("img")[1]?.getAttribute("src") === faceA,
        );
        expect(twin).toBeDefined();
        await user.click(twin!);

        await waitFor(() => {
            expect(twin!).toHaveClass("is-matched");
        });
        expect(buttons[0]).toHaveClass("is-matched");
        expect(turnText()).toContain("Ana");
        expect(scoreOf("Ana")).toBe("1");
        expect(scoreOf("Bruno")).toBe("0");
    });

    it("ao virar duas cartas diferentes, desvira e troca a vez", async () => {
        const user = userEvent.setup();
        renderBoard();
        const buttons = cardButtons();

        await user.click(buttons[0]);
        const faceA = buttons[0].querySelectorAll("img")[1]?.getAttribute("src");
        const other = buttons.find(
            (button) =>
                button.querySelectorAll("img")[1]?.getAttribute("src") !== faceA,
        )!;

        await user.click(other);
        expect(turnText()).toContain("Ana");

        await waitFor(
            () => {
                expect(turnText()).toContain("Bruno");
            },
            { timeout: MATCH_DELAY + 1500 },
        );

        expect(buttons[0]).toHaveAttribute("aria-label", "Carta virada para baixo");
        expect(other).toHaveAttribute("aria-label", "Carta virada para baixo");
    });

    it("bloqueia o tabuleiro enquanto o par errado esta revelado", async () => {
        const user = userEvent.setup();
        renderBoard();
        const buttons = cardButtons();

        await user.click(buttons[0]);
        const faceA = buttons[0].querySelectorAll("img")[1]?.getAttribute("src");
        const other = buttons.find(
            (button) =>
                button.querySelectorAll("img")[1]?.getAttribute("src") !== faceA,
        )!;
        await user.click(other);

        const third = buttons.find(
            (button) =>
                button !== buttons[0] &&
                button !== other &&
                button.querySelectorAll("img")[1]?.getAttribute("src") !== faceA,
        )!;
        expect(third).toBeDisabled();

        await waitFor(
            () => {
                expect(turnText()).toContain("Bruno");
            },
            { timeout: MATCH_DELAY + 1500 },
        );
    });

    it("mostra o painel de vitoria quando todos os pares sao encontrados", async () => {
        const user = userEvent.setup();
        renderBoard(10);

        const used = new Set<Element>();
        while (cardButtons().some((button) => !button.classList.contains("is-matched"))) {
            const buttons = cardButtons().filter(
                (button) =>
                    !button.classList.contains("is-matched") && !used.has(button),
            );
            if (buttons.length < 2) break;
            const first = buttons[0];
            const faceA = first.querySelectorAll("img")[1]?.getAttribute("src");
            const twin = buttons.find(
                (button) =>
                    button !== first &&
                    button.querySelectorAll("img")[1]?.getAttribute("src") === faceA,
            );
            if (!twin) break;
            await user.click(first);
            await user.click(twin);
            used.add(first);
            used.add(twin);
            await waitFor(() => expect(twin).toHaveClass("is-matched"));
        }

        const dialog = await screen.findByRole("dialog", {}, { timeout: MATCH_DELAY + 2000 });
        const title = within(dialog).getByRole("heading", { level: 2 });
        expect(title.textContent).toMatch(/Ana|Bruno|Empate/);
    }, 30000);

    it("reiniciar zera o placar e vira todas as cartas", async () => {
        const user = userEvent.setup();
        renderBoard();

        const buttons = cardButtons();
        await user.click(buttons[0]);
        const faceA = buttons[0].querySelectorAll("img")[1]?.getAttribute("src");
        const twin = buttons.find(
            (button, index) =>
                index > 0 &&
                button.querySelectorAll("img")[1]?.getAttribute("src") === faceA,
        )!;
        await user.click(twin);
        await waitFor(() => expect(twin).toHaveClass("is-matched"));

        await user.click(screen.getByRole("button", { name: "Reiniciar" }));

        await waitFor(() => {
            expect(scoreOf("Ana")).toBe("0");
        });
        for (const card of cardButtons()) {
            expect(card).toHaveAttribute("aria-label", "Carta virada para baixo");
            expect(card).not.toHaveClass("is-matched");
        }
        expect(turnText()).toContain("Ana");
    });

    it("chama onExit ao clicar em Voltar", async () => {
        const user = userEvent.setup();
        const { onExit } = renderBoard();

        await user.click(screen.getByRole("button", { name: "Voltar" }));
        expect(onExit).toHaveBeenCalledTimes(1);
    });
});
