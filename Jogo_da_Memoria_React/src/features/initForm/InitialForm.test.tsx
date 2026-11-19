import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InitialForm from "./InitialForm";
import { loadGame, saveGame } from "../../utils/gameStorage";

const savedGame = () =>
    saveGame({
        cards: [
            { id: 0, face: "/a.png", back: "/b.png", flipped: true, matched: true },
            { id: 1, face: "/a.png", back: "/b.png", flipped: true, matched: true },
            { id: 2, face: "/c.png", back: "/b.png", flipped: false, matched: false },
            { id: 3, face: "/c.png", back: "/b.png", flipped: false, matched: false },
        ],
        selected: [],
        turn: 1,
        players: [
            { name: "Ana", score: 1, pairs: ["/a.png"] },
            { name: "Bruno", score: 0, pairs: [] },
        ],
        moves: 4,
        seconds: 75,
        amountCards: 4,
    });

describe("InitialForm: partida salva", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("nao mostra o bloco de retomada sem partida salva", () => {
        render(<InitialForm onSubmit={vi.fn()} onResume={vi.fn()} />);
        expect(
            screen.queryByText(/Partida em andamento/i),
        ).not.toBeInTheDocument();
    });

    it("mostra um resumo da partida salva", () => {
        savedGame();
        render(<InitialForm onSubmit={vi.fn()} onResume={vi.fn()} />);

        expect(screen.getByText(/Partida em andamento/i)).toBeInTheDocument();
        expect(screen.getByText(/Ana e Bruno/)).toBeInTheDocument();
        expect(screen.getByText(/1 de 2 pares/)).toBeInTheDocument();
        expect(screen.getByText(/01:15/)).toBeInTheDocument();
    });

    it("retoma a partida com os mesmos jogadores e tamanho", async () => {
        const user = userEvent.setup();
        const onResume = vi.fn();
        savedGame();
        render(<InitialForm onSubmit={vi.fn()} onResume={onResume} />);

        await user.click(
            screen.getByRole("button", { name: /Continuar partida/i }),
        );

        expect(onResume).toHaveBeenCalledWith({
            player1: "Ana",
            player2: "Bruno",
            amountCards: 4,
        });
    });

    it("descarta a partida salva e some com o bloco", async () => {
        const user = userEvent.setup();
        savedGame();
        render(<InitialForm onSubmit={vi.fn()} onResume={vi.fn()} />);

        await user.click(
            screen.getByRole("button", { name: /Descartar e começar do zero/i }),
        );

        expect(
            screen.queryByText(/Partida em andamento/i),
        ).not.toBeInTheDocument();
        expect(loadGame()).toBeNull();
    });

    it("nao oferece retomada sem callback, mas permite descartar", () => {
        savedGame();
        render(<InitialForm onSubmit={vi.fn()} />);

        expect(
            screen.queryByRole("button", { name: /Continuar partida/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Descartar e começar do zero/i }),
        ).toBeInTheDocument();
    });

    it("inicia jogo novo com os nomes digitados", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        savedGame();
        render(<InitialForm onSubmit={onSubmit} onResume={vi.fn()} />);

        const inputs = screen.getAllByRole("textbox");
        await user.type(inputs[0], "Carla");
        await user.type(inputs[1], "Davi");
        await user.click(screen.getByRole("button", { name: "Jogar" }));

        expect(onSubmit).toHaveBeenCalledWith({
            player1: "Carla",
            player2: "Davi",
            amountCards: 10,
            mode: "two-players",
        });
    });
});

describe("InitialForm: modo de jogo", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("comeca em 2 jogadores, com os dois campos de nome", () => {
        render(<InitialForm onSubmit={vi.fn()} onResume={vi.fn()} />);

        expect(screen.getAllByRole("textbox")).toHaveLength(2);
        expect(screen.getByRole("radio", { name: /2 jogadores/i })).toBeChecked();
    });

    it("esconde o nome do jogador 2 no modo 1 jogador", async () => {
        const user = userEvent.setup();
        render(<InitialForm onSubmit={vi.fn()} onResume={vi.fn()} />);

        await user.click(screen.getByRole("radio", { name: /1 jogador/i }));

        expect(screen.getAllByRole("textbox")).toHaveLength(1);
        expect(
            document.querySelector(".Field-soloNote")?.textContent,
        ).toContain("Computador");
    });

    it("envia o computador como adversario no modo 1 jogador", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<InitialForm onSubmit={onSubmit} onResume={vi.fn()} />);

        await user.click(screen.getByRole("radio", { name: /1 jogador/i }));
        await user.type(screen.getByRole("textbox"), "Ana");
        await user.click(screen.getByRole("button", { name: "Jogar" }));

        expect(onSubmit).toHaveBeenCalledWith({
            player1: "Ana",
            player2: "Computador",
            amountCards: 10,
            mode: "single-player",
        });
    });

    it("nao envia nada sem o nome do jogador 1", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<InitialForm onSubmit={onSubmit} onResume={vi.fn()} />);

        await user.click(screen.getByRole("radio", { name: /1 jogador/i }));
        await user.click(screen.getByRole("button", { name: "Jogar" }));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("volta a exigir o nome do jogador 2 ao trocar de modo", async () => {
        const user = userEvent.setup();
        render(<InitialForm onSubmit={vi.fn()} onResume={vi.fn()} />);

        await user.click(screen.getByRole("radio", { name: /1 jogador/i }));
        await user.click(screen.getByRole("radio", { name: /2 jogadores/i }));

        expect(screen.getAllByRole("textbox")).toHaveLength(2);
    });
});
