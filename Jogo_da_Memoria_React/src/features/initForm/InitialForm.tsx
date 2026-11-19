import React, { useState } from "react";
import GameConfigType, { GameMode } from "../../@Types/GameConfigType";
import { COMPUTER_NAME } from "../../utils/computerPlayer";
import "./initialForm.css";

type InitialFormProps = {
    onSubmit: (config: GameConfigType) => void;
};

const CARD_OPTIONS = [10, 20, 30, 40];

const MODE_OPTIONS: { value: GameMode; label: string; hint: string }[] = [
    {
        value: "two-players",
        label: "2 jogadores",
        hint: "Você e outra pessoa, cada um com o seu nome.",
    },
    {
        value: "single-player",
        label: "1 jogador",
        hint: "Jogue contra o computador e treine sua memória.",
    },
];

const InitialForm = ({ onSubmit }: InitialFormProps) => {
    const [player1, setPlayer1] = useState("");
    const [player2, setPlayer2] = useState("");
    const [amountCards, setAmountCards] = useState(10);
    const [mode, setMode] = useState<GameMode>("two-players");

    const isSinglePlayer = mode === "single-player";

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name1 = player1.trim();
        const name2 = player2.trim();
        if (!name1) return;
        if (!isSinglePlayer && !name2) return;
        onSubmit({
            player1: name1,
            player2: isSinglePlayer ? COMPUTER_NAME : name2,
            amountCards,
            mode,
        });
    };

    return (
        <div className="StartScreen">
            <div className="StartCard">
                <h1 className="StartTitle">Jogo da Memória</h1>
                <p className="StartSubtitle">
                    Encontre todos os pares antes do adversário.
                </p>

                <form className="StartForm" onSubmit={handleSubmit}>
                    <fieldset className="ModeGroup">
                        <legend className="Field-label">Modo de jogo</legend>
                        <div className="ModeOptions">
                            {MODE_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`ModeOption${
                                        mode === option.value ? " is-selected" : ""
                                    }`}
                                >
                                    <input
                                        className="ModeOption-input"
                                        type="radio"
                                        name="game-mode"
                                        value={option.value}
                                        checked={mode === option.value}
                                        onChange={() => setMode(option.value)}
                                    />
                                    <span className="ModeOption-label">
                                        {option.label}
                                    </span>
                                    <span className="ModeOption-hint">
                                        {option.hint}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <label className="Field">
                        <span className="Field-label">Jogador(a) 1</span>
                        <input
                            className="Field-input"
                            type="text"
                            value={player1}
                            maxLength={24}
                            placeholder="Seu nome"
                            onChange={(e) => setPlayer1(e.target.value)}
                            required
                        />
                    </label>

                    {isSinglePlayer ? (
                        <p className="StartHint">
                            Seu adversário será o <strong>{COMPUTER_NAME}</strong>.
                        </p>
                    ) : (
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
                    )}

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
