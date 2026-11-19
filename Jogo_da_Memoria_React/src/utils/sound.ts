import { isMuted } from "./soundPreferences";

let current: HTMLAudioElement | null = null;

export function playSound(src: string, volume = 0.5): void {
    if (typeof window === "undefined" || isMuted()) return;
    try {
        current?.pause();
        const audio = new Audio(src);
        audio.volume = volume;
        current = audio;
        void audio.play().catch(() => {
            /* autoplay bloqueado pelo navegador ate a primeira interacao */
        });
    } catch {
        /* audio indisponivel */
    }
}

export function stopSound(): void {
    current?.pause();
    current = null;
}
