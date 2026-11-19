import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
});

// As imagens das cartas sao externas; nenhum teste deve depender de rede.
vi.mock("../utils/sound", () => ({ playSound: vi.fn() }));
