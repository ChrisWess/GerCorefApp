import * as React from 'react';
import {MutableRefObject, useState} from "react";
import MainView, {Mention} from "./MainView";

interface HoverBoxProps {
    word: any
    mention: any
    cluster: number
    hovertoggle: boolean
}

const HoverBox: React.FC<HoverBoxProps> = ({word, mention, cluster, hovertoggle}) => {

    const hoverStyle = {
        position: 'absolute',
        display: 'inline-block',
        height: '25px',
        width: 'fit-content',
        overflow: 'nowrap',
        textOverflow: 'nowrap',
        whitespace: 'nowrap',
        alignCenter: 'float',
        marginTop: '-30px',
        float: 'center',
        marginLeft: '-10px',
        borderRadius: '25px',
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
            <a style={hover ? hoverStyle : normalStyle}>Coref-Cluster: {cluster}  Author: {mention.autoCreated ? "Machine" : "User"}</a>
            <a style={{fontSize: '1em', color: 'none', padding: '0px 2px 0px 2px', marginTop: '6px',  zIndex: '1'}} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{word}</a>
        </>
    )
}
export default HoverBox;
