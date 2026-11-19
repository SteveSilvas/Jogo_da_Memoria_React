export const MUTED_STORAGE_KEY = "jogo-da-memoria:muted";

let current: HTMLAudioElement | null = null;

const readStoredMuted = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(MUTED_STORAGE_KEY) === "true";
    } catch {
        return false;
    }
};

let muted = readStoredMuted();

export function isMuted(): boolean {
    return muted;
}

export function setMuted(value: boolean): void {
    muted = value;
    if (muted) current?.pause();
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(MUTED_STORAGE_KEY, String(muted));
    } catch {
        /* localStorage indisponível (modo privado, cota, etc.) */
    }
}

export function toggleMuted(): boolean {
    setMuted(!muted);
    return muted;
}

export function playSound(src: string, volume = 0.5): void {
    if (typeof window === "undefined" || muted) return;
    try {
        current?.pause();
        const audio = new Audio(src);
        audio.volume = volume;
        current = audio;
        void audio.play().catch(() => {
            /* autoplay bloqueado pelo navegador até a primeira interação */
        });
    } catch {
        /* áudio indisponível */
    }
}
