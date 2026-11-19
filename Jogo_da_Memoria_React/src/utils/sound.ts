const audioCache = new Map<string, HTMLAudioElement>();

let muted = false;

const isAudioSupported = (): boolean =>
    typeof window !== "undefined" && typeof Audio !== "undefined";

const getAudio = (src: string): HTMLAudioElement => {
    const cached = audioCache.get(src);
    if (cached) return cached;

    const audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(src, audio);
    return audio;
};

export function setSoundMuted(value: boolean): void {
    muted = value;
    if (!muted) return;

    audioCache.forEach((audio) => audio.pause());
}

export function isSoundMuted(): boolean {
    return muted;
}

export function preloadSounds(sources: readonly string[]): void {
    if (!isAudioSupported()) return;
    try {
        sources.forEach(getAudio);
    } catch {
        /* áudio indisponível */
    }
}

export function playSound(src: string, volume = 0.5): void {
    if (muted || !isAudioSupported()) return;

    try {
        const audio = getAudio(src);
        audio.volume = volume;
        try {
            // Reinicia o som do mesmo tipo; lança se os metadados ainda não chegaram.
            audio.currentTime = 0;
        } catch {
            /* elemento sem metadados: toca do início de qualquer forma */
        }
        void audio.play().catch(() => {
            /* autoplay bloqueado pelo navegador até a primeira interação */
        });
    } catch {
        /* áudio indisponível */
    }
}
