import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardType from "../../@Types/CardType";
import { CARD_BACK, CARD_FACES } from "../../data/cardFaces";
import { shuffle } from "../../utils/shuffle";
import { playSound } from "../../utils/sound";
import { formatDuration } from "../../utils/formatTime";
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

type Player = { name: string; score: number; pairs: string[] };

const sizeClassFor = (amountCards: number): string =>
    `grid-${amountCards}`;

const buildDeck = (amountCards: number): CardType[] => {
    const pairs = Math.floor(amountCards / 2);
    const faces = CARD_FACES.slice(0, pairs);
    const deck = [...faces, ...faces].map((face, id) => ({
        id,
        face,
        back: CARD_BACK,
        flipped: false,
        matched: false,
    }));
    return shuffle(deck);
};

const initialPlayers = (player1: string, player2: string): [Player, Player] => [
    { name: player1, score: 0, pairs: [] },
    { name: player2, score: 0, pairs: [] },
];

const Board = ({ player1, player2, amountCards, onExit }: BoardProps) => {
    const [cards, setCards] = useState<CardType[]>(() => buildDeck(amountCards));
    const [selected, setSelected] = useState<number[]>([]);
    const [turn, setTurn] = useState<0 | 1>(0);
    const [players, setPlayers] = useState<[Player, Player]>(() =>
        initialPlayers(player1, player2),
    );
    const [isLocked, setIsLocked] = useState(false);
    const [showWinner, setShowWinner] = useState(false);
    const [moves, setMoves] = useState(0);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [announcement, setAnnouncement] = useState("");

    const timeoutRef = useRef<number | null>(null);
    const timerRef = useRef<number | null>(null);
    const startedAtRef = useRef<number | null>(null);

    const clearPendingTimeout = useCallback(() => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Elapsed time is always derived from the start timestamp so a throttled or
    // delayed interval cannot accumulate drift.
    const startTimer = useCallback(() => {
        if (startedAtRef.current !== null) return;
        startedAtRef.current = Date.now();
        timerRef.current = window.setInterval(() => {
            if (startedAtRef.current === null) return;
            setElapsedMs(Date.now() - startedAtRef.current);
        }, 1000);
    }, []);

    useEffect(
        () => () => {
            clearPendingTimeout();
            stopTimer();
        },
        [clearPendingTimeout, stopTimer],
    );

    const resetGame = useCallback(() => {
        clearPendingTimeout();
        stopTimer();
        startedAtRef.current = null;
        setCards(buildDeck(amountCards));
        setSelected([]);
        setTurn(0);
        setPlayers(initialPlayers(player1, player2));
        setIsLocked(false);
        setShowWinner(false);
        setMoves(0);
        setElapsedMs(0);
        setAnnouncement("");
    }, [amountCards, player1, player2, clearPendingTimeout, stopTimer]);

    const totalPairs = useMemo(() => Math.floor(amountCards / 2), [amountCards]);

    const handleSelect = useCallback(
        (card: CardType) => {
            if (isLocked || selected.length >= 2) return;
            if (card.matched || card.flipped) return;

            startTimer();
            playSound(FLIP_SOUND, 0.35);
            const nextSelected = [...selected, card.id];
            setCards((prev) =>
                prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)),
            );
            setSelected(nextSelected);

            if (nextSelected.length < 2) return;

            const [firstId, secondId] = nextSelected;
            const first = cards.find((c) => c.id === firstId);
            const second = cards.find((c) => c.id === secondId);
            if (!first || !second) return;

            const nextMoves = moves + 1;
            setMoves(nextMoves);
            setAnnouncement(
                `Jogada ${nextMoves}. Tempo ${formatDuration(
                    startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current,
                )}.`,
            );

            if (first.face === second.face) {
                playSound(MATCH_SOUND, 0.5);
                setCards((prev) =>
                    prev.map((c) =>
                        c.id === firstId || c.id === secondId
                            ? { ...c, matched: true, flipped: true }
                            : c,
                    ),
                );
                setPlayers((prev) => {
                    const updated: [Player, Player] = [
                        { ...prev[0], pairs: [...prev[0].pairs] },
                        { ...prev[1], pairs: [...prev[1].pairs] },
                    ];
                    updated[turn].score += 1;
                    updated[turn].pairs.push(first.face);
                    return updated;
                });
                setSelected([]);
                return;
            }

            setIsLocked(true);
            timeoutRef.current = window.setTimeout(() => {
                setCards((prev) =>
                    prev.map((c) =>
                        c.id === firstId || c.id === secondId
                            ? { ...c, flipped: false }
                            : c,
                    ),
                );
                setSelected([]);
                setTurn((prev) => (prev === 0 ? 1 : 0));
                setIsLocked(false);
                timeoutRef.current = null;
            }, MATCH_DELAY);
        },
        [cards, isLocked, moves, selected, turn, startTimer],
    );

    const isFinished = useMemo(
        () => cards.length > 0 && cards.every((c) => c.matched),
        [cards],
    );

    useEffect(() => {
        if (!isFinished) return;
        stopTimer();
        playSound(WIN_SOUND, 0.45);
        setShowWinner(true);
    }, [isFinished, stopTimer]);

    useEffect(() => {
        if (!showWinner || startedAtRef.current === null) return;
        const finalMs = Date.now() - startedAtRef.current;
        setElapsedMs(finalMs);
        setAnnouncement(
            `Fim de jogo. ${moves} ${moves === 1 ? "jogada" : "jogadas"} em ${formatDuration(finalMs)}.`,
        );
    }, [showWinner, moves]);

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

                <div className="Board-stats">
                    <span className="Board-stat">
                        <span className="Board-statLabel">Jogadas</span>
                        <span className="Board-statValue">{moves}</span>
                    </span>
                    <span className="Board-stat">
                        <span className="Board-statLabel">Tempo</span>
                        <span
                            className="Board-statValue"
                            role="timer"
                            aria-label={`Tempo de partida ${formatDuration(elapsedMs)}`}
                        >
                            {formatDuration(elapsedMs)}
                        </span>
                    </span>
                </div>

                <p className="sr-only" aria-live="polite" aria-atomic="true">
                    {announcement}
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
                    moves={moves}
                    elapsedMs={elapsedMs}
                    onRestart={resetGame}
                    onNewGame={onExit}
                />
            )}
        </div>
    );
};

export default Board;
