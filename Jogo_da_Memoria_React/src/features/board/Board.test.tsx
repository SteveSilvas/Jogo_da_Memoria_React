import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Board from "./Board";

vi.mock("../../utils/sound", () => ({ playSound: vi.fn() }));

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


const statValue = (label: string): string => {
    const stat = Array.from(document.querySelectorAll(".Board-stat")).find(
        (element) => element.textContent?.includes(label),
    );
    return stat?.querySelector("strong")?.textContent ?? "";
};

const movesValue = () => statValue("Jogadas");
const timerValue = () => statValue("Tempo");

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
            expect(card.getAttribute("aria-label")).toContain("virada para baixo");
        }
    });

    it("nao permite clicar duas vezes na mesma carta", async () => {
        const user = userEvent.setup();
        renderBoard();
        const [first] = cardButtons();

        await user.click(first);
        expect(first.getAttribute("aria-label")).toContain("revelada");
        expect(first).toBeDisabled();

        await user.click(first);
        expect(first.getAttribute("aria-label")).toContain("revelada");
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

        expect(buttons[0].getAttribute("aria-label")).toContain("virada para baixo");
        expect(other.getAttribute("aria-label")).toContain("virada para baixo");
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
            expect(card.getAttribute("aria-label")).toContain("virada para baixo");
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

    it("rotula cada carta com sua posicao na grade", () => {
        renderBoard(10);
        const labels = cardButtons().map((card) => card.getAttribute("aria-label"));
        expect(labels[0]).toBe("Carta 1 de 10, virada para baixo");
        expect(labels[9]).toBe("Carta 10 de 10, virada para baixo");
        expect(new Set(labels).size).toBe(10);
    });

    it("anuncia a troca de vez em uma regiao aria-live", async () => {
        const user = userEvent.setup();
        renderBoard();
        const status = screen.getByRole("status");
        expect(status).toHaveAttribute("aria-live", "polite");

        const buttons = cardButtons();
        await user.click(buttons[0]);
        const faceA = buttons[0].querySelectorAll("img")[1]?.getAttribute("src");
        const other = buttons.find(
            (button) =>
                button.querySelectorAll("img")[1]?.getAttribute("src") !== faceA,
        )!;
        await user.click(other);

        await waitFor(
            () => {
                expect(status.textContent).toContain("Bruno");
            },
            { timeout: MATCH_DELAY + 1500 },
        );
    });

    it("anuncia o par encontrado", async () => {
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

        await waitFor(() => {
            expect(screen.getByRole("status").textContent).toContain("Par encontrado");
        });
    });

    it("marca cartas encontradas com rotulo proprio", async () => {
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

        await waitFor(() => {
            expect(buttons[0].getAttribute("aria-label")).toContain("par encontrado");
        });
    });

    it("conta uma jogada por par de cartas virado", async () => {
        const user = userEvent.setup();
        renderBoard();
        expect(movesValue()).toBe("0");

        const buttons = cardButtons();
        await user.click(buttons[0]);
        expect(movesValue()).toBe("0");

        const faceA = buttons[0].querySelectorAll("img")[1]?.getAttribute("src");
        const other = buttons.find(
            (button) =>
                button.querySelectorAll("img")[1]?.getAttribute("src") !== faceA,
        )!;
        await user.click(other);

        await waitFor(() => expect(movesValue()).toBe("1"));
    });

    it("nao conta jogada ao clicar na mesma carta duas vezes", async () => {
        const user = userEvent.setup();
        renderBoard();
        const [first] = cardButtons();

        await user.click(first);
        await user.click(first);
        expect(movesValue()).toBe("0");
    });

    it("mostra o cronometro zerado antes do primeiro clique", () => {
        renderBoard();
        expect(timerValue()).toBe("00:00");
    });

    it("zera jogadas e tempo ao reiniciar", async () => {
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
        await waitFor(() => expect(movesValue()).toBe("1"));

        await user.click(screen.getByRole("button", { name: "Reiniciar" }));

        await waitFor(() => {
            expect(movesValue()).toBe("0");
            expect(timerValue()).toBe("00:00");
        });
    });
});
