import React, { useEffect, useRef } from "react";
import { formatDuration } from "../../utils/time";
import "./winnerPanel.css";

type WinnerPanelProps = {
    players: { name: string; score: number }[];
    moves?: number;
    seconds?: number;
    onRestart: () => void;
    onNewGame: () => void;
};

const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WinnerPanel = ({
    players,
    moves,
    seconds,
    onRestart,
    onNewGame,
}: WinnerPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const onNewGameRef = useRef(onNewGame);
    onNewGameRef.current = onNewGame;

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        primaryRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onNewGameRef.current();
                return;
            }
            if (event.key !== "Tab") return;

            const panel = panelRef.current;
            if (!panel) return;
            const focusable = Array.from(
                panel.querySelectorAll<HTMLElement>(FOCUSABLE),
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || !panel.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, []);

    const best = Math.max(...players.map((p) => p.score));
    const winners = players.filter((p) => p.score === best);
    const isDraw = winners.length > 1;

    const headline = isDraw
        ? "Empate!"
        : `Parabéns, ${winners[0].name}!`;

    return (
        <div
            className="WinnerOverlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
        >
            <div className="WinnerPanel" ref={panelRef}>
                <p className="WinnerPanel-emoji" aria-hidden="true">
                    {isDraw ? "🤝" : "🏆"}
                </p>
                <h2 className="WinnerPanel-title" id="winner-title">
                    {headline}
                </h2>
                <p className="WinnerPanel-subtitle">
                    {isDraw ? "Ninguém venceu desta vez" : "você venceu o jogo!"}
                </p>

                {(moves !== undefined || seconds !== undefined) && (
                    <dl className="WinnerPanel-summary">
                        {moves !== undefined && (
                            <div className="WinnerPanel-summaryItem">
                                <dt>Jogadas</dt>
                                <dd>{moves}</dd>
                            </div>
                        )}
                        {seconds !== undefined && (
                            <div className="WinnerPanel-summaryItem">
                                <dt>Tempo</dt>
                                <dd>{formatDuration(seconds)}</dd>
                            </div>
                        )}
                    </dl>
                )}

                <ul className="WinnerPanel-scores">
                    {players.map((p) => (
                        <li key={p.name} className="WinnerPanel-score">
                            <span className="WinnerPanel-scoreName">{p.name}</span>
                            <span className="WinnerPanel-scoreValue">{p.score}</span>
                        </li>
                    ))}
                </ul>

                <div className="WinnerPanel-actions">
                    <button className="Button Button-ghost" onClick={onNewGame}>
                        Novo jogo
                    </button>
                    <button className="Button" onClick={onRestart} ref={primaryRef}>
                        Jogar de novo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinnerPanel;
