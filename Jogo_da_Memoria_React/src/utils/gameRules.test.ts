import { describe, expect, it } from "vitest";
import { CARD_FACES } from "../data/cardFaces";
import { shuffle } from "./shuffle";
import {
    buildDeck,
    countMatchedPairs,
    isGameOver,
    isMatch,
    nextTurn,
} from "./gameRules";

describe("shuffle", () => {
    it("mantem todos os elementos", () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8];
        const result = shuffle(input);
        expect(result).toHaveLength(input.length);
        expect([...result].sort()).toEqual([...input].sort());
    });

    it("nao muta o array original", () => {
        const input = [1, 2, 3, 4, 5];
        const copy = [...input];
        shuffle(input);
        expect(input).toEqual(copy);
    });

    it("produz ordens diferentes ao longo de varias execucoes", () => {
        const input = Array.from({ length: 20 }, (_, i) => i);
        const orders = new Set(
            Array.from({ length: 25 }, () => shuffle(input).join(",")),
        );
        expect(orders.size).toBeGreaterThan(1);
    });
});

describe("buildDeck", () => {
    it("cria a quantidade de cartas pedida", () => {
        expect(buildDeck(10)).toHaveLength(10);
        expect(buildDeck(20)).toHaveLength(20);
        expect(buildDeck(40)).toHaveLength(40);
    });

    it("duplica cada face exatamente duas vezes", () => {
        const deck = buildDeck(20);
        const counts = new Map<string, number>();
        for (const card of deck) {
            counts.set(card.face, (counts.get(card.face) ?? 0) + 1);
        }
        expect(counts.size).toBe(10);
        for (const count of counts.values()) {
            expect(count).toBe(2);
        }
    });

    it("usa apenas faces conhecidas", () => {
        const deck = buildDeck(40);
        for (const card of deck) {
            expect(CARD_FACES).toContain(card.face);
        }
    });

    it("inicia com todas as cartas viradas para baixo e sem par", () => {
        const deck = buildDeck(20);
        expect(deck.every((card) => !card.flipped && !card.matched)).toBe(true);
    });

    it("gera ids unicos", () => {
        const deck = buildDeck(40);
        expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
    });

    it("embaralha (a ordem nao e a de criacao)", () => {
        const orders = new Set(
            Array.from({ length: 25 }, () =>
                buildDeck(20).map((card) => card.face).join(","),
            ),
        );
        expect(orders.size).toBeGreaterThan(1);
    });
});

describe("isMatch", () => {
    it("retorna true para a mesma face", () => {
        const deck = buildDeck(10);
        const [first, second] = deck;
        const twin = deck.find(
            (card) => card.face === first.face && card.id !== first.id,
        )!;
        expect(isMatch(first, twin)).toBe(true);
        expect(second).toBeDefined();
    });

    it("retorna false para faces diferentes", () => {
        const deck = buildDeck(10);
        const first = deck[0];
        const other = deck.find((card) => card.face !== first.face)!;
        expect(isMatch(first, other)).toBe(false);
    });
});

describe("countMatchedPairs", () => {
    it("conta pares, nao cartas", () => {
        const deck = buildDeck(10);
        expect(countMatchedPairs(deck)).toBe(0);

        const first = deck[0];
        const twin = deck.find((c) => c.face === first.face && c.id !== first.id)!;
        const marked = deck.map((card) =>
            card.id === first.id || card.id === twin.id
                ? { ...card, matched: true }
                : card,
        );
        expect(countMatchedPairs(marked)).toBe(1);
    });
});

describe("isGameOver", () => {
    it("e falso no inicio da partida", () => {
        expect(isGameOver(buildDeck(10))).toBe(false);
    });

    it("e falso com apenas parte dos pares encontrados", () => {
        const deck = buildDeck(10);
        const first = deck[0];
        const twin = deck.find((c) => c.face === first.face && c.id !== first.id)!;
        const partial = deck.map((card) =>
            card.id === first.id || card.id === twin.id
                ? { ...card, matched: true }
                : card,
        );
        expect(isGameOver(partial)).toBe(false);
    });

    it("e verdadeiro quando todas as cartas estao encontradas", () => {
        const deck = buildDeck(10).map((card) => ({ ...card, matched: true }));
        expect(isGameOver(deck)).toBe(true);
    });

    it("e falso para baralho vazio", () => {
        expect(isGameOver([])).toBe(false);
    });
});

describe("nextTurn", () => {
    it("alterna entre os dois jogadores", () => {
        expect(nextTurn(0)).toBe(1);
        expect(nextTurn(1)).toBe(0);
    });
});
