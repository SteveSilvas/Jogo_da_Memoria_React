import CardType from "../@Types/CardType";
import { CARD_BACK, CARD_FACES } from "../data/cardFaces";
import { shuffle } from "./shuffle";

export const buildDeck = (amountCards: number): CardType[] => {
    const pairs = Math.floor(amountCards / 2);
    const faces = CARD_FACES.slice(0, pairs);
    const deck = [...faces, ...faces].map((face, id) => ({
        id,
        face,
        back: CARD_BACK,
        flipped: false,
        matched: false,
    }));
    return shuffle(deck);
};
