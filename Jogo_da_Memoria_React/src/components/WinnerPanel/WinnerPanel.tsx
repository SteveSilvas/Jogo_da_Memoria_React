import React, { useEffect, useId, useRef } from "react";
import "./winnerPanel.css";

type WinnerPanelProps = {
    players: { name: string; score: number }[];
    onRestart: () => void;
    onNewGame: () => void;
    returnFocusTo?: React.RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusable = (container: HTMLElement): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.tabIndex !== -1,
    );

const canFocus = (
    element: HTMLElement | null | undefined,
): element is HTMLElement => {
    if (!element || !element.isConnected) return false;
    if (element.hasAttribute("disabled")) return false;
    if (element.getAttribute("aria-disabled") === "true") return false;
    return element.tabIndex !== -1;
};

const WinnerPanel = ({
    players,
    onRestart,
    onNewGame,
    returnFocusTo,
}: WinnerPanelProps) => {
    const best = Math.max(...players.map((p) => p.score));
    const winners = players.filter((p) => p.score === best);
    const isDraw = winners.length > 1;

    const headline = isDraw
        ? "Empate!"
        : `Parabéns, ${winners[0].name}!`;

    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const primaryActionRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const latestRef = useRef({ onNewGame, returnFocusTo });

    useEffect(() => {
        latestRef.current = { onNewGame, returnFocusTo };
    });

    useEffect(() => {
        const active = document.activeElement;
        previousFocusRef.current = active instanceof HTMLElement ? active : null;

        (primaryActionRef.current ?? panelRef.current)?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                latestRef.current.onNewGame();
                return;
            }
            if (event.key !== "Tab") return;

            const panel = panelRef.current;
            if (!panel) return;

            const focusable = getFocusable(panel);
            const first = focusable[0] ?? panel;
            const last = focusable[focusable.length - 1] ?? panel;
            const current = document.activeElement;
            const isOutside = !current || !panel.contains(current);

            if (
                event.shiftKey &&
                (isOutside || current === panel || current === first)
            ) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                (isOutside || current === panel || current === last)
            ) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);

            const preferred = latestRef.current.returnFocusTo?.current;
            const fallback = previousFocusRef.current;
            if (canFocus(preferred)) {
                preferred.focus();
            } else if (canFocus(fallback)) {
                fallback.focus();
            }
        };
    }, []);

    return (
        <div className="WinnerOverlay">
            <div
                ref={panelRef}
                className="WinnerPanel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <p className="WinnerPanel-emoji" aria-hidden="true">
                    {isDraw ? "🤝" : "🏆"}
                </p>
                <h2 id={titleId} className="WinnerPanel-title">
                    {headline}
                </h2>
                <p className="WinnerPanel-subtitle">
                    {isDraw ? "Ninguém venceu desta vez" : "você venceu o jogo!"}
                </p>

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
                    <button
                        ref={primaryActionRef}
                        className="Button"
                        onClick={onRestart}
                    >
                        Jogar de novo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinnerPanel;
