import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "jogo-da-memoria:muted";

const loadModule = async () => {
    vi.resetModules();
    return import("./soundPreferences");
};

describe("soundPreferences", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("comeca com som ligado quando nao ha preferencia salva", async () => {
        const { isMuted } = await loadModule();
        expect(isMuted()).toBe(false);
    });

    it("le a preferencia salva", async () => {
        window.localStorage.setItem(STORAGE_KEY, "true");
        const { isMuted } = await loadModule();
        expect(isMuted()).toBe(true);
    });

    it("persiste ao silenciar e ao reativar", async () => {
        const { setMuted } = await loadModule();

        setMuted(true);
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

        setMuted(false);
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
    });

    it("alterna o estado", async () => {
        const { toggleMuted, isMuted } = await loadModule();

        expect(toggleMuted()).toBe(true);
        expect(isMuted()).toBe(true);
        expect(toggleMuted()).toBe(false);
        expect(isMuted()).toBe(false);
    });

    it("notifica os assinantes a cada mudanca", async () => {
        const { setMuted, subscribeMuted } = await loadModule();
        const listener = vi.fn();
        subscribeMuted(listener);

        setMuted(true);
        expect(listener).toHaveBeenCalledWith(true);

        setMuted(false);
        expect(listener).toHaveBeenCalledWith(false);
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("nao notifica quando o valor nao muda", async () => {
        const { setMuted, subscribeMuted } = await loadModule();
        const listener = vi.fn();
        subscribeMuted(listener);

        setMuted(false);
        expect(listener).not.toHaveBeenCalled();
    });

    it("cancela a inscricao", async () => {
        const { setMuted, subscribeMuted } = await loadModule();
        const listener = vi.fn();
        const unsubscribe = subscribeMuted(listener);

        unsubscribe();
        setMuted(true);
        expect(listener).not.toHaveBeenCalled();
    });

    it("sobrevive a storage indisponivel", async () => {
        const { setMuted, isMuted } = await loadModule();
        const setItem = vi
            .spyOn(Storage.prototype, "setItem")
            .mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });

        expect(() => setMuted(true)).not.toThrow();
        expect(isMuted()).toBe(true);
        setItem.mockRestore();
    });
});
