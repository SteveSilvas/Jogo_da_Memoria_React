import React, { useId } from "react";
import { isDraw as computeIsDraw, winnerHeadline } from "../../utils/gameResult";
import "./winnerPanel.css";

type WinnerPanelProps = {
    players: { name: string; score: number }[];
    onRestart: () => void;
    onNewGame: () => void;
};

const WinnerPanel = ({ players, onRestart, onNewGame }: WinnerPanelProps) => {
    const titleId = useId();
    const scoresId = useId();
    const isDraw = computeIsDraw(players);
    const headline = winnerHeadline(players);

    return (
        <div
            className="WinnerOverlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={scoresId}
        >
            <div className="WinnerPanel">
                <p className="WinnerPanel-emoji" aria-hidden="true">
                    {isDraw ? "🤝" : "🏆"}
                </p>
                <h2 className="WinnerPanel-title" id={titleId}>
                    {headline}
                </h2>
                <p className="WinnerPanel-subtitle">
                    {isDraw ? "Ninguém venceu desta vez" : "você venceu o jogo!"}
                </p>

                <ul className="WinnerPanel-scores" id={scoresId}>
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
                    <button className="Button" onClick={onRestart}>
                        Jogar de novo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinnerPanel;
