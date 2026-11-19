import { describe, expect, it } from "vitest";
import CardType from "../@Types/CardType";
import {
    chooseMove,
    freeCardIds,
    remember,
    rememberRevealed,
} from "./computerPlayer";

const card = (
    id: number,
    face: string,
    overrides: Partial<CardType> = {},
): CardType => ({
    id,
    face,
    back: "/back.png",
    flipped: false,
    matched: false,
    ...overrides,
});

/** Sempre devolve o primeiro item, tornando a escolha deterministica. */
const first = () => 0;
const noForget = { random: first, forgetChance: 0 };
const alwaysForget = { random: first, forgetChance: 1 };

describe("freeCardIds", () => {
    it("lista apenas cartas disponiveis", () => {
        const cards = [
            card(0, "/a"),
            card(1, "/a", { matched: true }),
            card(2, "/b", { flipped: true }),
            card(3, "/b"),
        ];
        expect(freeCardIds(cards)).toEqual([0, 3]);
    });
});

describe("remember", () => {
    it("guarda a posicao vista", () => {
        const memory = new Map<string, number[]>();
        remember(memory, "/a", 3);
        expect(memory.get("/a")).toEqual([3]);
    });

    it("nao duplica a mesma posicao", () => {
        const memory = new Map<string, number[]>();
        remember(memory, "/a", 3);
        remember(memory, "/a", 3);
        expect(memory.get("/a")).toEqual([3]);
    });

    it("mantem no maximo duas posicoes por face", () => {
        const memory = new Map<string, number[]>();
        remember(memory, "/a", 1);
        remember(memory, "/a", 2);
        remember(memory, "/a", 5);
        expect(memory.get("/a")).toEqual([2, 5]);
    });

    it("lembra apenas cartas que estiveram abertas", () => {
        const memory = new Map<string, number[]>();
        rememberRevealed(memory, [
            card(0, "/a", { flipped: true }),
            card(1, "/a"),
            card(2, "/b", { matched: true }),
            card(3, "/c"),
        ]);
        expect(memory.get("/a")).toEqual([0]);
        expect(memory.get("/b")).toEqual([2]);
        expect(memory.has("/c")).toBe(false);
    });
});

describe("chooseMove", () => {
    it("devolve null quando sobra menos de duas cartas", () => {
        expect(chooseMove(new Map(), [1])).toBeNull();
        expect(chooseMove(new Map(), [])).toBeNull();
    });

    it("usa o par memorizado quando lembra das duas posicoes", () => {
        const memory = new Map([["/a", [4, 9]]]);
        expect(chooseMove(memory, [4, 7, 9, 11], noForget)).toEqual([
            4, 9,
        ]);
    });

    it("ignora posicoes memorizadas que ja nao estao livres", () => {
        const memory = new Map([
            ["/a", [4, 9]],
            ["/b", [1, 2]],
        ]);
        // 4 ja foi encontrada; so o par /b continua disponivel.
        expect(chooseMove(memory, [1, 2, 9, 12], noForget)).toEqual([
            1, 2,
        ]);
    });

    it("nao escolhe posicao ocupada", () => {
        const memory = new Map([["/a", [4, 9]]]);
        const [a, b] = chooseMove(memory, [4, 7, 9, 11], noForget)!;
        expect([4, 7, 9, 11]).toContain(a);
        expect([4, 7, 9, 11]).toContain(b);
        expect(a).not.toBe(b);
    });

    it("combina uma carta conhecida com uma desconhecida", () => {
        const memory = new Map([["/a", [4]]]);
        const [a, b] = chooseMove(memory, [4, 7, 9], noForget)!;
        expect(a).toBe(4);
        expect([7, 9]).toContain(b);
    });

    it("nao repete a mesma posicao duas vezes", () => {
        for (const random of [first, () => 0.5, () => 0.99]) {
            const [a, b] = chooseMove(new Map(), [1, 2, 3], { random, forgetChance: 0 })!;
            expect(a).not.toBe(b);
        }
    });

    it("explora quando nao tem memoria", () => {
        const [a, b] = chooseMove(new Map(), [1, 2, 3, 4], noForget)!;
        expect([1, 2, 3, 4]).toContain(a);
        expect([1, 2, 3, 4]).toContain(b);
    });

    it("esquece o par quando a chance de esquecer dispara", () => {
        const memory = new Map([["/a", [4, 9]]]);
        const move = chooseMove(memory, [4, 7, 9, 11], alwaysForget)!;
        expect(move).not.toEqual([4, 9]);
    });

    it("nunca le a face de uma carta que nao viu", () => {
        // A memoria so tem /a em 4. A jogada deve envolver 4 e uma desconhecida,
        // mesmo existindo um par real em 7 e 11 que o computador nao viu.
        const memory = new Map([["/a", [4]]]);
        const [a, b] = chooseMove(memory, [4, 7, 11], noForget)!;
        expect(a).toBe(4);
        expect(b).not.toBe(4);
    });

    it("escolhe entre varios pares memorizados sem estourar o indice", () => {
        const memory = new Map([
            ["/a", [0, 1]],
            ["/b", [2, 3]],
        ]);
        for (const random of [() => 0, () => 0.5, () => 0.999]) {
            const move = chooseMove(memory, [0, 1, 2, 3], { random, forgetChance: 0 })!;
            expect([
                [0, 1],
                [2, 3],
            ]).toContainEqual(move);
        }
    });
});
