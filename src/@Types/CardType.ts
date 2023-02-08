type CardType = {
    className:string,
    id?:number,
    src: string,
    verso:string,
    turn:boolean,
    clickCard?: ()=>CardType
}

export default CardType;