import React, {useState} from 'react';
import SentenceItem from "./SentenceItem";
import { makeStyles } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {Button,ButtonGroup, TextField} from "@mui/material";

export default function MainView(props:any) {
    const docu = props.text;
    const [texres, setTexres] = useState("");
    const textItems = docu.map((tex:any) =>
        <li key={tex.toString()}>
            <SentenceItem text={tex}></SentenceItem>
        </li>
    );


    const clusters = props.clust;
    const clusterItems = clusters.map((tex:any) =>
        <li key={tex.toString()}>
            <p>{tex}</p>
        </li>
    );

    <p>{props.clust.length}, {props.text}</p>


    return (
        <>

            <ul>{textItems}</ul>
            <ul>{clusterItems}</ul>
            <ButtonGroup variant="contained" aria-label="outlined primary button group" style={{marginTop: 15}}>
                <Button style={{width:120}}>Back</Button>
                <Button style={{width:120}}>Next</Button>
            </ButtonGroup>
        </>
    );
}
