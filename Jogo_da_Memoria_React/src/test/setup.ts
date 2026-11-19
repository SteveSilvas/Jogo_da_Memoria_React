import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
});

class SilentAudio {
    volume = 1;
    pause() {}
    play() {
        return Promise.resolve();
    }
}

vi.stubGlobal("Audio", SilentAudio);
