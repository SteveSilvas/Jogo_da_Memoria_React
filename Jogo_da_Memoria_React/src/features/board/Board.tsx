import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardType from "../../@Types/CardType";
import { GameMode } from "../../@Types/GameConfigType";
import { CARD_BACK, CARD_FACES } from "../../data/cardFaces";
import { shuffle } from "../../utils/shuffle";
import { playSound } from "../../utils/sound";
import { chooseMove, DEFAULT_FORGET_CHANCE, remember } from "../../utils/computerPlayer";
import Card from "../../components/Card/Card";
import Scoreboard from "../../components/Scoreboard/Scoreboard";
import WinnerPanel from "../../components/WinnerPanel/WinnerPanel";
import "./board.css";

const MATCH_SOUND = new URL("../../assets/songs/ES_Beep Sonar Blip 1 - SFX Producer.mp3", import.meta.url).href;
const FLIP_SOUND = new URL("../../assets/songs/transition.mp3", import.meta.url).href;
const WIN_SOUND = new URL("../../assets/songs/ES_PREL Glitch 15 - SFX Producer.mp3", import.meta.url).href;

const MATCH_DELAY = 900;
const COMPUTER_THINK_DELAY = 700;

type BoardProps = {
    player1: string;
    player2: string;
    amountCards: number;
    mode: GameMode;
    onExit: () => void;
    computerForgetChance?: number;
};

type Player = {
    name: string;
    score: number;
    pairs: string[];
    isComputer: boolean;
};

const sizeClassFor = (amountCards: number): string => `grid-${amountCards}`;

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

const initialPlayers = (
    player1: string,
    player2: string,
    mode: GameMode,
): [Player, Player] => [
    { name: player1, score: 0, pairs: [], isComputer: false },
    { name: player2, score: 0, pairs: [], isComputer: mode === "single-player" },
];

