import MoveType from "../../@Types/MoveType";
import Card from "../card/Card";

const Scoreboard = (props: any) => {
    let scorePlayer = 0;
    let moves = props.moves;
    let cardsPairs: any[] =[];
    if (moves) {
        moves.map((move: MoveType) => {

            if (move.point > 0 && move.player == props.player) {
                scorePlayer++;
            }
        })

    }

    const renderPairs = () => {

        if(moves){
            moves.map((m:MoveType, i:number)=>{
                if(!m.card1 || !m.card2) return;
                if (m.point > 0 && m.player == props.player) {
                    cardsPairs.push(<Card
                        className="CardMini"
                        key={i}
                        src={m.card1.verso}
                        turn={false}
                        clickCard={()=>{}}
                    />)
                }
             
            })
        }

        return cardsPairs;
    }

    return (
        <div className="ColumnScore">
            <strong>Jogador: {props.player}</strong>
            <strong>Pontuação: {scorePlayer}</strong>
            <div>
                {renderPairs()}
            </div>
        </div>
    );
}


export default Scoreboard;