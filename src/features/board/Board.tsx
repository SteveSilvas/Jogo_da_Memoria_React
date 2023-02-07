import React, { useEffect, useState } from "react";
import Card from "../../components/card/Card";
import "./board.css";
import MoveType from "../../@Types/MoveType";
import ScoreType from "../../@Types/ScoreType";
import Scoreboard from "../../components/Scoreboard/Scoreboard";

function Board(props: any) {

    const buildMoveNull = (): MoveType => {
        return {
            id: 1,
            player: jogadorDaVez,
            round: 1,
            card1: undefined,
            card2: undefined,
            point: 0
        }
    }

    const buildPathImagesMirror = (): string[] => {
        const paths = [];
        paths.push(...buildPathsImages());
        paths.push(...buildPathsImages());
        return embaralaDeck(paths);
    }

    const buildCards = (): CardType[] => {
        let cards: CardType[] = [];
        let images: string[] = buildPathImagesMirror();
        let src: string =
            "https://as1.ftcdn.net/v2/jpg/01/26/77/44/1000_F_126774473_owGnxkviYhvDovg6AsWO9gcGlqjk5eqj.jpg";

        images.map((img, i) => {
            cards.push(
                {
                    id: i,
                    className: "Card",
                    src: src,
                    verso: img,
                    turn: false,
                }
            );
        });

        return cards;
    }

    const player1 = props.player1;
    const player2 = props.player2;
    const [jogadorDaVez, setJogadorDaVez] = useState<string>(player1);
    const [move, setMove] = useState<MoveType>(buildMoveNull());
    const [cardsList, setCardsList] = useState<CardType[]>(buildCards());
    const [score, setScore] = useState<ScoreType>();
    const [showWinner, setShowWinner]= useState<boolean>();

    useEffect(() => {
        if (cardsList.length == 0) {
            alert("Jogo Acabou");
            setShowWinner(true)
        }

    }, [cardsList]);


//     useEffect(() => {
//         // if (cardsList.length == 0) {
//         //     alert("Jogo Acabou");
//         // }
//         alert("Score mudou")
// console.log(score)


//     }, [score]);



    function renderCards() {
        if (!cardsList) return;
        let cardsElements: any[] = [];
        cardsList.map((card: CardType, i) => {
            cardsElements.push(<Card
                key={i}
                id={i}
                className="Card"
                src={card.src}
                verso={card.verso}
                turn={card.turn}
                clickCard={clickCardHandle}
            />)
        })

        return cardsElements;
    }

    function clickCardHandle(card: CardType): void {
        turnCard(card);
        move.player = jogadorDaVez;
        if (move.round == 1) {
            move.card1 = card;
        }
        else {
            move.card2 = card;
            scoreInit();
        }

        setRound();
    }

    const turnCard = (card: CardType): void => {
        let cardsPrev = cardsList ? cardsList.map((c) => {
            if (card.id == c.id) {
                c.turn = true;
            }
            return c;
        }) : [];
        setCardsList(cardsPrev)
    }

    const pairVerify = (): boolean => {
        if (move) {
            if (move.card1 && move.card2) {
                return move.card1.verso == move.card2.verso;
            }
        }
        return false;
    }

    const scoreInit = (): void => {
        let isPair: boolean = pairVerify();

        setScore({
            moves: buildMoves(),
            pairs: buildScorePair(isPair)
        })
        
        if (!isPair) {
            setTimeout(() => {
                turnBack();
                setPlayer();
            }, 2000);
        }
    }

    const buildScorePair = (isPair: boolean): CardType[] | undefined => {
        var pairsPrev: CardType[] | undefined = score ? score.pairs : undefined;

        if (isPair) {
            alert("Par encontrado")

            let pair = getPair();
            if (pair) {
                move.point = 1;
                pair.map((par) => {
                    if (pairsPrev) {
                        pairsPrev.push(par);
                    }
                    else {
                        pairsPrev = [par]
                    }
                });

                removePair();
            }
        }
        return pairsPrev;
    }

    const buildMoves = (): MoveType[] => {
        let movesPrev: MoveType[] | undefined = score ? score.moves : undefined;
        if (movesPrev) {
            movesPrev.push(move);
        }
        else {
            movesPrev = [move];
        }
        
        clearMove();
        
        alert(move.player)
        return movesPrev;

    }

    const setRound = () => {
        if (move.round == 1)
            move.round = 2;
        else move.round = 1
    }

    const getPair = (): CardType[] | undefined => {
        if (!move) return;
        if (!move.card1 || !move.card1.verso) return;

        const moveSrc: string = move.card1.verso;
        return cardsList.filter((c) => c.verso === moveSrc)
    }


    const removePair = (): void => {
        if (!move) return;
        if (!move.card1 || !move.card1.verso) return;
        const moveSrc: string = move.card1.verso;

        const cardsReturn = cardsList ? cardsList.filter((c) => c.verso !== moveSrc) : [];
        setCardsList(cardsReturn);
    }


    const clearMove = (): void => {
        setMove(buildMoveNull());
        console.log(move.player)
    }

    const turnBack = () => {
        if (!cardsList) return;
        let cardsPrev: CardType[] = cardsList.map((c) => {
            return { ...c, turn: false };
        });
        setCardsList(cardsPrev);
    }

    const setPlayer = () => {
        if (jogadorDaVez === player1) {
            setJogadorDaVez(player2);
        }
        else { setJogadorDaVez(player1); }
    }

    function buildPathsImages() {
        const amount = props.amountCards / 2;
        var images: string[] = [];
        images.push(
            "https://cdn.dooca.store/1814/products/wl4jmbx64uafsz0ci1fsqofkb0wbnr6bitqp.jpg?v=1621885027&webp=0"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-alien-lean-na-ilustracao-do-icone-do-vetor-dos-desenhos-animados-ufo-conceito-de-icone-de-tecnologia-de-ciencia-isolado_138676-5983.jpg?w=826&t=st=1673471224~exp=1673471824~hmac=f36ce383c1bea527128347048d8cec23b6cc7f0b53b384b1ec3cb3bca96c546d"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-astronauta-alienigena-flutuando-no-espaco-desenhos-animados-icone-ilustracao-vetorial-tecnologia-isolado_138676-5884.jpg?w=826&t=st=1673471242~exp=1673471842~hmac=2a97822e4e0d21ffe6c5f4afb21d9215ac88aebbd15782d1e674e5e240628c93"
        );

        images.push(
            "https://cdn.dooca.store/1814/products/wl4jmbx64uafsz0ci1fsqofkb0wbnr6bitqp.jpg?v=1621885027&webp=0"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-alien-lean-na-ilustracao-do-icone-do-vetor-dos-desenhos-animados-ufo-conceito-de-icone-de-tecnologia-de-ciencia-isolado_138676-5983.jpg?w=826&t=st=1673471224~exp=1673471824~hmac=f36ce383c1bea527128347048d8cec23b6cc7f0b53b384b1ec3cb3bca96c546d"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-astronauta-alienigena-flutuando-no-espaco-desenhos-animados-icone-ilustracao-vetorial-tecnologia-isolado_138676-5884.jpg?w=826&t=st=1673471242~exp=1673471842~hmac=2a97822e4e0d21ffe6c5f4afb21d9215ac88aebbd15782d1e674e5e240628c93"
        );

        // versos.push("https://img.freepik.com/vetores-gratis/extraterrestre-de-bigode-usando-chapeu-de-balde_43623-895.jpg?w=826&t=st=1673471276~exp=1673471876~hmac=7e99f893b4df4093f78b46c1a1371d2777d5d544cd80b06d2136cb97cb962d23");
        // versos.push("https://img.freepik.com/vetores-gratis/bonito-astronauta-e-casal-alienigena-juntos-desenhos-animados-icone-ilustracao-vetorial-ciencia-tecnologia-icone_138676-5945.jpg?w=826&t=st=1673471305~exp=1673471905~hmac=c630fa1039f165e6111c90168f884c77fd0840e56b54d272c3eea1306dba8720");
        // versos.push("https://as1.ftcdn.net/v2/jpg/02/92/72/68/1000_F_292726899_B5jqm2BGw8P4Lpg5LDdaOMhMxArHfNDh.jpg");

        return images.slice(0, amount);
    }

    function embaralaDeck(inputArray: any[]) {
        for (let i = inputArray.length - 1; i > 0; i--) {
            // Escolhendo elemento aleatório
            const j = Math.floor(Math.random() * (i + 1));
            // Reposicionando elemento
            [inputArray[i], inputArray[j]] = [inputArray[j], inputArray[i]];
        }
        // Retornando array com aleatoriedade
        return inputArray;
    }

    const restartGame = ()=>{
        alert("Recomeçando")
        setCardsList(buildCards());
        setScore(undefined);
    }

    const renderWinnerPanel =()=>{
        return showWinner ? <div className="WinniePanel">
            Parabens {jogadorDaVez} você venceu!
        </div> : <></>
    }
    return (
        <div className="BoardContainer">
            <Scoreboard  moves={score ? score.moves : []} player={player1}/>
            <div className="ColumnMain">
                <h2 className="BoardTitle">Vez do Jogador {jogadorDaVez}</h2>
                <div className="Board">
                    {renderCards()}
                    {renderWinnerPanel()}
                </div>
                <nav className="Footer">
                <button className="Button" onClick={() => props.turnBackPage()}>
                        Voltar
                    </button>
                    <button className="Button" onClick={() => restartGame()}>
                        Recaregar
                    </button>
                </nav>
            </div>

            <Scoreboard moves={score ? score.moves : []}  player={player2}/>

        </div>
    );
}


export default Board;
