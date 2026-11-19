import React, { useState } from "react";
import GameConfigType from "../../@Types/GameConfigType";
import type { SavedGame } from "../../utils/storage";
import { clearSavedGame, loadSavedGame } from "../../utils/storage";
import InitialForm from "../initForm/InitialForm";
import Board from "../board/Board";

type Session = {
    config: GameConfigType;
    restore: SavedGame | null;
};

const configFromSaved = (game: SavedGame): GameConfigType => ({
    player1: game.players[0].name,
    player2: game.players[1].name,
    amountCards: game.amountCards,
});

const InitMemoryGame = () => {
    const [savedGame, setSavedGame] = useState<SavedGame | null>(() => loadSavedGame());
    const [session, setSession] = useState<Session | null>(() =>
        savedGame ? { config: configFromSaved(savedGame), restore: savedGame } : null,
    );

    const startGame = (next: GameConfigType) => setSession({ config: next, restore: null });

    const resumeGame = () => {
        if (!savedGame) return;
        setSession({ config: configFromSaved(savedGame), restore: savedGame });
    };

    const discardSavedGame = () => {
        clearSavedGame();
        setSavedGame(null);
        setSession(null);
    };

    const exitGame = () => {
        setSession(null);
        setSavedGame(loadSavedGame());
    };

    if (!session) {
        return (
            <InitialForm
                onSubmit={startGame}
                savedGame={savedGame}
                onResume={resumeGame}
                onDiscard={discardSavedGame}
            />
        );
    }

    return (
        <Board
            key={`${session.config.player1}-${session.config.player2}-${session.config.amountCards}`}
            player1={session.config.player1}
            player2={session.config.player2}
            amountCards={session.config.amountCards}
            initialGame={session.restore}
            onExit={exitGame}
            onNewGame={discardSavedGame}
        />
    );
};

export default InitMemoryGame;
