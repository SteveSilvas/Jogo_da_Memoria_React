import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import Board from "./Board";

vi.mock("../../utils/sound", () => ({ playSound: vi.fn() }));

const FACE_SRC = "https://img.freepik.com/";

const renderBoard = (amountCards = 40) =>
    render(
        <Board
            player1="Ana"
            player2="Bia"
            amountCards={amountCards}
            onExit={vi.fn()}
        />,
    );

const externalFaceImages = () =>
    Array.from(document.querySelectorAll<HTMLImageElement>("img")).filter((img) =>
        (img.getAttribute("src") ?? "").startsWith(FACE_SRC),
    );

describe("Board — carregamento das faces", () => {
    afterEach(cleanup);

    it("não requisita nenhuma face externa ao abrir com 40 cartas", () => {
        renderBoard(40);

        expect(document.querySelectorAll(".Card")).toHaveLength(40);
        expect(externalFaceImages()).toHaveLength(0);
    });

    it("requisita apenas as faces das cartas reveladas durante o jogo", () => {
        renderBoard(40);
        const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".Card"));

        fireEvent.click(cards[0]);
        fireEvent.click(cards[1]);

        expect(externalFaceImages()).toHaveLength(2);
    });
});
