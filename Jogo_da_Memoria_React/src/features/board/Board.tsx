import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardType from "../../@Types/CardType";
import { CARD_BACK } from "../../data/cardFaces";
import { buildDeck } from "../../utils/deck";
import {
    hideCards,
    initialPlayers,
    isBoardComplete,
    nextTurn,
    Player,
    resolveSelection,
    revealCards,
    Turn,
} from "../../utils/gameRules";
import { playSound } from "../../utils/sound";
import Card from "../../components/Card/Card";
import Scoreboard from "../../components/Scoreboard/Scoreboard";
import WinnerPanel from "../../components/WinnerPanel/WinnerPanel";
import "./board.css";

const MATCH_SOUND = new URL("../../assets/songs/ES_Beep Sonar Blip 1 - SFX Producer.mp3", import.meta.url).href;
const FLIP_SOUND = new URL("../../assets/songs/transition.mp3", import.meta.url).href;
const WIN_SOUND = new URL("../../assets/songs/ES_PREL Glitch 15 - SFX Producer.mp3", import.meta.url).href;

const MATCH_DELAY = 900;

type BoardProps = {
    player1: string;
    player2: string;
    amountCards: number;
    onExit: () => void;
};

const sizeClassFor = (amountCards: number): string =>
    `grid-${amountCards}`;

const Board = ({ player1, player2, amountCards, onExit }: BoardProps) => {
    const [cards, setCards] = useState<CardType[]>(() => buildDeck(amountCards));
    const [selected, setSelected] = useState<number[]>([]);
    const [turn, setTurn] = useState<Turn>(0);
    const [players, setPlayers] = useState<[Player, Player]>(() =>
        initialPlayers(player1, player2),
    );
    const [isLocked, setIsLocked] = useState(false);
    const [showWinner, setShowWinner] = useState(false);

    const timeoutRef = useRef<number | null>(null);

    const clearPendingTimeout = useCallback(() => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

    const resetGame = useCallback(() => {
        clearPendingTimeout();
        setCards(buildDeck(amountCards));
        setSelected([]);
        setTurn(0);
        setPlayers(initialPlayers(player1, player2));
        setIsLocked(false);
        setShowWinner(false);
    }, [amountCards, player1, player2, clearPendingTimeout]);

    const totalPairs = useMemo(() => Math.floor(amountCards / 2), [amountCards]);

    const handleSelect = useCallback(
        (card: CardType) => {
            if (isLocked || selected.length >= 2) return;
            if (card.matched || card.flipped) return;

            playSound(FLIP_SOUND, 0.35);
            const nextSelected = [...selected, card.id];
            setCards((prev) => revealCards(prev, [card.id]));
            setSelected(nextSelected);

            if (nextSelected.length < 2) return;

            const ids: [number, number] = [nextSelected[0], nextSelected[1]];
            const outcome = resolveSelection(cards, ids, players, turn);

            if (outcome.kind === "match") {
                playSound(MATCH_SOUND, 0.5);
                setCards(outcome.cards);
                setPlayers(outcome.players);
                setSelected([]);
                return;
            }

            setIsLocked(true);
            timeoutRef.current = window.setTimeout(() => {
                setCards((prev) => hideCards(prev, ids));
                setSelected([]);
                setTurn((prev) => nextTurn(prev));
                setIsLocked(false);
                timeoutRef.current = null;
            }, MATCH_DELAY);
        },
        [cards, isLocked, players, selected, turn],
    );

    useEffect(() => {
        if (isBoardComplete(cards)) {
            playSound(WIN_SOUND, 0.45);
            setShowWinner(true);
        }
    }, [cards]);

    const renderGrid = () => (
        <div className={`Board-grid ${sizeClassFor(amountCards)}`}>
            {cards.map((card) => (
                <Card
                    key={card.id}
                    card={card}
                    back={CARD_BACK}
                    disabled={isLocked || selected.length >= 2}
                    onSelect={handleSelect}
                />
            ))}
        </div>
    );

    return (
        <div className="BoardContainer">
            <Scoreboard
                name={players[0].name}
                score={players[0].score}
                active={turn === 0 && !showWinner}
                pairs={players[0].pairs}
            />

            <main className="Board-main">
                <h2 className="Board-title">
                    Vez de <strong>{players[turn].name}</strong>
                </h2>
                <p className="Board-progress">
                    {totalPairs} pares ·{" "}
                    {cards.filter((c) => c.matched).length / 2} encontrados
                </p>

                {renderGrid()}

                <nav className="Board-footer">
                    <button className="Button Button-ghost" onClick={onExit}>
                        Voltar
                    </button>
                    <button className="Button" onClick={resetGame}>
                        Reiniciar
                    </button>
                </nav>
            </main>

            <Scoreboard
                name={players[1].name}
                score={players[1].score}
                active={turn === 1 && !showWinner}
                pairs={players[1].pairs}
            />

            {showWinner && (
                <WinnerPanel
                    players={players.map((p) => ({ name: p.name, score: p.score }))}
                    onRestart={resetGame}
                    onNewGame={onExit}
                />
            )}
        </div>
    );
};

export default Board;
