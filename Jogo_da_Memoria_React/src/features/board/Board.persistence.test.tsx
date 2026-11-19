import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Board from "./Board";
import { GAME_STORAGE_KEY, loadGame, saveGame } from "../../utils/gameStorage";

vi.mock("../../utils/sound", () => ({
    playSound: vi.fn(),
    preloadSounds: vi.fn(),
    stopSound: vi.fn(),
    stopAllSounds: vi.fn(),
    setSoundMuted: vi.fn(),
    isSoundMuted: () => false,
}));

const MATCH_DELAY = 900;

const cardButtons = () =>
    screen
        .getAllByRole("button")
        .filter((button) => button.classList.contains("Card"));

const faceOf = (button: HTMLElement) => button.getAttribute("data-face");

const renderBoard = (props: Partial<React.ComponentProps<typeof Board>> = {}) =>
    render(
        <Board
            player1="Ana"
            player2="Bruno"
            amountCards={10}
            onExit={vi.fn()}
            {...props}
        />,
    );

const pairIndexes = (): [number, number] => {
    const buttons = cardButtons();
    const seen = new Map<string, number>();
    for (let index = 0; index < buttons.length; index += 1) {
        const face = faceOf(buttons[index])!;
        const first = seen.get(face);
        if (first !== undefined) return [first, index];
        seen.set(face, index);
    }
    throw new Error("nenhum par encontrado");
};

describe("Board: persistencia da partida", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.useRealTimers();
    });

    it("salva o estado inicial ao montar", async () => {
        renderBoard();

        await waitFor(() => expect(loadGame()).not.toBeNull());
        const saved = loadGame()!;
        expect(saved.amountCards).toBe(10);
        expect(saved.cards).toHaveLength(10);
        expect(saved.players[0].name).toBe("Ana");
    });

    it("salva o par encontrado com placar e jogadas", async () => {
        const user = userEvent.setup();
        renderBoard();
        const [a, b] = pairIndexes();

        await user.click(cardButtons()[a]);
        await user.click(cardButtons()[b]);

        await waitFor(() => {
            const saved = loadGame();
            expect(saved?.players[0].score).toBe(1);
        });
        expect(loadGame()!.moves).toBe(1);
    });

    it("nao salva a jogada errada com as duas cartas abertas", async () => {
        const user = userEvent.setup();
        renderBoard();
        const buttons = cardButtons();
        const faces = buttons.map((button) => faceOf(button));
        const first = faces.findIndex(
            (face, index) => faces.indexOf(face) === index,
        );
        const second = faces.findIndex(
            (face, index) => face !== faces[first] && index !== first,
        );

        await user.click(cardButtons()[first]);
        await user.click(cardButtons()[second]);

        // Durante o intervalo em que o par errado esta aberto, o estado salvo
        // nao deve conter duas cartas reveladas.
        const saved = loadGame();
        const flipped = saved!.cards.filter((card) => card.flipped);
        expect(flipped.length).toBeLessThan(2);

        await waitFor(
            () => {
                const after = loadGame()!;
                expect(after.turn).toBe(1);
            },
            { timeout: MATCH_DELAY + 1000 },
        );
    });

    it("restaura tabuleiro, placar, vez e tempo ao remontar", async () => {
        const user = userEvent.setup();
        const { unmount } = renderBoard();
        const [a, b] = pairIndexes();

        await user.click(cardButtons()[a]);
        await user.click(cardButtons()[b]);
        await waitFor(() => expect(loadGame()!.players[0].score).toBe(1));

        const before = loadGame()!;
        const facesBefore = cardButtons().map((button) => faceOf(button));
        unmount();

        renderBoard({ restoreSaved: true });

        expect(cardButtons().map((button) => faceOf(button))).toEqual(
            facesBefore,
        );
        expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
            "Ana",
        );
        const scoreText = screen
            .getAllByRole("complementary")
            .map((element) => element.textContent)
            .join(" ");
        expect(scoreText).toContain("1");
        expect(before.players[0].score).toBe(1);
    });

    it("ignora o estado salvo quando o tabuleiro nao pediu retomada", async () => {
        saveGame({
            cards: [
                { id: 0, face: "/x.png", back: "/b.png", flipped: true, matched: false },
                { id: 1, face: "/x.png", back: "/b.png", flipped: false, matched: false },
            ],
            selected: [],
            turn: 1,
            players: [
                { name: "Ana", score: 0, pairs: [] },
                { name: "Bruno", score: 0, pairs: [] },
            ],
            moves: 0,
            seconds: 0,
            amountCards: 2,
        });

        renderBoard({ amountCards: 10 });
        expect(cardButtons()).toHaveLength(10);
        expect(
            screen.getByRole("heading", { level: 2 }).textContent,
        ).toContain("Ana");
    });

    it("limpa o estado salvo ao reiniciar", async () => {
        const user = userEvent.setup();
        renderBoard();
        const [a, b] = pairIndexes();
        await user.click(cardButtons()[a]);
        await user.click(cardButtons()[b]);
        await waitFor(() => expect(loadGame()!.players[0].score).toBe(1));

        await user.click(screen.getByRole("button", { name: "Reiniciar" }));

        await waitFor(() => {
            const saved = loadGame();
            expect(saved?.players[0].score ?? 0).toBe(0);
            expect(saved?.moves ?? 0).toBe(0);
        });
    });

    it("nao deixa partida vencida salva", async () => {
        const user = userEvent.setup();
        renderBoard({ amountCards: 2 });
        const buttons = cardButtons();

        await user.click(buttons[0]);
        await user.click(buttons[1]);

        await waitFor(() => expect(loadGame()).toBeNull());
        expect(window.localStorage.getItem(GAME_STORAGE_KEY)).toBeNull();
    });
});
