import React, { useState } from "react";
import GameConfigType from "../../@Types/GameConfigType";
import "./initialForm.css";

type InitialFormProps = {
    onSubmit: (config: GameConfigType) => void;
};

const CARD_OPTIONS = [10, 20, 30, 40];

const InitialForm = ({ onSubmit }: InitialFormProps) => {
    const [player1, setPlayer1] = useState("");
    const [player2, setPlayer2] = useState("");
    const [amountCards, setAmountCards] = useState(10);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name1 = player1.trim();
        const name2 = player2.trim();
        if (!name1 || !name2) return;
        onSubmit({ player1: name1, player2: name2, amountCards });
    };

    return (
        <div className="StartScreen">
            <div className="StartCard">
                <h1 className="StartTitle">Jogo da Memória</h1>
                <p className="StartSubtitle">
                    Encontre todos os pares antes do adversário.
                </p>

                <form className="StartForm" onSubmit={handleSubmit}>
                    <label className="Field">
                        <span className="Field-label">Jogador(a) 1</span>
                        <input
                            className="Field-input"
                            type="text"
                            value={player1}
                            maxLength={24}
                            placeholder="Nome do jogador 1"
                            onChange={(e) => setPlayer1(e.target.value)}
                            required
                        />
                    </label>

                    <label className="Field">
                        <span className="Field-label">Jogador(a) 2</span>
                        <input
                            className="Field-input"
                            type="text"
                            value={player2}
                            maxLength={24}
                            placeholder="Nome do jogador 2"
                            onChange={(e) => setPlayer2(e.target.value)}
                            required
                        />
                    </label>

                    <label className="Field">
                        <span className="Field-label">Quantidade de cartas</span>
                        <select
                            className="Field-input Field-select"
                            value={amountCards}
                            onChange={(e) => setAmountCards(Number(e.target.value))}
                        >
                            {CARD_OPTIONS.map((amount) => (
                                <option key={amount} value={amount}>
                                    {amount} cartas ({amount / 2} pares)
                                </option>
                            ))}
                        </select>
                    </label>

                    <button className="Button StartButton" type="submit">
                        Jogar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InitialForm;