const Board = ({
    player1,
    player2,
    amountCards,
    mode,
    onExit,
    computerForgetChance = DEFAULT_FORGET_CHANCE,
}: BoardProps) => {
    const [cards, setCards] = useState<CardType[]>(() => buildDeck(amountCards));
    const [selected, setSelected] = useState<number[]>([]);
    const [turn, setTurn] = useState<0 | 1>(0);
    const [players, setPlayers] = useState<[Player, Player]>(() =>
        initialPlayers(player1, player2, mode),
    );
    const [isLocked, setIsLocked] = useState(false);
    const [showWinner, setShowWinner] = useState(false);

    const cardsRef = useRef(cards);
    const selectedRef = useRef<number[]>([]);
    const memoryRef = useRef(new Map<string, number[]>());
    const timeoutsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        cardsRef.current = cards;
    }, [cards]);

    useEffect(() => {
        selectedRef.current = selected;
    }, [selected]);

    const schedule = useCallback((callback: () => void, delay: number): number => {
        const id = window.setTimeout(() => {
            timeoutsRef.current.delete(id);
            callback();
        }, delay);
        timeoutsRef.current.add(id);
        return id;
    }, []);

    const cancel = useCallback((id: number) => {
        window.clearTimeout(id);
        timeoutsRef.current.delete(id);
    }, []);

    const clearPendingTimeouts = useCallback(() => {
        timeoutsRef.current.forEach((id) => window.clearTimeout(id));
        timeoutsRef.current.clear();
    }, []);

    useEffect(() => clearPendingTimeouts, [clearPendingTimeouts]);

    const isSinglePlayer = mode === "single-player";
    const isComputerTurn = isSinglePlayer && turn === 1 && !showWinner;

    const clearSelection = useCallback(() => {
        selectedRef.current = [];
        setSelected([]);
    }, []);

    const resetGame = useCallback(() => {
        clearPendingTimeouts();
        memoryRef.current = new Map();
        setCards(buildDeck(amountCards));
        clearSelection();
        setTurn(0);
        setPlayers(initialPlayers(player1, player2, mode));
        setIsLocked(false);
        setShowWinner(false);
    }, [amountCards, player1, player2, mode, clearPendingTimeouts, clearSelection]);

    const totalPairs = useMemo(() => Math.floor(amountCards / 2), [amountCards]);

    const flipCards = useCallback((ids: number[]) => {
        setCards((prev) =>
            prev.map((c) => (ids.includes(c.id) ? { ...c, flipped: true } : c)),
        );
    }, []);

    const resolveTurn = useCallback(
        (firstId: number, secondId: number) => {
            const first = cardsRef.current.find((c) => c.id === firstId);
            const second = cardsRef.current.find((c) => c.id === secondId);
            if (!first || !second) return;

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
                clearSelection();
                return;
            }

            setIsLocked(true);
            schedule(() => {
                setCards((prev) =>
                    prev.map((c) =>
                        c.id === firstId || c.id === secondId
                            ? { ...c, flipped: false }
                            : c,
                    ),
                );
                clearSelection();
                setTurn((prev) => (prev === 0 ? 1 : 0));
                setIsLocked(false);
            }, MATCH_DELAY);
        },
        [turn, schedule, clearSelection],
    );

    const handleSelect = useCallback(
        (card: CardType) => {
            if (isLocked || isComputerTurn || selectedRef.current.length >= 2) {
                return;
            }
            if (card.matched || card.flipped) return;
            if (selectedRef.current.includes(card.id)) return;

            playSound(FLIP_SOUND, 0.35);
            memoryRef.current = remember(memoryRef.current, card.face, card.id);
            flipCards([card.id]);

            const nextSelected = [...selectedRef.current, card.id];
            selectedRef.current = nextSelected;
            setSelected(nextSelected);
            if (nextSelected.length === 2) {
                resolveTurn(nextSelected[0], nextSelected[1]);
            }
        },
        [isLocked, isComputerTurn, flipCards, resolveTurn],
    );

    useEffect(() => {
        if (!isComputerTurn || isLocked) return;

        const available = cards
            .filter((card) => !card.matched && !card.flipped)
            .map((card) => card.id);
        if (available.length < 2) return;

        const timeoutId = schedule(() => {
            const [firstId, secondId] = chooseMove(memoryRef.current, available, {
                forgetChance: computerForgetChance,
            });
            const first = cardsRef.current.find((c) => c.id === firstId);
            const second = cardsRef.current.find((c) => c.id === secondId);
            if (!first || !second) return;

            memoryRef.current = remember(memoryRef.current, first.face, first.id);
            memoryRef.current = remember(memoryRef.current, second.face, second.id);
            playSound(FLIP_SOUND, 0.35);
            flipCards([firstId, secondId]);
            selectedRef.current = [firstId, secondId];
            setSelected([firstId, secondId]);
            resolveTurn(firstId, secondId);
        }, COMPUTER_THINK_DELAY);

        return () => cancel(timeoutId);
    }, [
        isComputerTurn,
        isLocked,
        cards,
        computerForgetChance,
        schedule,
        cancel,
        flipCards,
        resolveTurn,
    ]);

    useEffect(() => {
        if (cards.length > 0 && cards.every((c) => c.matched)) {
            playSound(WIN_SOUND, 0.45);
            setShowWinner(true);
        }
    }, [cards]);

    const interactionDisabled = isLocked || isComputerTurn || selected.length >= 2;

    const renderGrid = () => (
        <div className={`Board-grid ${sizeClassFor(amountCards)}`}>
            {cards.map((card) => (
                <Card
                    key={card.id}
                    card={card}
                    back={CARD_BACK}
                    disabled={interactionDisabled}
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
                <h2
                    className="Board-title"
                    role="status"
                    aria-live="polite"
                    data-testid="turn-announcement"
                >
                    {isComputerTurn ? (
                        <>
                            Vez do <strong>{players[1].name}</strong>…
                        </>
                    ) : (
                        <>
                            Vez de <strong>{players[turn].name}</strong>
                        </>
                    )}
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
                activeLabel={players[1].isComputer ? "Jogando" : "Sua vez"}
            />

            {showWinner && (
                <WinnerPanel
                    players={players.map((p) => ({ name: p.name, score: p.score }))}
                    computerName={players[1].isComputer ? players[1].name : undefined}
                    onRestart={resetGame}
                    onNewGame={onExit}
                />
            )}
        </div>
    );
};

export default Board;
