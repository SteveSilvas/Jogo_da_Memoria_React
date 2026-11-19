import { describe, expect, it } from "vitest";
import { formatDuration } from "./time";

describe("formatDuration", () => {
    it("formata zero como 00:00", () => {
        expect(formatDuration(0)).toBe("00:00");
    });

    it("formata segundos com dois digitos", () => {
        expect(formatDuration(5)).toBe("00:05");
        expect(formatDuration(59)).toBe("00:59");
    });

    it("vira o minuto em 60s", () => {
        expect(formatDuration(60)).toBe("01:00");
        expect(formatDuration(61)).toBe("01:01");
    });

    it("passa de dez minutos sem truncar", () => {
        expect(formatDuration(600)).toBe("10:00");
        expect(formatDuration(3599)).toBe("59:59");
        expect(formatDuration(3661)).toBe("61:01");
    });

    it("ignora fracoes de segundo", () => {
        expect(formatDuration(5.9)).toBe("00:05");
    });

    it("nao gera valores negativos", () => {
        expect(formatDuration(-10)).toBe("00:00");
    });
});
