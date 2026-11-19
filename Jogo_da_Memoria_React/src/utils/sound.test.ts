import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeAudio = {
    src: string;
    volume: number;
    preload: string;
    currentTime: number;
    paused: boolean;
    play: () => Promise<void>;
    pause: () => void;
};

const created: FakeAudio[] = [];
let playBehaviour: () => Promise<void> = () => Promise.resolve();

class FakeHTMLAudioElement implements FakeAudio {
    src: string;
    volume = 1;
    preload = "";
    currentTime = 0;
    paused = true;

    constructor(src = "") {
        this.src = src;
        created.push(this);
    }

    play = (): Promise<void> => {
        this.paused = false;
        return playBehaviour();
    };

    pause = (): void => {
        this.paused = true;
    };
}

const loadSoundModule = async () => {
    vi.resetModules();
    return import("./sound");
};

describe("playSound", () => {
    beforeEach(() => {
        created.length = 0;
        playBehaviour = () => Promise.resolve();
        vi.stubGlobal("Audio", FakeHTMLAudioElement);
    });

    it("reutiliza um único elemento de áudio por src", async () => {
        const { playSound } = await loadSoundModule();

        playSound("flip.mp3", 0.35);
        playSound("flip.mp3", 0.35);
        playSound("flip.mp3", 0.35);

        expect(created).toHaveLength(1);
    });

    it("cria elementos separados para sons diferentes", async () => {
        const { playSound } = await loadSoundModule();

        playSound("flip.mp3");
        playSound("match.mp3");
        playSound("win.mp3");

        expect(created).toHaveLength(3);
        expect(created.map((audio) => audio.src)).toEqual([
            "flip.mp3",
            "match.mp3",
            "win.mp3",
        ]);
    });

    it("reinicia currentTime ao reutilizar o elemento", async () => {
        const { playSound } = await loadSoundModule();

        playSound("flip.mp3");
        created[0].currentTime = 1.5;

        playSound("flip.mp3");

        expect(created[0].currentTime).toBe(0);
        expect(created).toHaveLength(1);
    });

    it("aplica o volume informado", async () => {
        const { playSound } = await loadSoundModule();

        playSound("flip.mp3", 0.35);
        playSound("flip.mp3", 0.8);

        expect(created[0].volume).toBe(0.8);
    });

    it("não interrompe a UI quando play() é bloqueado", async () => {
        playBehaviour = () => Promise.reject(new Error("NotAllowedError"));
        const { playSound } = await loadSoundModule();

        expect(() => playSound("flip.mp3")).not.toThrow();
        await Promise.resolve();
    });

    it("respeita o estado de mute", async () => {
        const { playSound, setSoundMuted, isSoundMuted } = await loadSoundModule();

        expect(isSoundMuted()).toBe(false);

        playSound("flip.mp3");
        expect(created[0].paused).toBe(false);

        setSoundMuted(true);
        expect(isSoundMuted()).toBe(true);
        expect(created[0].paused).toBe(true);

        playSound("flip.mp3");
        expect(created[0].paused).toBe(true);

        setSoundMuted(false);
        playSound("flip.mp3");
        expect(created[0].paused).toBe(false);
    });
});

describe("preloadSounds", () => {
    beforeEach(() => {
        created.length = 0;
        vi.stubGlobal("Audio", FakeHTMLAudioElement);
    });

    it("cria os elementos com preload auto sem tocar", async () => {
        const { preloadSounds } = await loadSoundModule();

        preloadSounds(["flip.mp3", "match.mp3", "win.mp3"]);

        expect(created).toHaveLength(3);
        expect(created.every((audio) => audio.preload === "auto")).toBe(true);
        expect(created.every((audio) => audio.paused)).toBe(true);
    });

    it("reaproveita elementos já carregados ao tocar", async () => {
        const { preloadSounds, playSound } = await loadSoundModule();

        preloadSounds(["flip.mp3"]);
        playSound("flip.mp3");

        expect(created).toHaveLength(1);
        expect(created[0].paused).toBe(false);
    });
});
