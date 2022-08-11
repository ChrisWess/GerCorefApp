import * as React from 'react';
import {MutableRefObject, useState} from "react";
import MainView, {Mention} from "./MainView";

interface HoverBoxProps {
    word: any
    cluster: number
    hovertoggle: boolean
}

const HoverBox: React.FC<HoverBoxProps> = ({word, cluster, hovertoggle}) => {

    const textStyle = {
        fontSize: '14pt'
    }

    const hoverStyle = {
        position: 'absolute',
        display: 'inline-block',
        //wrap: "nowrap",
        height: '25px',
        width: '280px',
        overflow: 'wrap',
        textOverflow: 'wrap',
        textAlign: 'center',
        //whitespace: 'nowrap',
        alignCenter: 'float',
        marginTop: '-30px',
        marginLeft: '-105px',
        borderRadius: '25px',
        //border: '2px solid #000000',
        backgroundColor: '#FFFF88',
        fontSize: '12pt',
        zIndex: '100',
        boxShadow: '1px 1px 5px'
    }

    const [hover, setHover] = useState(false)

    const normalStyle = {
        display: 'none'
    }

    const onMouseEnter = (e: any) => {
        if(hovertoggle){
            setHover(true)
        }
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    //todo: change author to actual author
    return (
        <>
            <a style={hover ? hoverStyle : normalStyle}>Coref-Cluster: {cluster}  Author: {word}</a>
            <a style={textStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{word}</a>
        </>
    )
}
export default HoverBox;
