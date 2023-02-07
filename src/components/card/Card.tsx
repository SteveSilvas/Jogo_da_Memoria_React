import React, { useEffect, useState } from "react";
import "./card.css";

const Card = (props:any) => {
    let classes = `Card ${props.className}`;
    const [turn, setTurn] = useState<boolean>(props.turn);
    // const [enable, setEnable] = useState<boolean>(true);
    const click = (e:any)=>{
        e.preventDefault();
        props.clickCard({
            id: e.target.id,
            src: props.src,
            verso: props.verso
        });
    }

    useEffect(() => {
        setTurn(props.turn)
      }, [props.turn]);
      

    return (
        <div className={classes} >
            <img
                className="Image"
                id={props.id}
                src={!props.turn ? props.src : props.verso}
                alt={props.alt}
                onClick={(e)=>{click(e)}}
            />
        </div>
    )
}

export default Card;