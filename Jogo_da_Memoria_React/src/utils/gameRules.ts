import CardType from "../@Types/CardType";
import { CARD_BACK, CARD_FACES } from "../data/cardFaces";
import { shuffle } from "./shuffle";

export const buildDeck = (amountCards: number): CardType[] => {
    const pairs = Math.floor(amountCards / 2);
    const faces = CARD_FACES.slice(0, pairs);
    return shuffle(
        [...faces, ...faces].map((face, id) => ({
            id,
            face,
            back: CARD_BACK,
            flipped: false,
            matched: false,
        })),
    );
};

export const isMatch = (first: CardType, second: CardType): boolean =>
    first.face === second.face;

export const countMatchedPairs = (cards: CardType[]): number =>
    cards.filter((card) => card.matched).length / 2;

export const isGameOver = (cards: CardType[]): boolean =>
    cards.length > 0 && cards.every((card) => card.matched);

export const nextTurn = (turn: 0 | 1): 0 | 1 => (turn === 0 ? 1 : 0);
