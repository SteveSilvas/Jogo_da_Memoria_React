export type ComputerMemory = ReadonlyMap<string, readonly number[]>;

export type ChooseMoveOptions = {
    /** Probabilidade (0..1) de esquecer uma posição memorizada antes de jogar. */
    forgetChance?: number;
    random?: () => number;
};

export const COMPUTER_NAME = "Computador";
export const DEFAULT_FORGET_CHANCE = 0.35;

const pick = <T,>(items: readonly T[], random: () => number): T =>
    items[Math.min(items.length - 1, Math.floor(random() * items.length))];

const copyMemory = (memory: ComputerMemory): Map<string, number[]> => {
    const next = new Map<string, number[]>();
    memory.forEach((positions, face) => next.set(face, [...positions]));
    return next;
};

export function remember(
    memory: ComputerMemory,
    face: string,
    position: number,
): Map<string, number[]> {
    const next = copyMemory(memory);
    const positions = next.get(face) ?? [];
    if (!positions.includes(position)) next.set(face, [...positions, position]);
    return next;
}

export function pruneMemory(
    memory: ComputerMemory,
    available: readonly number[],
): Map<string, number[]> {
    const allowed = new Set(available);
    const next = new Map<string, number[]>();
    memory.forEach((positions, face) => {
        const kept = positions.filter((position) => allowed.has(position));
        if (kept.length > 0) next.set(face, kept);
    });
    return next;
}

function forgetOnePosition(memory: Map<string, number[]>, random: () => number): void {
    const faces = [...memory.keys()];
    if (faces.length === 0) return;

    const face = pick(faces, random);
    const positions = memory.get(face) ?? [];
    const forgotten = pick(positions, random);
    const kept = positions.filter((position) => position !== forgotten);

    if (kept.length === 0) memory.delete(face);
    else memory.set(face, kept);
}

function findRememberedPair(memory: ComputerMemory): [number, number] | null {
    for (const positions of memory.values()) {
        if (positions.length >= 2) {
            const [first, second] = [...positions].sort((a, b) => a - b);
            return [first, second];
        }
    }
    return null;
}

/**
 * Escolhe a jogada do computador usando apenas o que ele já viu.
 * `memory` mapeia face -> posições vistas; `available` são as posições livres.
 */
export function chooseMove(
    memory: ComputerMemory,
    available: readonly number[],
    options: ChooseMoveOptions = {},
): [number, number] {
    const { forgetChance = DEFAULT_FORGET_CHANCE, random = Math.random } = options;
    const positions = [...new Set(available)];

    if (positions.length < 2) {
        throw new Error("chooseMove precisa de pelo menos duas posições disponíveis");
    }

    const known = pruneMemory(memory, positions);
    if (forgetChance > 0 && random() < forgetChance) forgetOnePosition(known, random);

    const pair = findRememberedPair(known);
    if (pair) return pair;

    const remembered = [...known.values()].flat();
    const unknown = positions.filter((position) => !remembered.includes(position));

    if (remembered.length > 0 && unknown.length > 0) {
        return [pick(remembered, random), pick(unknown, random)];
    }

    const first = pick(positions, random);
    const rest = positions.filter((position) => position !== first);
    return [first, pick(rest, random)];
}
