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
import { playSound } from "../../utils/sound";
import Card from "../../components/Card/Card";
import Scoreboard from "../../components/Scoreboard/Scoreboard";
import SoundToggle from "../../components/SoundToggle/SoundToggle";
import { useGameTimer } from "../../hooks/useGameTimer";
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

const MATCH_DELAY = 900;

type BoardProps = {
    player1: string;
    player2: string;
    amountCards: number;
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
        resetTimer();
    }, [amountCards, player1, player2, clearPendingTimeout, resetTimer]);

    const totalPairs = useMemo(() => Math.floor(amountCards / 2), [amountCards]);

    const handleSelect = useCallback(
        (card: CardType) => {
            if (isLocked || selected.length >= 2) return;
            if (card.matched || card.flipped) return;

            playSound(FLIP_SOUND, 0.35);
            const nextSelected = [...selected, card.id];
            setCards((prev) =>
                prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)),
            );
            setSelected(nextSelected);

            startTimer();

            if (nextSelected.length < 2) return;

            setMoves((prev) => prev + 1);

            const [firstId, secondId] = nextSelected;
            const first = cards.find((c) => c.id === firstId);
            const second = cards.find((c) => c.id === secondId);
            if (!first || !second) return;

            if (isMatch(first, second)) {
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
                setAnnouncement(`Par encontrado! ${players[turn].name} joga de novo.`);
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
                setTurn((prev) => nextTurn(prev));
                setIsLocked(false);
                setAnnouncement(
                    `Carta nao e um par. Agora e a vez de ${players[nextTurn(turn)].name}.`,
                );
                timeoutRef.current = null;
            }, MATCH_DELAY);
        },
        [cards, isLocked, selected, turn],
    );

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
