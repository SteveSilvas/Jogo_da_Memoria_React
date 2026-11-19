import React from "react";
import { formatDuration } from "../../utils/formatTime";
import "./winnerPanel.css";

type WinnerPanelProps = {
    players: { name: string; score: number }[];
    moves: number;
    elapsedMs: number;
    onRestart: () => void;
    onNewGame: () => void;
};

const WinnerPanel = ({
    players,
    moves,
    elapsedMs,
    onRestart,
    onNewGame,
}: WinnerPanelProps) => {
    const best = Math.max(...players.map((p) => p.score));
    const winners = players.filter((p) => p.score === best);
    const isDraw = winners.length > 1;

    const headline = isDraw
        ? "Empate!"
        : `Parabéns, ${winners[0].name}!`;

    return (
        <div className="WinnerOverlay" role="dialog" aria-modal="true">
            <div className="WinnerPanel">
                <p className="WinnerPanel-emoji" aria-hidden="true">
                    {isDraw ? "🤝" : "🏆"}
                </p>
                <h2 className="WinnerPanel-title">{headline}</h2>
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

                <dl className="WinnerPanel-summary">
                    <div className="WinnerPanel-summaryItem">
                        <dt className="WinnerPanel-summaryLabel">Jogadas</dt>
                        <dd className="WinnerPanel-summaryValue">{moves}</dd>
                    </div>
                    <div className="WinnerPanel-summaryItem">
                        <dt className="WinnerPanel-summaryLabel">Tempo</dt>
                        <dd className="WinnerPanel-summaryValue">
                            {formatDuration(elapsedMs)}
                        </dd>
                    </div>
                </dl>

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
