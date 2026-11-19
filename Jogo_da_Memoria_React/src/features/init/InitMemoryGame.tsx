import React, { useState } from "react";
import GameConfigType from "../../@Types/GameConfigType";
import InitialForm from "../initForm/InitialForm";
import Board from "../board/Board";

const InitMemoryGame = () => {
    const [config, setConfig] = useState<GameConfigType | null>(null);
    // Uma partida retomada precisa montar o Board do zero para reler o estado salvo.
    const [resumed, setResumed] = useState(false);

    const startGame = (next: GameConfigType) => {
        setResumed(false);
        setConfig(next);
    };

    const resumeGame = (next: GameConfigType) => {
        setResumed(true);
        setConfig(next);
    };

    const exitGame = () => {
        setResumed(false);
        setConfig(null);
    };

    if (!config) {
        return <InitialForm onSubmit={startGame} onResume={resumeGame} />;
    }

    return (
        <Board
            key={`${config.player1}-${config.player2}-${config.amountCards}-${config.mode}-${resumed}`}
            player1={config.player1}
            player2={config.player2}
            amountCards={config.amountCards}
            computerOpponent={config.mode === "single-player"}
            restoreSaved={resumed}
            onExit={exitGame}
        />
    );
};

export default InitMemoryGame;
