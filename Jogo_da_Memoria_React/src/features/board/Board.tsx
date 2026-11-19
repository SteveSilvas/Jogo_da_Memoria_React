import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardType from "../../@Types/CardType";
import { CARD_BACK } from "../../data/cardFaces";
import {
    buildDeck,
    countMatchedPairs,
    isGameOver,
    isMatch,
    nextTurn,
} from "../../utils/gameRules";
import { playSound, preloadSounds } from "../../utils/sound";
import Card from "../../components/Card/Card";
import Scoreboard from "../../components/Scoreboard/Scoreboard";
import SoundToggle from "../../components/SoundToggle/SoundToggle";
import { useGameTimer } from "../../hooks/useGameTimer";
import {
    chooseMove,
    freeCardIds,
    rememberRevealed,
    type ComputerMemory,
} from "../../utils/computerPlayer";
import { formatDuration } from "../../utils/time";
import {
    clearGame,
    loadGame,
    saveGame,
    type StoredGame,
} from "../../utils/gameStorage";
import WinnerPanel from "../../components/WinnerPanel/WinnerPanel";
import "./board.css";

const MATCH_SOUND = new URL("../../assets/songs/ES_Beep Sonar Blip 1 - SFX Producer.mp3", import.meta.url).href;
const FLIP_SOUND = new URL("../../assets/songs/transition.mp3", import.meta.url).href;
const WIN_SOUND = new URL("../../assets/songs/ES_PREL Glitch 15 - SFX Producer.mp3", import.meta.url).href;

const SOUNDS = [FLIP_SOUND, MATCH_SOUND, WIN_SOUND];

const MATCH_DELAY = 900;
const COMPUTER_DELAY = 750;

type BoardProps = {
    player1: string;
    player2: string;
    amountCards: number;
    /** O jogador 2 e controlado pelo computador. */
    computerOpponent?: boolean;
    /** Retoma a partida salva, quando os jogadores e o tamanho conferem. */
    restoreSaved?: boolean;
    onExit: () => void;
};

const restoredGame = (
    restoreSaved: boolean | undefined,
    player1: string,
    player2: string,
    amountCards: number,
): StoredGame | null => {
    if (!restoreSaved) return null;
    const saved = loadGame();
    if (!saved) return null;
    const sameSetup =
        saved.amountCards === amountCards &&
        saved.players[0].name === player1 &&
        saved.players[1].name === player2;
    return sameSetup ? saved : null;
};

type Player = { name: string; score: number; pairs: string[] };

const sizeClassFor = (amountCards: number): string =>
    `grid-${amountCards}`;

const initialPlayers = (player1: string, player2: string): [Player, Player] => [
    { name: player1, score: 0, pairs: [] },
    { name: player2, score: 0, pairs: [] },
];

