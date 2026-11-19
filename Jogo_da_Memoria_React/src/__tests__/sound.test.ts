import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "jogo-da-memoria:muted";

type FakeAudioInstance = {
    src: string;
    volume: number;
    paused: boolean;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
};

let created: FakeAudioInstance[] = [];

const installAudioStub = () => {
    created = [];
    class FakeAudio implements FakeAudioInstance {
        src: string;
        volume = 1;
        paused = false;
        play = vi.fn(() => Promise.resolve());
        pause = vi.fn(() => {
            this.paused = true;
        });
        constructor(src = "") {
            this.src = src;
            created.push(this as unknown as FakeAudioInstance);
        }
    }
    vi.stubGlobal("Audio", FakeAudio);
};

const loadSoundModule = async () => {
    vi.resetModules();
    return import("../utils/sound");
};

describe("sound utils", () => {
    beforeEach(() => {
        window.localStorage.clear();
        installAudioStub();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        window.localStorage.clear();
    });

    it("plays sound when not muted", async () => {
        const sound = await loadSoundModule();
        expect(sound.isMuted()).toBe(false);

        sound.playSound("flip.mp3", 0.35);

        expect(created).toHaveLength(1);
        expect(created[0].src).toBe("flip.mp3");
        expect(created[0].volume).toBe(0.35);
        expect(created[0].play).toHaveBeenCalledTimes(1);
    });

    it("does not play anything while muted", async () => {
        const sound = await loadSoundModule();
        sound.setMuted(true);
        expect(sound.isMuted()).toBe(true);

        sound.playSound("flip.mp3", 0.35);

        expect(created).toHaveLength(0);
    });

    it("plays again after unmuting", async () => {
        const sound = await loadSoundModule();
        sound.setMuted(true);
        sound.playSound("flip.mp3");
        expect(created).toHaveLength(0);

        sound.setMuted(false);
        sound.playSound("match.mp3", 0.5);

        expect(created).toHaveLength(1);
        expect(created[0].play).toHaveBeenCalledTimes(1);
    });

    it("pauses the current audio when muting", async () => {
        const sound = await loadSoundModule();
        sound.playSound("win.mp3", 0.45);
        expect(created[0].paused).toBe(false);

        sound.setMuted(true);

        expect(created[0].pause).toHaveBeenCalled();
        expect(created[0].paused).toBe(true);
    });

    it("persists the preference to localStorage", async () => {
        const sound = await loadSoundModule();
        sound.setMuted(true);
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

        sound.setMuted(false);
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
    });

    it("restores the preference on load", async () => {
        window.localStorage.setItem(STORAGE_KEY, "true");
        const sound = await loadSoundModule();
        expect(sound.isMuted()).toBe(true);

        sound.playSound("flip.mp3");
        expect(created).toHaveLength(0);
    });

    it("toggles and returns the new state", async () => {
        const sound = await loadSoundModule();
        expect(sound.toggleMuted()).toBe(true);
        expect(sound.isMuted()).toBe(true);
        expect(sound.toggleMuted()).toBe(false);
        expect(sound.isMuted()).toBe(false);
    });

    it("defaults to unmuted when localStorage holds garbage", async () => {
        window.localStorage.setItem(STORAGE_KEY, "talvez");
        const sound = await loadSoundModule();
        expect(sound.isMuted()).toBe(false);
    });
});
