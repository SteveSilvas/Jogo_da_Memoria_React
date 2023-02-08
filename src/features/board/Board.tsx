import React, { useEffect, useState } from "react";
import Card from "../../components/card/Card";
import "./board.css";
import MoveType from "../../@Types/MoveType";
import ScoreType from "../../@Types/ScoreType";
import Scoreboard from "../../components/Scoreboard/Scoreboard";
import CardType from "../../@Types/CardType";

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
                    disabled:false,
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
    const [showWinner, setShowWinner] = useState<boolean>();
    const [winner, setWinner] = useState<string>();
    useEffect(() => {
        if (cardsList.length == 0) {
            alert("Jogo Acabou");

            countWinner();
            setShowWinner(true)
        }

    }, [cardsList]);

    const countWinner = () => {
        let scorePlayer1: number = 0;
        let scorePlayer2: number = 0;

        if (!score || !score.moves) return;
        score.moves.map((move) => {
            if (move.point) {
                if (move.player == player1) {
                    scorePlayer1++;
                } else {
                    scorePlayer2++;
                }
            }
        })

        updateWinner(scorePlayer1, scorePlayer2);

    }

    const updateWinner = (scorePlayer1: number, scorePlayer2: number)=>{
        if(scorePlayer1 > scorePlayer2){
            setWinner(player1)
        }else if(scorePlayer1 < scorePlayer2){
            setWinner(player2)
        }
        else{
            setWinner("NINGUÉM");
        }
    }

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
                disabled={card.disabled}
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
                c.disabled = true;
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
    }

    const turnBack = () => {
        if (!cardsList) return;
        let cardsPrev: CardType[] = cardsList.map((c) => {
            return { ...c, turn: false, disabled: false };
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
        images.push(
            "https://cdn-icons-png.flaticon.com/512/845/845922.png?w=826&t=st=1675884421~exp=1675885021~hmac=35d12bf147a6f3cd8e3c2f0abaa1ec1d6fd07419c85490e43fc22d56841add22"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-alien-selfie-com-telefone-dos-desenhos-animados-vector-icone-ilustracao-ciencia-tecnologia-icone-isolado-plano_138676-5862.jpg?w=826&t=st=1675884465~exp=1675885065~hmac=749a482ea98ee0092d6dd09cb69e4583d14353980654784a3f12ce89bd60e1f8"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/cobranca-mao-desenhado-espaco-adesivos_23-2148262668.jpg?w=826&t=st=1675884505~exp=1675885105~hmac=3cacc7c15208132c27d018d4e9f095ec979dda20cd101b1ec2649b2544cfbeb9"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/logotipo-de-vetor-de-cabeca-alienigena-verde_43623-1083.jpg?w=826&t=st=1675884530~exp=1675885130~hmac=93caf0a70562bf658284e02c51b8f99f790bed30d9e28b25f728153c67297ac6"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/conceito-de-abducao-ufo-com-design-plano_23-2147895316.jpg?w=826&t=st=1675884569~exp=1675885169~hmac=7ef323623fd4dbfa8f08e6ab245b2228d26ea4eec6b4c768b1a336c1d3dd4229"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/fundo-de-ufo-alienigena-com-ilustracao-vetorial-realista-de-simbolos-de-viagem-de-galaxia_1284-75916.jpg?w=1380&t=st=1675884585~exp=1675885185~hmac=acba91b0357c36f3d51f8b22598b7aa10eff23a41a4796325d9863145d66eedc"
        );
        images.push(
            "https://t4.ftcdn.net/jpg/00/74/99/39/240_F_74993949_LzROm1IlxvGxU8mKQH1JEYpf9eCQ4n8G.jpg"
        );
        images.push(
            "https://as2.ftcdn.net/v2/jpg/03/05/83/25/1000_F_305832532_GRGMcqBeZxexzPh9h7mmVYRROLxAq08x.jpg"
        );
        images.push(
            "https://as1.ftcdn.net/v2/jpg/05/60/15/84/1000_F_560158451_WETDExVewhcsHNVScY2rqbaOKowpYiSg.jpg"
        );
        images.push(
            "https://as1.ftcdn.net/v2/jpg/04/32/11/86/1000_F_432118667_WDTH0tD8TmJwaxzRkPFhxjfkN4Aq0RgN.jpg"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/extraterrestre-de-bigode-usando-chapeu-de-balde_43623-895.jpg?w=826&t=st=1673471276~exp=1673471876~hmac=7e99f893b4df4093f78b46c1a1371d2777d5d544cd80b06d2136cb97cb962d23"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-astronauta-e-casal-alienigena-juntos-desenhos-animados-icone-ilustracao-vetorial-ciencia-tecnologia-icone_138676-5945.jpg?w=826&t=st=1673471305~exp=1673471905~hmac=c630fa1039f165e6111c90168f884c77fd0840e56b54d272c3eea1306dba8720"
        );
        images.push(
            "https://as1.ftcdn.net/v2/jpg/02/92/72/68/1000_F_292726899_B5jqm2BGw8P4Lpg5LDdaOMhMxArHfNDh.jpg"
        );
        images.push(
            "https://as1.ftcdn.net/v2/jpg/01/15/17/86/1000_F_115178662_THDuvy4gqEU4Jjiioa2tyxbyreJqeupy.jpg"
        );
        images.push(
            "https://as1.ftcdn.net/v2/jpg/03/19/29/44/1000_F_319294410_vZta4reqVQ4pPuWv3wDmhbv9m1UVXQ4I.jpg"
        );
        images.push(
            "https://as2.ftcdn.net/v2/jpg/02/84/22/09/1000_F_284220973_goaCWC98rRabIFTV9HJeQJr3AgpPfSXB.jpg"
        );

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

    const restartGame = () => {
        setCardsList(buildCards());
        setShowWinner(false);
        setWinner("");
        setScore(undefined);
    }

    const renderWinnerPanel = () => {
        return showWinner ? <div className="WinniePanel">
            Parabens {winner} você venceu!
        </div> : <></>
    }
    return (
        <div className="BoardContainer">
            <Scoreboard moves={score ? score.moves : []} player={player1} />
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

            <Scoreboard moves={score ? score.moves : []} player={player2} />

        </div>
    );
}


export default Board;
