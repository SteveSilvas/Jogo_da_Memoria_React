import React from "react";
import "./scoreboard.css";

type ScoreboardProps = {
    name: string;
    score: number;
    active: boolean;
    pairs: string[];
};

const Scoreboard = ({ name, score, active, pairs }: ScoreboardProps) => {
    return (
        <aside className={`Scoreboard${active ? " is-active" : ""}`}>
            <header className="Scoreboard-header">
                <span className="Scoreboard-name" title={name}>
                    {name}
                </span>
                {active && <span className="Scoreboard-turn">Sua vez</span>}
            </header>
            <p className="Scoreboard-score">
                <span className="Scoreboard-scoreValue">{score}</span>
                <span className="Scoreboard-scoreLabel">
                    {score === 1 ? "par" : "pares"}
                </span>
            </p>
            <div className="Scoreboard-pairs">
                {pairs.map((face, i) => (
                    <img
                        key={i}
                        className="Scoreboard-pair"
                        src={face}
                        alt="Par conquistado"
                        draggable={false}
                    />
                ))}
            </div>
        </aside>
    );
};

export default Scoreboard;
