import { beforeEach, describe, expect, it, vi } from "vitest";

const created: FakeAudio[] = [];

class FakeAudio {
    src: string;
    volume = 1;
    preload = "";
    currentTime = 0;
    paused = true;
    listeners: Record<string, (() => void)[]> = {};
    playCalls = 0;
    pauseCalls = 0;
    shouldReject = false;

    constructor(src: string) {
        this.src = src;
        created.push(this);
    }

    play() {
        this.playCalls += 1;
        this.paused = false;
        if (this.shouldReject) {
            return Promise.reject(new Error("NotAllowedError"));
        }
        return Promise.resolve();
    }

    pause() {
        this.pauseCalls += 1;
        this.paused = true;
    }

    addEventListener(type: string, handler: () => void) {
        this.listeners[type] = [...(this.listeners[type] ?? []), handler];
    }

    emit(type: string) {
        for (const handler of this.listeners[type] ?? []) handler();
    }
}

const loadSound = async () => {
    vi.resetModules();
    vi.stubGlobal("Audio", FakeAudio);
    const prefs = await import("./soundPreferences");
    prefs.setMuted(false);
    return import("./sound");
};

describe("playSound", () => {
    beforeEach(() => {
        created.length = 0;
    });

    it("cria apenas um elemento por src, mesmo tocando varias vezes", async () => {
        const { playSound } = await loadSound();

        playSound("/flip.mp3");
        playSound("/flip.mp3");
        playSound("/flip.mp3");

        expect(created).toHaveLength(1);
        expect(created[0].playCalls).toBe(3);
    });

    it("cria elementos distintos para sons distintos", async () => {
        const { playSound } = await loadSound();

        playSound("/flip.mp3");
        playSound("/match.mp3");
        playSound("/win.mp3");

        expect(created).toHaveLength(3);
        expect(created.map((a) => a.src)).toEqual([
            "/flip.mp3",
            "/match.mp3",
            "/win.mp3",
        ]);
    });

    it("reseta currentTime antes de tocar de novo", async () => {
        const { playSound } = await loadSound();

        playSound("/flip.mp3");
        const audio = created[0];
        audio.currentTime = 1.7;

        playSound("/flip.mp3");
        expect(audio.currentTime).toBe(0);
    });

    it("aplica o volume informado", async () => {
        const { playSound } = await loadSound();

        playSound("/flip.mp3", 0.35);
        expect(created[0].volume).toBe(0.35);
    });

    it("nao toca quando o som esta desligado", async () => {
        const { playSound } = await loadSound();
        const prefs = await import("./soundPreferences");
        prefs.setMuted(true);

        playSound("/flip.mp3");
        expect(created).toHaveLength(0);
    });

    it("nao propaga rejeicao do autoplay bloqueado", async () => {
        const { playSound } = await loadSound();
        const original = globalThis.Audio;
        vi.stubGlobal(
            "Audio",
            class extends FakeAudio {
                constructor(src: string) {
                    super(src);
                    this.shouldReject = true;
                }
            },
        );

        expect(() => playSound("/flip.mp3")).not.toThrow();
        await Promise.resolve();
        vi.stubGlobal("Audio", original);
    });

    it("stopSound pausa o que esta tocando", async () => {
        const { playSound, stopSound } = await loadSound();

        playSound("/flip.mp3");
        await Promise.resolve();
        stopSound();

        expect(created[0].pauseCalls).toBeGreaterThan(0);
        expect(created[0].paused).toBe(true);
    });

    it("para de rastrear o audio quando termina", async () => {
        const { playSound, stopSound } = await loadSound();

        playSound("/flip.mp3");
        await Promise.resolve();
        const audio = created[0];
        audio.emit("ended");

        stopSound();
        expect(audio.pauseCalls).toBe(0);
    });
});
