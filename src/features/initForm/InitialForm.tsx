import React, { useState } from "react";
import "./initalForm.css";


const InitialForm = (props:any)=>{
    const [player1, setPlayer1] = useState<string>("");
    const [player2, setPlayer2] = useState<string>("");
    const [amountCards, setAmountCards] = useState<string>("");

    const handleSubmitForm =()=>{
        props.submitForm(
            {
                player1: player1,
                player2: player2,
                amountCards: amountCards
            }
        );
    }

    return (
        <div className="Page FlexCenter">
            <div className='primaryTitle'>
                <h1 >Jogo da memória</h1>
            </div>
            <form
                onSubmit={handleSubmitForm}
                className="Coluna Formulario "
            >
                <div className="Row FlexCenter">
                    <label className="Label">
                        Cartas:
                    </label>
                    <select
                        className="Input Select"
                        id="quantidadeCartas"
                        onChange={(e) =>setAmountCards(e.target.value)}
                        value={10}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={40}>40</option>
                    </select>
                </div>
                <div className="Row FlexCenter">
                    <label className="Label">Jogador(a) 1:</label>
                    <input
                        className="Input" 
                        type="text"
                        onChange={(e) => setPlayer1(e.target.value)}
                        placeholder="Nome"
                        required
                    />
                </div>
                <div className="Row FlexCenter">
                    <label className="Label">Jogador(a) 2:</label>
                    <input
                        className="Input"
                        type="text"
                        onChange={(e) => setPlayer2(e.target.value)}
                        placeholder="Nome"
                        required
                    />
                </div>
                <div className="FlexCenter">
                    <button className="Button" type="submit">Jogar</button>
                </div>
            </form>
        </div>
    );
}

export default InitialForm;