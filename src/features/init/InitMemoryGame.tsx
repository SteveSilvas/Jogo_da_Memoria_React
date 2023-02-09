


import InitialFormType from "../../@Types/InitialFormType";
import Board from "../board/Board";
import InitialForm from "../initForm/InitialForm";
import "./init.css";
import React, { useState } from "react";

const InitMemoryGame = () => {
    const [amountCards, setAmountCards] = useState<number>();
    const [showBoard, setShowBoard] = useState<boolean>(false);
    const [showForm, setShowForm] = useState<boolean>(true);
    const [player1, setPlayer1] = useState<string>();
    const [player2, setPlayer2] = useState<string>();


    function renderForm() {
        if (showForm) {
            return <InitialForm submitForm={submitFormHandler} />
        }
        else {
            return <></>
        }
    }

    function submitFormHandler(form: InitialFormType) {
        setAmountCards(form.amountCards);
        setPlayer1(form.player1);
        setPlayer2(form.player2);

        setShowBoard(true);
        setShowForm(false);
    }

    const restartHandle = () => {
        setShowBoard(false);
        setShowForm(true);
        clearInformations();
    }

    const clearInformations = () => {
        setAmountCards(0);
        setPlayer1("");
        setPlayer2("");
    }

    function renderBoard() {
        if (showBoard) {
            return (
                <Board
                    amountCards={amountCards || 4}
                    player1={player1}
                    player2={player2}
                    restart={restartHandle}
                ></Board>
            );
        }
    }

    return (
        <div className="Page">
            {renderForm()}
            {renderBoard()}
        </div>
    );
}



export default InitMemoryGame;