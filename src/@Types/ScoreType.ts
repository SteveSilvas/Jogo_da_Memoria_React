import CardType from "./CardType";
import MoveType from "./MoveType";

type ScoreType = {
    pairs?: CardType[],
    moves?: MoveType[],
}

export default ScoreType;