import React, { useEffect, useState } from "react";
import { isMuted, subscribeMuted, toggleMuted } from "../../utils/soundPreferences";
import "./soundToggle.css";

const SoundToggle = () => {
    const [muted, setMutedState] = useState(isMuted);

    useEffect(() => subscribeMuted(setMutedState), []);

    return (
        <button
            type="button"
            className="SoundToggle"
            onClick={toggleMuted}
            aria-pressed={muted}
            aria-label={muted ? "Ativar som" : "Desativar som"}
            title={muted ? "Ativar som" : "Desativar som"}
        >
            <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
        </button>
    );
};

export default SoundToggle;
