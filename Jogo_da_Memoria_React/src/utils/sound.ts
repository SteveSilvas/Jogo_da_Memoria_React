import { isMuted } from "./soundPreferences";

const cache = new Map<string, HTMLAudioElement>();
const playing = new Set<HTMLAudioElement>();

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

export function playSound(src: string, volume = 0.5): void {
    if (typeof window === "undefined" || isMuted()) return;
    try {
        const audio = getAudio(src, volume);
        audio.currentTime = 0;
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
