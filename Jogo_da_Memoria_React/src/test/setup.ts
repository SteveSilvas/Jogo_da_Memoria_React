import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom não busca <img src> remoto, mas qualquer chamada explícita de rede
// precisa falhar para o teste não depender do ambiente.
const blockNetwork = (): never => {
    throw new Error("Testes não devem acessar a rede");
};

globalThis.fetch = blockNetwork as unknown as typeof fetch;
XMLHttpRequest.prototype.open = blockNetwork as unknown as typeof XMLHttpRequest.prototype.open;

afterEach(() => {
    cleanup();
});
