import { describe, expect, it } from "vitest";
import CardType from "../@Types/CardType";
import {
    hideCards,
    initialPlayers,
    isBoardComplete,
    isDraw,
    isMatch,
    markMatched,
    nextTurn,
    Player,
    resolveSelection,
    revealCards,
    scorePair,
} from "./gameRules";

const card = (id: number, face: string): CardType => ({
    id,
    face,
    back: "back.svg",
    flipped: false,
    matched: false,
});

const deck: CardType[] = [
    card(0, "alien"),
    card(1, "ufo"),
    card(2, "alien"),
    card(3, "ufo"),
];

describe("initialPlayers", () => {
    it("cria dois jogadores com placar zerado", () => {
        const players = initialPlayers("Ana", "Bia");

        expect(players).toEqual([
            { name: "Ana", score: 0, pairs: [] },
            { name: "Bia", score: 0, pairs: [] },
        ]);
    });
});

describe("nextTurn", () => {
    it("alterna entre os jogadores", () => {
        expect(nextTurn(0)).toBe(1);
        expect(nextTurn(1)).toBe(0);
    });
});

describe("isMatch", () => {
    it("compara as faces das cartas", () => {
        expect(isMatch(card(0, "alien"), card(2, "alien"))).toBe(true);
        expect(isMatch(card(0, "alien"), card(1, "ufo"))).toBe(false);
    });
});

describe("revealCards / hideCards", () => {
    it("vira apenas as cartas indicadas sem mutar a lista original", () => {
        const revealed = revealCards(deck, [0]);

        expect(revealed[0].flipped).toBe(true);
        expect(revealed.slice(1).every((c) => c.flipped === false)).toBe(true);
        expect(deck[0].flipped).toBe(false);
    });

    it("desvira apenas as cartas indicadas", () => {
        const revealed = revealCards(deck, [0, 1]);

        const hidden = hideCards(revealed, [0, 1]);

        expect(hidden.every((c) => c.flipped === false)).toBe(true);
        expect(revealed[0].flipped).toBe(true);
    });

    it("não mexe em cartas já marcadas como par", () => {
        const matched = markMatched(deck, [0, 2]);

        expect(matched[0]).toMatchObject({ matched: true, flipped: true });
        expect(matched[2]).toMatchObject({ matched: true, flipped: true });
        expect(matched[1]).toMatchObject({ matched: false, flipped: false });
    });
});

describe("scorePair", () => {
    it("soma um ponto e registra o par do jogador da vez", () => {
        const players = initialPlayers("Ana", "Bia");

        const afterFirst = scorePair(players, 0, "alien");
        const afterSecond = scorePair(afterFirst, 1, "ufo");

        expect(afterSecond[0]).toMatchObject({ score: 1, pairs: ["alien"] });
        expect(afterSecond[1]).toMatchObject({ score: 1, pairs: ["ufo"] });
        expect(players[0].score).toBe(0);
    });
});

describe("resolveSelection", () => {
    const players = initialPlayers("Ana", "Bia");

    it("marca o par e pontua para quem está jogando quando as faces batem", () => {
        const outcome = resolveSelection(deck, [0, 2], players, 0);

        expect(outcome.kind).toBe("match");
        if (outcome.kind !== "match") return;
        expect(outcome.cards[0].matched).toBe(true);
        expect(outcome.cards[2].matched).toBe(true);
        expect(outcome.players[0].score).toBe(1);
        expect(outcome.players[1].score).toBe(0);
    });

    it("não pontua quando as faces são diferentes", () => {
        expect(resolveSelection(deck, [0, 1], players, 0)).toEqual({ kind: "miss" });
    });

    it("trata ids inexistentes como erro", () => {
        expect(resolveSelection(deck, [0, 99], players, 0)).toEqual({ kind: "miss" });
    });
});

describe("isBoardComplete", () => {
    it("é falso enquanto existir carta sem par", () => {
        expect(isBoardComplete(deck)).toBe(false);
    });

    it("é falso para um tabuleiro vazio", () => {
        expect(isBoardComplete([])).toBe(false);
    });

    it("é verdadeiro quando todas as cartas foram encontradas", () => {
        expect(isBoardComplete(markMatched(deck, [0, 1, 2, 3]))).toBe(true);
    });
});

describe("isDraw", () => {
    const player = (score: number): Player => ({ name: "x", score, pairs: [] });

    it("detecta empate quando os placares são iguais", () => {
        expect(isDraw([player(3), player(3)])).toBe(true);
    });

    it("não é empate quando há um placar maior", () => {
        expect(isDraw([player(4), player(3)])).toBe(false);
    });
});
