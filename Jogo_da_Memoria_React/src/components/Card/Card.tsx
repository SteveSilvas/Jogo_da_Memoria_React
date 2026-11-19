import React, { useState } from "react";
import CardType from "../../@Types/CardType";
import "./card.css";

type CardProps = {
    card: CardType;
    back: string;
    disabled: boolean;
    onSelect: (card: CardType) => void;
};

// As faces externas são quadradas; declarar as dimensões intrínsecas evita
// que o navegador reflita o layout antes da imagem chegar.
const IMAGE_SIZE = 512;

const Card = ({ card, back, disabled, onSelect }: CardProps) => {
    const revealed = card.flipped || card.matched;
    // `loading="lazy"` não adia imagens já no viewport, então a face só ganha
    // `src` depois do primeiro gesto do jogador (hover, foco ou clique).
    const [requestedFace, setRequestedFace] = useState<string | null>(null);
    const showFace = revealed || requestedFace === card.face;
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

    const prefetchFace = () => {
        if (!revealed) setRequestedFace(card.face);
    };

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            onPointerEnter={prefetchFace}
            onPointerDown={prefetchFace}
            onFocus={prefetchFace}
            disabled={disabled || revealed}
            aria-label={revealed ? "Carta revelada" : "Carta virada para baixo"}
        >
            <span className="Card-inner">
                <span className="Card-face Card-front">
                    <img
                        className="Card-image"
                        src={back}
                        alt=""
                        width={IMAGE_SIZE}
                        height={IMAGE_SIZE}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                </span>
                <span className="Card-face Card-back">
                    {showFace && (
                        <img
                            className="Card-image"
                            src={card.face}
                            alt=""
                            width={IMAGE_SIZE}
                            height={IMAGE_SIZE}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                        />
                    )}
                </span>
            </span>
        </button>
    );
};

export default Card;
