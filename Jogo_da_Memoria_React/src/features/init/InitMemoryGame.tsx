import React, { useState } from "react";
import GameConfigType from "../../@Types/GameConfigType";
import InitialForm from "../initForm/InitialForm";
import Board from "../board/Board";

const InitMemoryGame = () => {
    const [config, setConfig] = useState<GameConfigType | null>(null);

    const startGame = (next: GameConfigType) => setConfig(next);
    const exitGame = () => setConfig(null);

    if (!config) {
        return <InitialForm onSubmit={startGame} />;
    }

    return (
        <Board
            key={`${config.mode}-${config.player1}-${config.player2}-${config.amountCards}`}
            player1={config.player1}
            player2={config.player2}
            amountCards={config.amountCards}
            mode={config.mode}
            onExit={exitGame}
        />
    );
};

export default InitMemoryGame;
