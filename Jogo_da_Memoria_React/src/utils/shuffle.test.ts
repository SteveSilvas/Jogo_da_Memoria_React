import { afterEach, describe, expect, it, vi } from "vitest";
import { shuffle } from "./shuffle";

const stubRandom = (value: number) =>
    vi.spyOn(Math, "random").mockReturnValue(value);

afterEach(() => {
    vi.restoreAllMocks();
});

describe("shuffle", () => {
    it("mantém todos os elementos da lista original", () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        const result = shuffle(items);

        expect(result).toHaveLength(items.length);
        expect([...result].sort((a, b) => a - b)).toEqual(items);
    });

    it("não altera a lista recebida e devolve uma nova lista", () => {
        const items = ["a", "b", "c", "d"];

        const result = shuffle(items);

        expect(items).toEqual(["a", "b", "c", "d"]);
        expect(result).not.toBe(items);
    });

    it("lida com listas vazias e de um elemento", () => {
        expect(shuffle([])).toEqual([]);
        expect(shuffle(["único"])).toEqual(["único"]);
    });

    it("embaralha de fato: ordens diferentes para sorteios diferentes", () => {
        const items = [1, 2, 3, 4, 5];

        stubRandom(0);
        const alwaysFirst = shuffle(items);

        stubRandom(0.999);
        const alwaysLast = shuffle(items);

        expect(alwaysFirst).toEqual([2, 3, 4, 5, 1]);
        expect(alwaysLast).toEqual([1, 2, 3, 4, 5]);
    });
});
