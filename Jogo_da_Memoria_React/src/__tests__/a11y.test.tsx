import React, { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Board from "../features/board/Board";
import WinnerPanel from "../components/WinnerPanel/WinnerPanel";
import {
    foundCountLabel,
    pairCountLabel,
    plural,
    progressLabel,
} from "../utils/pluralize";

const PLAYER_1 = "Ana";
const PLAYER_2 = "Bia";

const renderBoard = (amountCards = 10, strict = false) => {
    const board = <Board player1={PLAYER_1} player2={PLAYER_2} amountCards={amountCards} onExit={() => {}} />;
    return render(strict ? <StrictMode>{board}</StrictMode> : board);
};

const cardButtons = () => screen.getAllByRole("button", { name: /^Carta \d+ de \d+/ });

const faceOf = (button: HTMLElement) =>
    button.querySelector(".Card-back img")?.getAttribute("src") ?? "";

const availableCards = () =>
    cardButtons().filter(
        (button) => !button.getAttribute("aria-label")?.includes("par encontrado"),
    );

const findPair = (): [HTMLElement, HTMLElement] => {
    const buttons = availableCards();
    for (let i = 0; i < buttons.length; i++) {
        for (let j = i + 1; j < buttons.length; j++) {
            if (faceOf(buttons[i]) === faceOf(buttons[j])) {
                return [buttons[i], buttons[j]];
            }
        }
    }
    throw new Error("nenhum par encontrado no tabuleiro");
};

const findMismatch = (): [HTMLElement, HTMLElement] => {
    const buttons = availableCards();
    for (let i = 0; i < buttons.length; i++) {
        for (let j = i + 1; j < buttons.length; j++) {
            if (faceOf(buttons[i]) !== faceOf(buttons[j])) {
                return [buttons[i], buttons[j]];
            }
        }
    }
    throw new Error("nenhuma carta com faces diferentes");
};

const statusRegion = () => screen.getByRole("status");

// Registra cada texto que a região anuncia, para contar quantos anúncios
// realmente chegaram ao leitor de tela.
const watchAnnouncements = () => {
    const seen: string[] = [];
    const observer = new MutationObserver(() => {
        const text = statusRegion().textContent ?? "";
        if (text.trim()) seen.push(text);
    });
    observer.observe(statusRegion(), { childList: true, subtree: true, characterData: true });
    return { seen, stop: () => observer.disconnect() };
};

describe("rotulos das cartas", () => {
    it("identifica cada carta pela posicao na grade", () => {
        renderBoard(10);
        const buttons = cardButtons();
        expect(buttons).toHaveLength(10);
        buttons.forEach((button, index) => {
            expect(button).toHaveAttribute(
                "aria-label",
                `Carta ${index + 1} de 10, virada para baixo`,
            );
        });
    });

    it("nao repete rotulos entre cartas", () => {
        renderBoard(20);
        const labels = cardButtons().map((button) => button.getAttribute("aria-label"));
        expect(new Set(labels).size).toBe(labels.length);
    });

    it("mantem as cartas focaveis para o rotulo ser anunciado", async () => {
        const user = userEvent.setup();
        renderBoard(10);
        const [first, second] = findPair();

        await user.click(first);
        await user.click(second);
        await waitFor(() =>
            expect(first.getAttribute("aria-label")).toMatch(/, par encontrado$/),
        );

        for (let i = 0; i < 20 && document.activeElement !== first; i++) {
            await user.tab();
        }
        expect(document.activeElement).toBe(first);
        expect(first).toHaveAttribute("aria-disabled", "true");
    });

    it("descreve a carta revelada e o par encontrado", async () => {
        const user = userEvent.setup();
        renderBoard(10);
        const [first] = findPair();

        await user.click(first);
        expect(first.getAttribute("aria-label")).toMatch(/, revelada$/);

        const [, second] = findPair();
        await user.click(second);

        await waitFor(() => {
            expect(first.getAttribute("aria-label")).toMatch(/, par encontrado$/);
            expect(second.getAttribute("aria-label")).toMatch(/, par encontrado$/);
        });
    });
});

describe("anuncios do estado do jogo", () => {
    it("existe uma regiao aria-live polite", () => {
        renderBoard(10);
        const region = statusRegion();
        expect(region).toHaveAttribute("aria-live", "polite");
        expect(region).toHaveClass("sr-only");
    });

    it("anuncia a troca de vez quando o jogador erra", async () => {
        const user = userEvent.setup();
        renderBoard(10);
        const [first, second] = findMismatch();

        await user.click(first);
        await user.click(second);

        await waitFor(
            () => expect(statusRegion()).toHaveTextContent(`Vez de ${PLAYER_2}.`),
            { timeout: 3000 },
        );
    });

    it("anuncia novamente quando o mesmo jogador reinicia duas vezes", async () => {
        const user = userEvent.setup();
        renderBoard(10);
        const restart = screen.getByRole("button", { name: "Reiniciar" });
        const { seen, stop } = watchAnnouncements();
        const message = `Jogo reiniciado. Vez de ${PLAYER_1}.`;

        await user.click(restart);
        await waitFor(() => expect(statusRegion()).toHaveTextContent(message));
        await user.click(restart);
        await waitFor(() =>
            expect(seen.filter((text) => text === message)).toHaveLength(2),
        );

        stop();
    });

    it("anuncia o par encontrado com o placar atualizado", async () => {
        const user = userEvent.setup();
        renderBoard(10);
        const [first, second] = findPair();

        await user.click(first);
        await user.click(second);

        await waitFor(() => {
            const text = statusRegion().textContent ?? "";
            expect(text).toContain("Par encontrado!");
            expect(text).toContain(`${PLAYER_1} tem 1 par`);
            expect(text).toContain("1 par encontrado de 5");
        });
    });

    it("nao duplica anuncios sob React.StrictMode", async () => {
        const user = userEvent.setup();
        renderBoard(10, true);
        const { seen, stop } = watchAnnouncements();
        const [first, second] = findPair();

        await user.click(first);
        await user.click(second);

        await waitFor(() => expect(statusRegion()).toHaveTextContent("Par encontrado!"));
        await new Promise((resolve) => setTimeout(resolve, 100));
        stop();

        expect(seen).toHaveLength(1);
        expect(seen[0]).toContain("Par encontrado!");
    });

    it("anuncia o fim de jogo e associa o dialogo ao titulo", async () => {
        const user = userEvent.setup();
        renderBoard(10);

        for (let i = 0; i < 5; i++) {
            const [first, second] = findPair();
            await user.click(first);
            await user.click(second);
            await waitFor(() =>
                expect(first.getAttribute("aria-label")).toMatch(/, par encontrado$/),
            );
        }

        const dialog = await screen.findByRole("dialog");
        const heading = within(dialog).getByRole("heading");
        expect(dialog).toHaveAttribute("aria-labelledby", heading.id);

        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(`Fim de jogo. Parabéns, ${PLAYER_1}!`);
        expect(alert).toHaveTextContent(`${PLAYER_1}: 5 pares, ${PLAYER_2}: 0 pares`);
    });
});

describe("WinnerPanel", () => {
    it("aponta aria-labelledby para o titulo do painel", () => {
        render(
            <WinnerPanel
                players={[
                    { name: PLAYER_1, score: 3 },
                    { name: PLAYER_2, score: 1 },
                ]}
                onRestart={() => {}}
                onNewGame={() => {}}
            />,
        );

        const dialog = screen.getByRole("dialog");
        const heading = screen.getByRole("heading", { name: `Parabéns, ${PLAYER_1}!` });
        expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
        expect(dialog).toHaveAttribute("aria-describedby");
    });

    it("anuncia empate quando os placares sao iguais", () => {
        render(
            <WinnerPanel
                players={[
                    { name: PLAYER_1, score: 2 },
                    { name: PLAYER_2, score: 2 },
                ]}
                onRestart={() => {}}
                onNewGame={() => {}}
            />,
        );

        expect(screen.getByRole("heading")).toHaveTextContent("Empate!");
    });
});

describe("pluralizacao dos anuncios", () => {
    it("usa singular e plural corretamente", () => {
        expect(plural(1, "par", "pares")).toBe("1 par");
        expect(plural(2, "par", "pares")).toBe("2 pares");
        expect(pairCountLabel(1)).toBe("1 par");
        expect(pairCountLabel(5)).toBe("5 pares");
        expect(foundCountLabel(1)).toBe("1 encontrado");
        expect(foundCountLabel(3)).toBe("3 encontrados");
        expect(progressLabel(1, 5)).toBe("1 par encontrado de 5");
        expect(progressLabel(2, 5)).toBe("2 pares encontrados de 5");
    });
});
