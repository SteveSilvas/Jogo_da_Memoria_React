import React from "react";
import CardType from "../../@Types/CardType";
import "./card.css";

type CardProps = {
    card: CardType;
    back: string;
    locked: boolean;
    onSelect: (card: CardType) => void;
    position: number;
    total: number;
};

const stateLabel = (card: CardType): string => {
    if (card.matched) return "par encontrado";
    if (card.flipped) return "revelada";
    return "virada para baixo";
};

const Card = ({ card, back, locked, onSelect, position, total }: CardProps) => {
    const revealed = card.flipped || card.matched;
    const classes = [
        "Card",
        revealed ? "is-flipped" : "",
        card.matched ? "is-matched" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const selectable = !locked && !revealed;

    const handleClick = () => {
        if (!selectable) return;
        onSelect(card);
    };

    // aria-disabled em vez de disabled: a carta continua focável, então o
    // leitor de tela anuncia o estado ("revelada"/"par encontrado").
    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            aria-disabled={!selectable}
            aria-label={`Carta ${position} de ${total}, ${stateLabel(card)}`}
        >
            <span className="Card-inner">
                <span className="Card-face Card-front">
                    <img className="Card-image" src={back} alt="" draggable={false} />
                </span>
                <span className="Card-face Card-back">
                    <img className="Card-image" src={card.face} alt="" draggable={false} />
                </span>
            </span>
        </button>
    );
};

export default Card;
