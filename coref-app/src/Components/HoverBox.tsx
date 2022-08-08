import * as React from 'react';
import {MutableRefObject, useState} from "react";
import MainView, {Mention} from "./MainView";

interface HoverBoxProps {
    word: any
    cluster: number
}

const HoverBox: React.FC<HoverBoxProps> = ({word, cluster}) => {

    const hoverStyle = {
        position: 'fixed',
        top: '0px',
        left: '0px',
        overflow: 'visible',
        display: 'inline-block',
        wrap: "nowrap",
        textOverflow: 'ellipsis',
        whitespace: 'nowrap',
        alignCenter: 'float',
        marginBottom: '8px',
    }

    const [hover, setHover] = useState(false)
    const [style, setStyle] = useState(hoverStyle)

    const normalStyle = {
        display: 'none'
    }

    const onMouseEnter = (e: any) => {
        const x = (e.clientX - 30) + 'px';
        const y = (e.clientY - 50) + 'px';
        const currentStyle = {
            position: 'fixed',
            top: y,
            left: x,
            overflow: 'visible',
            display: 'inline-block',
            wrap: "nowrap",
            textOverflow: 'ellipsis',
            whitespace: 'nowrap',
            alignCenter: 'float',
            marginBottom: '8px',
        }
        console.log(x + y)
        setStyle(currentStyle)
        setHover(true)
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    return (
        <a>
            <a style={hover ? style : normalStyle}>({word}, {cluster})</a>
            <a onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{word}</a>
        </a>
    )
}
export default HoverBox;
