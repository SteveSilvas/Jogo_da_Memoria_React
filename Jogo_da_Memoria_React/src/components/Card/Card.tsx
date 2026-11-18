import React from "react";
import CardType from "../../@Types/CardType";
import "./card.css";

type CardProps = {
    card: CardType;
    back: string;
    disabled: boolean;
    onSelect: (card: CardType) => void;
};

const Card = ({ card, back, disabled, onSelect }: CardProps) => {
    const revealed = card.flipped || card.matched;
    const classes = [
        "Card",
        revealed ? "is-flipped" : "",
        card.matched ? "is-matched" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const handleClick = () => {
        if (disabled || revealed) return;
        onSelect(card);
    };

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            disabled={disabled || revealed}
            aria-label={revealed ? "Carta revelada" : "Carta virada para baixo"}
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
