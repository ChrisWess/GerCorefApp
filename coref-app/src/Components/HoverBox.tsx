import * as React from 'react';
import {MutableRefObject, useState} from "react";
import MainView, {Mention} from "./MainView";

interface HoverBoxProps {
    word: any
    cluster: number
}

const HoverBox: React.FC<HoverBoxProps> = ({word, cluster}) => {

    const textStyle = {
        fontSize: '14pt'
    }

    const hoverStyle = {
        position: 'absolute',
        overflow: 'visible',
        display: 'inline-block',
        wrap: "nowrap",
        textOverflow: 'ellipsis',
        whitespace: 'nowrap',
        alignCenter: 'float',
        marginTop: '-30px',
        marginLeft: '-15px',
        borderRadius: '25px',
        border: '2px solid #000000',
        backgroundColor: '#FFFF88',
        fontSize: '14pt'
    }

    const [hover, setHover] = useState(false)

    const normalStyle = {
        display: 'none'
    }

    const onMouseEnter = (e: any) => {
        setHover(true)
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    return (
        <>
            <a style={hover ? hoverStyle : normalStyle}>{word}, {cluster}</a>
            <a style={textStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{word}</a>
        </>
    )
}
export default HoverBox;
