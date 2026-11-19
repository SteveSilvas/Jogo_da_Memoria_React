import { describe, expect, it } from "vitest";
import {
    chooseMove,
    DEFAULT_FORGET_CHANCE,
    pruneMemory,
    remember,
} from "./computerPlayer";

const noForget = { forgetChance: 0 };

describe("remember", () => {
    it("guarda a posição de uma face sem duplicar", () => {
        const first = remember(new Map(), "face-a", 3);
        const second = remember(first, "face-a", 3);

        expect(second.get("face-a")).toEqual([3]);
    });

    it("não modifica o mapa recebido", () => {
        const memory = new Map<string, number[]>([["face-a", [1]]]);
        const updated = remember(memory, "face-b", 4);

        expect(memory.has("face-b")).toBe(false);
        expect(updated.get("face-b")).toEqual([4]);
    });
});

describe("pruneMemory", () => {
    it("descarta posições que não estão mais disponíveis", () => {
        const memory = new Map<string, number[]>([
            ["face-a", [1, 2]],
            ["face-b", [3]],
        ]);

        const pruned = pruneMemory(memory, [2]);

        expect(pruned.get("face-a")).toEqual([2]);
        expect(pruned.has("face-b")).toBe(false);
    });
});

describe("chooseMove", () => {
    it("usa um par já memorizado quando existe", () => {
        const memory = new Map<string, number[]>([["face-a", [4, 1]]]);

        expect(chooseMove(memory, [0, 1, 2, 4], noForget)).toEqual([1, 4]);
    });

    it("só escolhe posições disponíveis", () => {
        const memory = new Map<string, number[]>([
            ["face-a", [0, 1]],
            ["face-b", [9]],
        ]);

        const [first, second] = chooseMove(memory, [2, 3, 4, 5], noForget);

        expect([2, 3, 4, 5]).toContain(first);
        expect([2, 3, 4, 5]).toContain(second);
        expect(first).not.toBe(second);
    });

    it("não lê cartas nunca vistas: sem memória, escolhe entre as disponíveis", () => {
        const available = [10, 11, 12, 13];

        for (let i = 0; i < 20; i++) {
            const move = chooseMove(new Map(), available, noForget);
            move.forEach((position) => expect(available).toContain(position));
            expect(move[0]).not.toBe(move[1]);
        }
    });

    it("combina uma posição memorizada com uma desconhecida quando não há par", () => {
        const memory = new Map<string, number[]>([["face-a", [7]]]);

        const [first, second] = chooseMove(memory, [2, 7, 8], noForget);

        expect([first, second]).toContain(7);
        expect([first, second].filter((position) => position !== 7)).toHaveLength(1);
    });

    it("esquece posições quando o azar da distração acontece", () => {
        const memory = new Map<string, number[]>([["face-a", [0, 1]]]);
        const random = () => 0;

        const move = chooseMove(memory, [0, 1, 2], {
            forgetChance: 1,
            random,
        });

        expect(move).not.toEqual([0, 1]);
    });

    it("não altera a memória recebida", () => {
        const memory = new Map<string, number[]>([["face-a", [0, 1]]]);
        chooseMove(memory, [0, 1], noForget);

        expect(memory.get("face-a")).toEqual([0, 1]);
    });

    it("falha quando há menos de duas posições disponíveis", () => {
        expect(() => chooseMove(new Map(), [1], noForget)).toThrow();
    });

    it("tem chance de erro configurável dentro de 0..1", () => {
        expect(DEFAULT_FORGET_CHANCE).toBeGreaterThan(0);
        expect(DEFAULT_FORGET_CHANCE).toBeLessThan(1);
    });
});
