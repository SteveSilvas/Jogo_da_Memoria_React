type CardType = {
    className:string,
    id?:number,
    src: string,
    verso:string,
    turn:boolean,
    disabled:boolean,
    clickCard?: ()=>CardType
}

export default CardType;