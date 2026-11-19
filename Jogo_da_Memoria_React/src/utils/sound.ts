import { isMuted, setMuted } from "./soundPreferences";

const cache = new Map<string, HTMLAudioElement>();
const playing = new Set<HTMLAudioElement>();

const isAudioSupported = (): boolean =>
    typeof window !== "undefined" && typeof Audio !== "undefined";

const getAudio = (src: string, volume: number): HTMLAudioElement => {
    let audio = cache.get(src);
    if (!audio) {
        audio = new Audio(src);
        audio.preload = "auto";
        cache.set(src, audio);
    }
    audio.volume = volume;
    return audio;
};

export function setSoundMuted(value: boolean): void {
    setMuted(value);
    if (value) stopSound();
}

export function isSoundMuted(): boolean {
    return isMuted();
}

export function preloadSounds(sources: readonly string[]): void {
    if (!isAudioSupported()) return;
    try {
        sources.forEach((src) => getAudio(src, 0.5));
    } catch {
        /* audio indisponivel */
    }
}

export function playSound(src: string, volume = 0.5): void {
    if (!isAudioSupported() || isMuted()) return;
    try {
        const audio = getAudio(src, volume);
        try {
            // Reinicia o som do mesmo tipo; lanca se os metadados ainda nao chegaram.
            audio.currentTime = 0;
        } catch {
            /* elemento sem metadados: toca do inicio de qualquer forma */
        }
        playing.add(audio);
        void audio
            .play()
            .then(() => {
                audio.addEventListener(
                    "ended",
                    () => playing.delete(audio),
                    { once: true },
                );
            })
            .catch(() => {
                playing.delete(audio);
            });
    } catch {
        /* audio indisponivel */
    }
}

export function stopSound(): void {
    for (const audio of playing) {
        audio.pause();
        audio.currentTime = 0;
    }
    playing.clear();
}

export function stopAllSounds(): void {
    stopSound();
    for (const audio of cache.values()) {
        audio.pause();
        audio.currentTime = 0;
    }
}
