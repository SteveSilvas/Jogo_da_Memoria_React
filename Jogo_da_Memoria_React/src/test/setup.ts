import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom nao busca <img src> remoto, mas qualquer chamada explicita de rede
// precisa falhar para o teste nao depender do ambiente.
const blockNetwork = (): never => {
    throw new Error("Testes nao devem acessar a rede");
};

globalThis.fetch = blockNetwork as unknown as typeof fetch;
XMLHttpRequest.prototype.open =
    blockNetwork as unknown as typeof XMLHttpRequest.prototype.open;

afterEach(() => {
    cleanup();
});
