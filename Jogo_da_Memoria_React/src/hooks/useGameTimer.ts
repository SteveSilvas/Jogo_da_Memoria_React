import { useCallback, useEffect, useRef, useState } from "react";

type GameTimer = {
    seconds: number;
    running: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
};

export const useGameTimer = (): GameTimer => {
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const clearIntervalRef = useCallback(() => {
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => clearIntervalRef, [clearIntervalRef]);

    useEffect(() => {
        if (!running) {
            clearIntervalRef();
            return;
        }
        intervalRef.current = window.setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);
        return clearIntervalRef;
    }, [running, clearIntervalRef]);

    const start = useCallback(() => {
        setRunning((prev) => (prev ? prev : true));
    }, []);

    const stop = useCallback(() => {
        setRunning(false);
        clearIntervalRef();
    }, [clearIntervalRef]);

    const reset = useCallback(() => {
        setRunning(false);
        clearIntervalRef();
        setSeconds(0);
    }, [clearIntervalRef]);

    return { seconds, running, start, stop, reset };
};
