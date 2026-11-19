import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatTime";

describe("formatDuration", () => {
    it("formata zero como 00:00", () => {
        expect(formatDuration(0)).toBe("00:00");
    });

    it("formata segundos com dois dígitos", () => {
        expect(formatDuration(5_000)).toBe("00:05");
        expect(formatDuration(59_999)).toBe("00:59");
    });

    it("formata minutos e segundos no padrão mm:ss", () => {
        expect(formatDuration(60_000)).toBe("01:00");
        expect(formatDuration(65_000)).toBe("01:05");
        expect(formatDuration(3_600_000)).toBe("60:00");
    });

    it("não gera valores negativos", () => {
        expect(formatDuration(-1_000)).toBe("00:00");
    });
});
