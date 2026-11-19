import React, { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WinnerPanel from "./WinnerPanel";

const players = [
    { name: "Ana", score: 3 },
    { name: "Bia", score: 1 },
];

type HarnessProps = {
    onNewGame?: () => void;
    onRestart?: () => void;
    useReturnFocusRef?: boolean;
};

const Harness = ({ onNewGame, onRestart, useReturnFocusRef }: HarnessProps) => {
    const [open, setOpen] = useState(false);
    const preferredRef = useRef<HTMLButtonElement>(null);

    return (
        <div>
            <button onClick={() => setOpen(true)}>Abrir resultado</button>
            <button ref={preferredRef}>Destino preferido</button>
            <button onClick={() => setOpen(true)}>Abrir pelo segundo</button>
            {!open && (
                <button onClick={() => setOpen(true)}>Abrir e desaparecer</button>
            )}
            {open && (
                <WinnerPanel
                    players={players}
                    onRestart={
                        onRestart ??
                        (() => {
                            setOpen(false);
                        })
                    }
                    onNewGame={
                        onNewGame ??
                        (() => {
                            setOpen(false);
                        })
                    }
                    returnFocusTo={useReturnFocusRef ? preferredRef : undefined}
                />
            )}
        </div>
    );
};

const openPanel = async (name = "Abrir resultado") => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name }));
    return user;
};

describe("WinnerPanel (modal)", () => {
    it("move o foco para o botão primário ao abrir", async () => {
        render(<Harness />);
        await openPanel();

        const primary = screen.getByRole("button", { name: "Jogar de novo" });
        await waitFor(() => expect(document.activeElement).toBe(primary));
    });

    it("mantém Tab dentro do painel e volta ao primeiro elemento no fim", async () => {
        render(<Harness />);
        const user = await openPanel();

        const novoJogo = screen.getByRole("button", { name: "Novo jogo" });
        const jogarDeNovo = screen.getByRole("button", { name: "Jogar de novo" });
        expect(document.activeElement).toBe(jogarDeNovo);

        await user.tab();
        expect(document.activeElement).toBe(novoJogo);

        await user.tab();
        expect(document.activeElement).toBe(jogarDeNovo);
    });

    it("mantém Shift+Tab dentro do painel e volta ao último elemento", async () => {
        render(<Harness />);
        const user = await openPanel();

        const novoJogo = screen.getByRole("button", { name: "Novo jogo" });
        const jogarDeNovo = screen.getByRole("button", { name: "Jogar de novo" });
        expect(document.activeElement).toBe(jogarDeNovo);

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(novoJogo);

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(jogarDeNovo);
    });

    it("traz o foco de volta para o painel quando ele escapou para trás do overlay", async () => {
        render(<Harness />);
        const user = await openPanel();

        const novoJogo = screen.getByRole("button", { name: "Novo jogo" });
        screen.getByRole("button", { name: "Abrir resultado" }).focus();
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Abrir resultado" }),
        );

        await user.tab();
        expect(document.activeElement).toBe(novoJogo);
    });

    it("ESC dispara onNewGame", async () => {
        const onNewGame = vi.fn();
        render(<Harness onNewGame={onNewGame} />);
        const user = await openPanel();

        await user.keyboard("{Escape}");
        expect(onNewGame).toHaveBeenCalledTimes(1);
    });

    it("restaura o foco ao elemento que abriu o painel ao fechar", async () => {
        render(<Harness />);
        const user = await openPanel("Abrir pelo segundo");
        const opener = screen.getByRole("button", { name: "Abrir pelo segundo" });

        await user.keyboard("{Escape}");

        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
        expect(document.activeElement).toBe(opener);
    });

    it("usa returnFocusTo quando o elemento de origem desapareceu", async () => {
        render(<Harness useReturnFocusRef />);
        const user = await openPanel("Abrir e desaparecer");

        await user.keyboard("{Escape}");

        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Destino preferido" }),
        );
    });

    it("expõe papel de diálogo modal com rótulo acessível", async () => {
        render(<Harness />);
        await openPanel();

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toHaveAccessibleName(/Parabéns, Ana!/);
    });

    it("mantém os botões Novo jogo e Jogar de novo funcionando", async () => {
        const onNewGame = vi.fn();
        const onRestart = vi.fn();
        render(<Harness onNewGame={onNewGame} onRestart={onRestart} />);

        const user = await openPanel();
        await user.click(screen.getByRole("button", { name: "Jogar de novo" }));
        expect(onRestart).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: "Novo jogo" }));
        expect(onNewGame).toHaveBeenCalledTimes(1);
    });
});
