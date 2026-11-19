import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom não implementa reprodução de áudio.
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => undefined;

beforeEach(() => {
    window.localStorage.clear();
});

afterEach(() => {
    cleanup();
    window.localStorage.clear();
});
