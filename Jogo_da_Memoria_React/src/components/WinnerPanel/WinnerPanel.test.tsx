import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WinnerPanel from "./WinnerPanel";

const players = [
    { name: "Ana", score: 3 },
    { name: "Bruno", score: 2 },
];

const renderPanel = (overrides: Partial<Parameters<typeof WinnerPanel>[0]> = {}) => {
    const onRestart = vi.fn();
    const onNewGame = vi.fn();
    const utils = render(
        <WinnerPanel
            players={players}
            onRestart={onRestart}
            onNewGame={onNewGame}
            {...overrides}
        />,
    );
    return { ...utils, onRestart, onNewGame };
};

describe("WinnerPanel", () => {
    it("anuncia o vencedor e o placar", () => {
        renderPanel();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { level: 2 }).textContent,
        ).toContain("Ana");
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("mostra empate quando os placares sao iguais", () => {
        renderPanel({
            players: [
                { name: "Ana", score: 2 },
                { name: "Bruno", score: 2 },
            ],
        });
        expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
            "Empate",
        );
    });

    it("liga o dialogo ao titulo por aria-labelledby", () => {
        renderPanel();
        const dialog = screen.getByRole("dialog");
        const id = dialog.getAttribute("aria-labelledby");
        expect(id).toBeTruthy();
        expect(document.getElementById(id!)).toBe(
            screen.getByRole("heading", { level: 2 }),
        );
        expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("move o foco para o botao primario ao abrir", () => {
        renderPanel();
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Jogar de novo" }),
        );
    });

    it("devolve o foco ao elemento anterior ao fechar", async () => {
        const user = userEvent.setup();
        const trigger = document.createElement("button");
        trigger.textContent = "abrir";
        document.body.appendChild(trigger);
        trigger.focus();
        expect(document.activeElement).toBe(trigger);

        const { unmount } = renderPanel();
        expect(document.activeElement).not.toBe(trigger);

        unmount();
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
    });

    it("Tab no ultimo elemento volta para o primeiro", async () => {
        const user = userEvent.setup();
        renderPanel();

        const primary = screen.getByRole("button", { name: "Jogar de novo" });
        const ghost = screen.getByRole("button", { name: "Novo jogo" });
        expect(document.activeElement).toBe(primary);

        await user.tab();
        expect(document.activeElement).toBe(ghost);

        await user.tab();
        expect(document.activeElement).toBe(primary);
    });

    it("Shift+Tab no primeiro elemento vai para o ultimo", async () => {
        const user = userEvent.setup();
        renderPanel();

        const primary = screen.getByRole("button", { name: "Jogar de novo" });
        const ghost = screen.getByRole("button", { name: "Novo jogo" });
        expect(document.activeElement).toBe(primary);

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(ghost);
    });

    it("ESC dispara onNewGame", async () => {
        const user = userEvent.setup();
        const { onNewGame } = renderPanel();

        await user.keyboard("{Escape}");
        expect(onNewGame).toHaveBeenCalledTimes(1);
    });

    it("chama onRestart ao clicar em Jogar de novo", async () => {
        const user = userEvent.setup();
        const { onRestart } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Jogar de novo" }));
        expect(onRestart).toHaveBeenCalledTimes(1);
    });

    it("chama onNewGame ao clicar em Novo jogo", async () => {
        const user = userEvent.setup();
        const { onNewGame } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Novo jogo" }));
        expect(onNewGame).toHaveBeenCalledTimes(1);
    });

    it("nao sequestra o foco do resto da pagina enquanto aberto", async () => {
        const user = userEvent.setup();
        renderPanel();
        const primary = screen.getByRole("button", { name: "Jogar de novo" });
        const ghost = screen.getByRole("button", { name: "Novo jogo" });

        for (let i = 0; i < 6; i += 1) {
            await user.tab();
            expect([primary, ghost]).toContain(document.activeElement);
        }
    });
});
