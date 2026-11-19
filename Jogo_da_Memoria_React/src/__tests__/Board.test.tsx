import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Board from "../features/board/Board";
import { setMuted } from "../utils/sound";

const STORAGE_KEY = "jogo-da-memoria:muted";

let created: { src: string; play: ReturnType<typeof vi.fn> }[] = [];

const installAudioStub = () => {
    created = [];
    class FakeAudio {
        src: string;
        volume = 1;
        play = vi.fn(() => Promise.resolve());
        pause = vi.fn();
        constructor(src = "") {
            this.src = src;
            created.push(this as unknown as { src: string; play: ReturnType<typeof vi.fn> });
        }
    }
    vi.stubGlobal("Audio", FakeAudio);
};

const renderBoard = () =>
    render(
        <Board player1="Ana" player2="Bia" amountCards={10} onExit={() => {}} />,
    );

const soundButton = () => screen.getByRole("button", { name: /^Som/ });

describe("Board mute control", () => {
    beforeEach(() => {
        window.localStorage.clear();
        setMuted(false);
        installAudioStub();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        window.localStorage.clear();
    });

    it("renders an unmuted sound button by default", () => {
        renderBoard();
        const button = soundButton();
        expect(button).toHaveAttribute("aria-pressed", "false");
        expect(button).toHaveTextContent("Som ligado");
    });

    it("toggles mute with a click and persists the preference", async () => {
        const user = userEvent.setup();
        renderBoard();

        await user.click(soundButton());

        expect(soundButton()).toHaveAttribute("aria-pressed", "true");
        expect(soundButton()).toHaveTextContent("Som desligado");
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

        await user.click(soundButton());

        expect(soundButton()).toHaveAttribute("aria-pressed", "false");
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
    });

    it("restores the muted preference on load", async () => {
        window.localStorage.setItem(STORAGE_KEY, "true");
        vi.resetModules();
        const { default: FreshBoard } = await import("../features/board/Board");

        render(
            <FreshBoard player1="Ana" player2="Bia" amountCards={10} onExit={() => {}} />,
        );

        expect(soundButton()).toHaveAttribute("aria-pressed", "true");
        expect(soundButton()).toHaveTextContent("Som desligado");
    });

    it("is operable by keyboard", async () => {
        const user = userEvent.setup();
        renderBoard();

        await user.tab();
        for (let i = 0; i < 12 && document.activeElement !== soundButton(); i += 1) {
            await user.tab();
        }
        expect(document.activeElement).toBe(soundButton());

        await user.keyboard("{Enter}");
        expect(soundButton()).toHaveAttribute("aria-pressed", "true");

        await user.keyboard(" ");
        expect(soundButton()).toHaveAttribute("aria-pressed", "false");
    });

    it("silences the flip sound while muted and plays again after unmuting", async () => {
        const user = userEvent.setup();
        renderBoard();

        await user.click(soundButton());
        const cards = screen.getAllByRole("button", { name: /Carta/ });
        await user.click(cards[0]);
        expect(created).toHaveLength(0);

        await user.click(soundButton());
        await user.click(cards[1]);
        expect(created.length).toBeGreaterThan(0);
    });
});
