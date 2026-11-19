import CardType from "../@Types/CardType";

/** Posicoes (ids) que o computador viu, agrupadas pela face. */
export type ComputerMemory = Map<string, number[]>;

export type Random = () => number;

/** Chance de o computador esquecer uma posicao que ja viu. */
export const DEFAULT_FORGET_CHANCE = 0.3;

export type MoveOptions = {
    random?: Random;
    /** 0 nunca esquece, 1 sempre esquece. */
    forgetChance?: number;
};

const pick = <T,>(list: T[], random: Random): T =>
    list[Math.min(list.length - 1, Math.floor(random() * list.length))];

const availableIds = (cards: CardType[]): number[] =>
    cards.filter((card) => !card.matched && !card.flipped).map((card) => card.id);

/**
 * Escolhe a jogada do computador usando apenas o que ele memorizou e quais
 * posicoes ainda estao livres. Ele nunca consulta a face de uma carta que nao
 * viu, entao nao trapaceia.
 */
export const chooseMove = (
    memory: ReadonlyMap<string, number[]>,
    freeIds: number[],
    { random = Math.random, forgetChance = DEFAULT_FORGET_CHANCE }: MoveOptions = {},
): [number, number] | null => {
    if (freeIds.length < 2) return null;

    const free = new Set(freeIds);
    const knownPairs: [number, number][] = [];
    const knownSingles: number[] = [];
    const knownIds = new Set<number>();

    for (const ids of memory.values()) {
        const live = ids.filter((id) => free.has(id));
        live.forEach((id) => knownIds.add(id));
        if (live.length >= 2) {
            knownPairs.push([live[0], live[1]]);
        } else if (live.length === 1) {
            knownSingles.push(live[0]);
        }
    }

    const forgot = random() < forgetChance;

    if (!forgot && knownPairs.length > 0) {
        return pick(knownPairs, random);
    }

    const unknown = freeIds.filter((id) => !knownIds.has(id));

    if (!forgot && knownSingles.length > 0) {
        const first = pick(knownSingles, random);
        const candidates = (unknown.length > 0 ? unknown : freeIds).filter(
            (id) => id !== first,
        );
        if (candidates.length > 0) return [first, pick(candidates, random)];
    }

    const first = pick(freeIds, random);
    const rest = freeIds.filter((id) => id !== first);
    return [first, pick(rest, random)];
};

/** Guarda a posicao vista, mantendo no maximo duas por face. */
export const remember = (
    memory: ComputerMemory,
    face: string,
    id: number,
): void => {
    const seen = memory.get(face) ?? [];
    if (seen.includes(id)) return;
    memory.set(face, [...seen, id].slice(-2));
};

/** Alimenta a memoria com todas as cartas que estao abertas no tabuleiro. */
export const rememberRevealed = (
    memory: ComputerMemory,
    cards: CardType[],
): void => {
    for (const card of cards) {
        if (card.flipped || card.matched) remember(memory, card.face, card.id);
    }
};

export const freeCardIds = availableIds;
