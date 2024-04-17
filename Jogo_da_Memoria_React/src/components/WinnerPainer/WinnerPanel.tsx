import WinnerPanelType from "../../@Types/WinnerPanelType";
import React from "react";
import "./WinnerPanel.css";
const WinnerPanel = (props: WinnerPanelType) => {
    let classes = props.className ?? "WinnerPanel";

    const closePanel = (e: any) => {
        e.preventDefault();
        alert("")
        props.closePanel();
    }
    return (
        <div className={classes} onClick={(e) => closePanel(e)}>
            <strong className="WinnerMessage">Parabens <span className="WinnerName">{props.player}</span> você venceu!</strong>
        </div>
    )
}

export default WinnerPanel;