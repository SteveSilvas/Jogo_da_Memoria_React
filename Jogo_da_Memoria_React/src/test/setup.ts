import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom não implementa reprodução de áudio; evita ruído de "Not implemented".
Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: vi.fn(),
});
