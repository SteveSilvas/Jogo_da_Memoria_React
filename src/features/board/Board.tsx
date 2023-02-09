import React, { useEffect, useRef, useState } from "react";
import Card from "../../components/card/Card";
import "./board.css";
import MoveType from "../../@Types/MoveType";
import ScoreType from "../../@Types/ScoreType";
import Scoreboard from "../../components/Scoreboard/Scoreboard";
import CardType from "../../@Types/CardType";
import WinnerPanel from "../../components/WinnerPainer/WinnerPanel";

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

    const buildPathsImages = (): string[] => {
        const amount = props.amountCards / 2;
        var images: string[] = [];
        images.push(
            "https://cdn.dooca.store/1814/products/wl4jmbx64uafsz0ci1fsqofkb0wbnr6bitqp.jpg?v=1621885027&webp=0"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-alien-lean-na-ilustracao-do-icone-do-vetor-dos-desenhos-animados-ufo-conceito-de-icone-de-tecnologia-de-ciencia-isolado_138676-5983.jpg?w=826&t=st=1673471224~exp=1673471824~hmac=f36ce383c1bea527128347048d8cec23b6cc7f0b53b384b1ec3cb3bca96c546d"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/alienigena-bonito-com-ilustracao-de-icone-de-vetor-de-terno-de-astronauta-conceito-de-icone-de-tecnologia-de-ciencia-vetor-premium-isolado-estilo-flat-cartoon_138676-3537.jpg?w=826&t=st=1675962381~exp=1675962981~hmac=cbbe01bdf872c40dd0a6a0144f3a1d6a76f00d9f34240238cc72c572ea3ff732"
        );
        images.push(
            "https://img.freepik.com/fotos-premium/ufo-um-disco-alienigena-pairando-acima-do-campo-nas-nuvens-pairando-imovel-no-ceu-objeto-voador-nao-identificado-invasao-alienigena-vida-extraterrestre-viagem-espacial-nave-espacial-midia-mista_99433-8600.jpg?w=1380"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/conjunto-de-monstros-fofos-design-de-personagem-de-desenho-animado-para-poster-de-produtos-de-bebe-logotipo-e-design-de-embalagem-ilustracao-vetorial_1150-60589.jpg?w=826&t=st=1675961847~exp=1675962447~hmac=9b08933372d8eccf2c798add07da0b6695224a343d71ebb52e1cb0fb1deb79ddd"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-astronauta-alienigena-flutuando-no-espaco-desenhos-animados-icone-ilustracao-vetorial-tecnologia-isolado_138676-5884.jpg?w=826&t=st=1673471242~exp=1673471842~hmac=2a97822e4e0d21ffe6c5f4afb21d9215ac88aebbd15782d1e674e5e240628c93"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-astronauta-e-alienigena-sentado-com-paz-mao-cartoon-vector-icon-ilustracao-ciencia-tecno_138676-6748.jpg?w=826&t=st=1675961657~exp=1675962257~hmac=b97d616fcb47bc66ee87b61cea521d5cce88d114a2fa74f693cabbdc54d70bd7"
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
            "https://img.freepik.com/vetores-gratis/bonito-alienigena-voando-com-ilustracao-do-icone-do-vetor-dos-desenhos-animados-ufo-icone-de-tecnologia-de-ciencia-isolado-plano_138676-6190.jpg?w=826&t=st=1675961497~exp=1675962097~hmac=589e68e279fcc85a27368dc985522647d6fc9838cd485455f7e3e3048708d4f6"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/foguetes-ufo-e-naves-espaciais-isoladas-em-azul_107791-6491.jpg?w=1380&t=st=1675961542~exp=1675962142~hmac=313a97f1113ce607eba9e6ff240d10e01d07a5be22d7108e3a69282f53a5a402"
        );
        images.push(
            "https://img.freepik.com/vetores-gratis/bonito-alienigena-montando-ovni-com-ilustracao-do-icone-do-vetor-dos-desenhos-animados-do-sinal-do-amor-conceito-de-icone-de-tecnologia-de-ciencia-vetor-premium-isolado-estilo-flat-cartoon_138676-3810.jpg?w=826&t=st=1675961518~exp=1675962118~hmac=316f148474a054c46b55aa58be2048ccbbc7593700b80a5df9811f960594f572"
        );


        return images.slice(0, amount);
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

        images.map((img: string, i: number) => {
            cards.push(
                {
                    id: i,
                    className: "Card",
                    src: src,
                    verso: img,
                    turn: false,
                    disabled: false,
                }
            );
        });

        return cards;
    }

    const player1: string = props.player1;
    const player2: string = props.player2;

    const [jogadorDaVez, setJogadorDaVez] = useState<string>(player1);
    const [move, setMove] = useState<MoveType>(buildMoveNull());
    const [cardsList, setCardsList] = useState<CardType[]>(buildCards());
    const [score, setScore] = useState<ScoreType>();
    const [showWinner, setShowWinner] = useState<boolean>();
    const [winner, setWinner] = useState<string>();

    useEffect((): void => {
        if (cardsList.length == 0) {
            calcWinner();
            setShowWinner(true)
        }

    }, [cardsList]);

    const calcWinner = (): void => {
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

    const updateWinner = (scorePlayer1: number, scorePlayer2: number): void => {
        if (scorePlayer1 > scorePlayer2) {
            setWinner(player1)
        } else if (scorePlayer1 < scorePlayer2) {
            setWinner(player2)
        }
        else {
            setWinner("NINGUÉM");
        }
    }

    const renderCards = (): JSX.Element[] | undefined => {
        if (!cardsList) return;
        let classe: string = buildCardClass();
        let cardsElements: any[] = [];
        cardsList.map((card: CardType, i) => {
            cardsElements.push(<Card
                key={i}
                id={i}
                className={classe}
                src={card.src}
                verso={card.verso}
                turn={card.turn}
                disabled={card.disabled}
                clickCard={clickCardHandle}
            />)
        })

        return cardsElements;
    }

    const buildCardClass = (): string => {
        let classe: string = "";
        switch (props.amountCards) {
            case 10:
                classe = "TenCards";
                break;
            case 20:
                classe = "TwentyCards";
                break;
            case 30:
                classe = "ThirtyCards";
                break;
            case 40:
                classe = "FortyCards";
                break;
        }
        return classe;
    }

    function clickCardHandle(card: CardType): void {
        move.player = jogadorDaVez;
        turnDisableCard(card);
        startSong();
        if (move.round == 1) {
            move.card1 = card;

            setRound(2);
        }
        else {
            move.card2 = card;
            disableAllCards()

            scoreInit();

            setRound(1);
        }
    }

    const turnDisableCard = (card: CardType): void => {
        let cardsPrev = cardsList ? cardsList.map((c) => {
            if (card.id == c.id) {
                c.turn = true;
                c.disabled = true;
            }
            return c;
        }) : [];
        setCardsList(cardsPrev)
    }

    const disableAllCards = () => {
        if (!cardsList) return;
        let cardsPrev: CardType[] = cardsList.map((c) => {
            return { ...c, disabled: true };
        });
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
        console.log("jogadaconcluida")

        let totalPairs: CardType[] | undefined = buildScorePair(isPair);
        let totalMoves: MoveType[] = buildMoves();

        clearMove();

        setScore({
            moves: totalMoves,
            pairs: totalPairs
        });

        if (!isPair) {
            setTimeout(() => {
                turnBack();
                setPlayer();
            }, 1000);
        }
    }

    const buildMoves = (): MoveType[] => {
        let movesPrev: MoveType[] | undefined = score ? score.moves : undefined;
        if (movesPrev) {
            movesPrev.push(move);
        }
        else {
            movesPrev = [move];
        }

        return movesPrev;
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

    const setRound = (round: number) => {
        move.round = round;
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

    const startSong = ()=>{
        console.log("song");
    }

    const clearMove = (): void => {
        setMove(buildMoveNull());
    }

    const turnBack = (): void => {
        if (!cardsList) return;
        let cardsPrev: CardType[] = cardsList.map((c) => {
            return { ...c, turn: false, disabled: false };
        });
        setCardsList(cardsPrev);
    }

    const setPlayer = (): void => {
        if (jogadorDaVez === player1) {
            setJogadorDaVez(player2);
        }
        else { setJogadorDaVez(player1); }
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

    const restartGame = (): void => {
        setCardsList(buildCards());
        setShowWinner(false);
        setWinner("");
        setScore(undefined);
    }

    const closePanelHandle = (): void => {
        restartGame();
    }

    const renderWinnerPanel = (): JSX.Element => {
        return showWinner ?
            <WinnerPanel player={winner} closePanel={closePanelHandle} />
            : <></>
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
                    <button className="Button" onClick={() => props.restart()}>
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
