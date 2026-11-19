import { afterEach, describe, expect, it, vi } from "vitest";
import { CARD_BACK, CARD_FACES } from "../data/cardFaces";
import { buildDeck } from "./deck";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("buildDeck", () => {
    it.each([10, 20, 30, 40])("monta %i cartas", (amountCards) => {
        expect(buildDeck(amountCards)).toHaveLength(amountCards);
    });

    it("duplica cada face e usa apenas as primeiras faces do catálogo", () => {
        const deck = buildDeck(10);
        const faces = deck.map((card) => card.face);

        expect(new Set(faces).size).toBe(5);
        expect([...new Set(faces)].sort()).toEqual(CARD_FACES.slice(0, 5).sort());
        for (const face of new Set(faces)) {
            expect(faces.filter((f) => f === face)).toHaveLength(2);
        }
    });

    it("atribui ids únicos e cartas viradas para baixo", () => {
        const deck = buildDeck(20);

        expect(new Set(deck.map((card) => card.id)).size).toBe(20);
        expect(deck.map((card) => card.id).sort((a, b) => a - b)).toEqual(
            Array.from({ length: 20 }, (_, i) => i),
        );
        expect(deck.every((card) => card.flipped === false)).toBe(true);
        expect(deck.every((card) => card.matched === false)).toBe(true);
        expect(deck.every((card) => card.back === CARD_BACK)).toBe(true);
    });

    it("arredonda para baixo em quantidade ímpar de cartas", () => {
        expect(buildDeck(11)).toHaveLength(10);
    });

    it("embaralha o baralho: sorteios diferentes geram ordens diferentes", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        const first = buildDeck(10).map((card) => card.face);

        vi.spyOn(Math, "random").mockReturnValue(0.999);
        const second = buildDeck(10).map((card) => card.face);

        expect(first).not.toEqual(second);
        expect([...first].sort()).toEqual([...second].sort());
    });
});
