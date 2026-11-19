const STORAGE_KEY = "jogo-da-memoria:muted";

type Listener = (muted: boolean) => void;

const listeners = new Set<Listener>();

const readInitial = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
        return false;
    }
};

let muted = readInitial();

export const isMuted = (): boolean => muted;

export const setMuted = (value: boolean): void => {
    if (muted === value) return;
    muted = value;
    try {
        window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
        /* storage bloqueado: a preferencia vale so nesta sessao */
    }
    for (const listener of listeners) listener(value);
};

export const toggleMuted = (): boolean => {
    setMuted(!muted);
    return muted;
};

export const subscribeMuted = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
