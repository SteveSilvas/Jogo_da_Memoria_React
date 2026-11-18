let current: HTMLAudioElement | null = null;

export function playSound(src: string, volume = 0.5): void {
    if (typeof window === "undefined") return;
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