const Board = ({
    player1,
    player2,
    amountCards,
    computerOpponent = false,
    restoreSaved,
    onExit,
}: BoardProps) => {
    // O estado salvo e lido uma unica vez, na montagem.
    const [restored] = useState(() =>
        restoredGame(restoreSaved, player1, player2, amountCards),
    );

    const [cards, setCards] = useState<CardType[]>(
        () => restored?.cards ?? buildDeck(amountCards),
    );
    const [selected, setSelected] = useState<number[]>(
        () => restored?.selected ?? [],
    );
    const [turn, setTurn] = useState<0 | 1>(() => restored?.turn ?? 0);
    const [players, setPlayers] = useState<[Player, Player]>(
        () => restored?.players ?? initialPlayers(player1, player2),
    );
    const [isLocked, setIsLocked] = useState(false);
    const [showWinner, setShowWinner] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const [moves, setMoves] = useState(() => restored?.moves ?? 0);

    const {
        seconds: elapsedSeconds,
        start: startTimer,
        stop: stopTimer,
        reset: resetTimer,
    } = useGameTimer(restored?.seconds ?? 0);

    const timeoutRef = useRef<number | null>(null);
    const memoryRef = useRef<ComputerMemory>(new Map());
    const computerTimersRef = useRef<number[]>([]);

    const clearComputerTimers = useCallback(() => {
        for (const id of computerTimersRef.current) window.clearTimeout(id);
        computerTimersRef.current = [];
    }, []);

    useEffect(() => clearComputerTimers, [clearComputerTimers]);

    useEffect(() => {
        preloadSounds(SOUNDS);
    }, []);

    const clearPendingTimeout = useCallback(() => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

    const resetGame = useCallback(() => {
        clearPendingTimeout();
        clearGame();
        setCards(buildDeck(amountCards));
        setSelected([]);
        setTurn(0);
        setPlayers(initialPlayers(player1, player2));
        setIsLocked(false);
        setShowWinner(false);
        setAnnouncement("");
        setMoves(0);
        memoryRef.current = new Map();
        clearComputerTimers();
        resetTimer();
    }, [
        amountCards,
        player1,
        player2,
        clearPendingTimeout,
        clearComputerTimers,
        resetTimer,
    ]);

    const totalPairs = useMemo(() => Math.floor(amountCards / 2), [amountCards]);

    // O computador so memoriza cartas que estiveram abertas no tabuleiro.
    useEffect(() => {
        if (!computerOpponent) return;
        rememberRevealed(memoryRef.current, cards);
    }, [cards, computerOpponent]);

    // Espelho sincrono do estado: o computador joga em sequencia (duas cartas
    // com atraso entre elas), entao precisa ler o resultado do primeiro flip
    // antes do segundo, sem esperar o re-render.
    const stateRef = useRef({ cards, selected, turn, players, isLocked });
    stateRef.current = { cards, selected, turn, players, isLocked };

    const revealCard = useCallback(
        (cardId: number, owner: 0 | 1) => {
            const snap = stateRef.current;
            if (snap.isLocked || snap.selected.length >= 2) return;

            const card = snap.cards.find((c) => c.id === cardId);
            if (!card || card.matched || card.flipped) return;

            playSound(FLIP_SOUND, 0.35);
            const nextCards = snap.cards.map((c) =>
                c.id === cardId ? { ...c, flipped: true } : c,
            );
            const nextSelected = [...snap.selected, cardId];
            stateRef.current = {
                ...snap,
                cards: nextCards,
                selected: nextSelected,
            };
            setCards(nextCards);
            setSelected(nextSelected);
            startTimer();

            if (nextSelected.length < 2) return;

            setMoves((prev) => prev + 1);

            const [firstId, secondId] = nextSelected;
            const first = nextCards.find((c) => c.id === firstId);
            const second = nextCards.find((c) => c.id === secondId);
            if (!first || !second) return;

            const ownerName = snap.players[owner].name;

            if (isMatch(first, second)) {
                playSound(MATCH_SOUND, 0.5);
                const matchedCards = nextCards.map((c) =>
                    c.id === firstId || c.id === secondId
                        ? { ...c, matched: true, flipped: true }
                        : c,
                );
                const nextPlayers: [Player, Player] = [
                    { ...snap.players[0], pairs: [...snap.players[0].pairs] },
                    { ...snap.players[1], pairs: [...snap.players[1].pairs] },
                ];
                nextPlayers[owner].score += 1;
                nextPlayers[owner].pairs.push(first.face);

                stateRef.current = {
                    ...stateRef.current,
                    cards: matchedCards,
                    selected: [],
                    players: nextPlayers,
                };
                setCards(matchedCards);
                setPlayers(nextPlayers);
                setSelected([]);
                setAnnouncement(`Par encontrado! ${ownerName} joga de novo.`);
                return;
            }

            stateRef.current = { ...stateRef.current, isLocked: true };
            setIsLocked(true);
            timeoutRef.current = window.setTimeout(() => {
                setCards((prev) => {
                    const hidden = prev.map((c) =>
                        c.id === firstId || c.id === secondId
                            ? { ...c, flipped: false }
                            : c,
                    );
                    stateRef.current = {
                        ...stateRef.current,
                        cards: hidden,
                        selected: [],
                        turn: nextTurn(owner),
                        isLocked: false,
                    };
                    return hidden;
                });
                setSelected([]);
                setTurn(nextTurn(owner));
                setIsLocked(false);
                setAnnouncement(
                    `Carta nao e um par. Agora e a vez de ${snap.players[nextTurn(owner)].name}.`,
                );
                timeoutRef.current = null;
            }, MATCH_DELAY);
        },
        [startTimer],
    );

    const handleSelect = useCallback(
        (card: CardType) => {
            if (computerOpponent && turn === 1) return;
            revealCard(card.id, turn);
        },
        [computerOpponent, revealCard, turn],
    );

    // Vez do computador: espera um instante, vira a primeira carta, espera de
    // novo e vira a segunda, para dar tempo de acompanhar a jogada.
    useEffect(() => {
        if (!computerOpponent || showWinner) return;
        if (turn !== 1 || isLocked || selected.length > 0) return;

        const plan = chooseMove(memoryRef.current, freeCardIds(cards));
        if (!plan) return;

        const timers: number[] = [];
        timers.push(
            window.setTimeout(() => {
                revealCard(plan[0], 1);
                timers.push(
                    window.setTimeout(() => revealCard(plan[1], 1), COMPUTER_DELAY),
                );
            }, COMPUTER_DELAY),
        );

        // Os timers vivem em ref para o cleanup nao cancelar a segunda carta
        // quando o primeiro flip muda o estado.
        computerTimersRef.current.push(...timers);
    }, [
        computerOpponent,
        showWinner,
        turn,
        isLocked,
        selected.length,
        cards,
        revealCard,
    ]);

    useEffect(() => {
        if (isGameOver(cards)) {
            playSound(WIN_SOUND, 0.45);
            stopTimer();
            setShowWinner(true);
            setAnnouncement("Fim de jogo.");
            clearGame();
        }
    }, [cards]);

    // Grava a cada estado relevante. Fica de fora do par em avaliacao
    // (isLocked) para nao salvar duas cartas abertas de uma jogada errada.
    useEffect(() => {
        if (isLocked || isGameOver(cards)) return;
        saveGame({
            cards,
            selected,
            turn,
            players,
            moves,
            seconds: elapsedSeconds,
            amountCards,
        });
    }, [
        cards,
        selected,
        turn,
        players,
        moves,
        elapsedSeconds,
        amountCards,
        isLocked,
    ]);

    const renderGrid = () => (
        <div className={`Board-grid ${sizeClassFor(amountCards)}`}>
            {cards.map((card, index) => (
                <Card
                    key={card.id}
                    card={card}
                    back={CARD_BACK}
                    disabled={isLocked || selected.length >= 2}
                    index={index}
                    total={cards.length}
                    onSelect={handleSelect}
                />
            ))}
        </div>
    );

    return (
        <div className="BoardContainer">
            <SoundToggle />
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
                <p className="sr-only" aria-live="polite" role="status">
                    {announcement}
                </p>
                <p className="Board-progress">
                    <span>
                        {totalPairs} pares · {countMatchedPairs(cards)} encontrados
                    </span>
                    <span className="Board-stats">
                        <span className="Board-stat">
                            <span className="Board-statLabel">Jogadas</span>
                            <strong>{moves}</strong>
                        </span>
                        <span className="Board-stat">
                            <span className="Board-statLabel">Tempo</span>
                            <strong>{formatDuration(elapsedSeconds)}</strong>
                        </span>
                    </span>
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
                    seconds={elapsedSeconds}
                    onRestart={resetGame}
                    onNewGame={onExit}
                />
            )}
        </div>
    );
};

export default Board;
