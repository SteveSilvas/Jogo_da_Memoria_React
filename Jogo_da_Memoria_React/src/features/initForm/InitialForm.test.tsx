import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import InitialForm from "./InitialForm";

const fillPlayer1 = (name: string) =>
    fireEvent.change(screen.getByPlaceholderText("Seu nome"), {
        target: { value: name },
    });

describe("InitialForm", () => {
    it("envia o modo 2 jogadores com os dois nomes", () => {
        const onSubmit = vi.fn();
        render(<InitialForm onSubmit={onSubmit} />);

        fillPlayer1("Ana");
        fireEvent.change(screen.getByPlaceholderText("Nome do jogador 2"), {
            target: { value: "Bia" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Jogar" }));

        expect(onSubmit).toHaveBeenCalledWith({
            player1: "Ana",
            player2: "Bia",
            amountCards: 10,
            mode: "two-players",
        });
    });

    it("escolhe o modo 1 jogador e define o computador como adversário", () => {
        const onSubmit = vi.fn();
        render(<InitialForm onSubmit={onSubmit} />);

        fireEvent.click(screen.getByRole("radio", { name: /1 jogador/i }));
        expect(
            screen.queryByPlaceholderText("Nome do jogador 2"),
        ).not.toBeInTheDocument();

        fillPlayer1("Ana");
        fireEvent.click(screen.getByRole("button", { name: "Jogar" }));

        expect(onSubmit).toHaveBeenCalledWith({
            player1: "Ana",
            player2: "Computador",
            amountCards: 10,
            mode: "single-player",
        });
    });

    it("não envia quando o nome do jogador 1 está vazio", () => {
        const onSubmit = vi.fn();
        render(<InitialForm onSubmit={onSubmit} />);

        fireEvent.click(screen.getByRole("button", { name: "Jogar" }));

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
