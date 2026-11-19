import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameTimer } from "./useGameTimer";

describe("useGameTimer", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("comeca parado em zero", () => {
        const { result } = renderHook(() => useGameTimer());
        expect(result.current.seconds).toBe(0);
        expect(result.current.running).toBe(false);
    });

    it("nao conta antes de start", () => {
        const { result } = renderHook(() => useGameTimer());
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(result.current.seconds).toBe(0);
    });

    it("conta um segundo por segundo apos start", () => {
        const { result } = renderHook(() => useGameTimer());
        act(() => {
            result.current.start();
        });
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(result.current.seconds).toBe(3);
    });

    it("start e idempotente e nao acelera a contagem", () => {
        const { result } = renderHook(() => useGameTimer());
        act(() => {
            result.current.start();
            result.current.start();
            result.current.start();
        });
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(result.current.seconds).toBe(2);
    });

    it("stop congela a contagem", () => {
        const { result } = renderHook(() => useGameTimer());
        act(() => {
            result.current.start();
        });
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        act(() => {
            result.current.stop();
        });
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(result.current.seconds).toBe(2);
        expect(result.current.running).toBe(false);
    });

    it("reset volta a zero e para", () => {
        const { result } = renderHook(() => useGameTimer());
        act(() => {
            result.current.start();
        });
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        act(() => {
            result.current.reset();
        });
        expect(result.current.seconds).toBe(0);
        expect(result.current.running).toBe(false);

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(result.current.seconds).toBe(0);
    });

    it("limpa o intervalo no unmount", () => {
        const clearSpy = vi.spyOn(window, "clearInterval");
        const { result, unmount } = renderHook(() => useGameTimer());
        act(() => {
            result.current.start();
        });
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        unmount();
        expect(clearSpy).toHaveBeenCalled();
        clearSpy.mockRestore();
    });
});
