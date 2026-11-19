import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FakeAudio = {
    src: string;
    volume: number;
    currentTime: number;
    paused: boolean;
    play: () => Promise<void>;
    pause: () => void;
};

const created: FakeAudio[] = [];

class FakeHTMLAudioElement implements FakeAudio {
    src: string;
    volume = 1;
    currentTime = 0;
    paused = true;

    constructor(src = "") {
        this.src = src;
        created.push(this);
    }

    play = (): Promise<void> => {
        this.paused = false;
        return Promise.resolve();
    };

    pause = (): void => {
        this.paused = true;
    };
}

let container: HTMLDivElement;
let root: Root;

const loadBoard = async () => {
    vi.resetModules();
    return (await import("./Board")).default;
};

const renderBoard = async (Board: React.ComponentType<any>) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root.render(
            <Board
                player1="Ana"
                player2="Bia"
                amountCards={40}
                onExit={() => {}}
            />,
        );
    });
};

const clickCard = (index: number) => {
    const cards = container.querySelectorAll<HTMLButtonElement>("button.Card");
    act(() => {
        cards[index].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
};

const isFlipSound = (audio: FakeAudio) => audio.src.includes("transition");

describe("Board sounds", () => {
    beforeEach(() => {
        created.length = 0;
        vi.stubGlobal("Audio", FakeHTMLAudioElement);
        vi.useFakeTimers();
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.useRealTimers();
    });

    it("cria apenas um elemento de áudio por som mesmo com muitos cliques", async () => {
        await renderBoard(await loadBoard());

        // Os 3 sons são pré-carregados uma única vez.
        expect(created).toHaveLength(3);

        for (let i = 0; i < 10; i += 1) {
            clickCard(i);
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        expect(created).toHaveLength(3);
    });

    it("toca o som de virar carta ao clicar em uma carta", async () => {
        await renderBoard(await loadBoard());
        const flipAudio = created.find(isFlipSound);

        expect(flipAudio?.paused).toBe(true);

        clickCard(0);

        expect(flipAudio?.paused).toBe(false);
    });
});
