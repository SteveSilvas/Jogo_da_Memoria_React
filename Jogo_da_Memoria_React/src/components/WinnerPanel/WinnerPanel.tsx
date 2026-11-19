import React from "react";
import "./winnerPanel.css";

type WinnerPanelProps = {
    players: { name: string; score: number }[];
    computerName?: string;
    onRestart: () => void;
    onNewGame: () => void;
};

const WinnerPanel = ({
    players,
    computerName,
    onRestart,
    onNewGame,
}: WinnerPanelProps) => {
    const best = Math.max(...players.map((p) => p.score));
    const winners = players.filter((p) => p.score === best);
    const isDraw = winners.length > 1;

    const computerWon = !isDraw && winners[0].name === computerName;

    const headline = isDraw
        ? "Empate!"
        : computerWon
          ? `${winners[0].name} venceu!`
          : `Parabéns, ${winners[0].name}!`;

    const subtitle = isDraw
        ? "Ninguém venceu desta vez"
        : computerWon
          ? "tente de novo na próxima rodada"
          : "você venceu o jogo!";

    return (
        <div className="WinnerOverlay" role="dialog" aria-modal="true">
            <div className="WinnerPanel">
                <p className="WinnerPanel-emoji" aria-hidden="true">
                    {isDraw ? "🤝" : "🏆"}
                </p>
                <h2 className="WinnerPanel-title">{headline}</h2>
                <p className="WinnerPanel-subtitle">
                    {subtitle}
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
                    <button className="Button" onClick={onRestart}>
                        Jogar de novo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinnerPanel;
