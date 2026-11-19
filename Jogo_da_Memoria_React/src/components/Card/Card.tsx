import React, { useState } from "react";
import CardType from "../../@Types/CardType";
import "./card.css";

type CardProps = {
    card: CardType;
    back: string;
    disabled: boolean;
    index: number;
    total: number;
    onSelect: (card: CardType) => void;
};

const Card = ({ card, back, disabled, index, total, onSelect }: CardProps) => {
    const revealed = card.flipped || card.matched;
    // Arma o download da face na intencao (hover, toque ou foco) para o flip
    // nao revelar uma face em branco esperando a imagem chegar.
    const [armed, setArmed] = useState(false);
    const showFace = revealed || armed;

    const classes = [
        "Card",
        revealed ? "is-flipped" : "",
        card.matched ? "is-matched" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const stateLabel = card.matched
        ? "par encontrado"
        : revealed
          ? "revelada"
          : "virada para baixo";

    const handleClick = () => {
        if (disabled || revealed) return;
        onSelect(card);
    };

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            onPointerEnter={() => setArmed(true)}
            onPointerDown={() => setArmed(true)}
            onFocus={() => setArmed(true)}
            disabled={disabled || revealed}
            aria-label={`Carta ${index + 1} de ${total}, ${stateLabel}`}
            data-face={card.face}
        >
            <span className="Card-inner">
                <span className="Card-face Card-front">
                    <img className="Card-image" src={back} alt="" draggable={false} />
                </span>
                <span className="Card-face Card-back">
                    {/* loading="lazy" nao adia imagens que ja estao no
                        viewport, por isso o src so entra quando a face vai
                        aparecer. A face ocupa inset: 0 sobre um .Card com
                        aspect-ratio fixo, entao nao ha layout shift. */}
                    {showFace && (
                        <img
                            className="Card-image"
                            src={card.face}
                            alt=""
                            draggable={false}
                            loading="lazy"
                            decoding="async"
                        />
                    )}
                </span>
            </span>
        </button>
    );
};

export default Card;
