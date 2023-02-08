import CardType from "./CardType";

type MoveType = {
    id: number,
    player: string,
    round: number,
    card1: CardType | undefined,
    card2: CardType | undefined,
    point: number;
}

export default MoveType;