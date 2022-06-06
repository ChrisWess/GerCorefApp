import React, {useState} from 'react';
import SentenceItem from "./SentenceItem";
import { makeStyles } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {Button, ButtonGroup, List, TextField} from "@mui/material";

export default function MainView(props:any) {
    const divStyle = {
        color: 'blue',
        background: 'lime'
    };

    function showCorefs(a: any[], b: any[]){
        let allElements = []
        let buffer = []
        let currentEdge = 0;
        let offset = 0;

        //Puts Text in one long Array instead of one array for each sentence.
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[i].length; j++) {
                allElements.push(a[i][j]);
                buffer.push( (a[i][j]+" ") as any);
            }
        }

        //finds coref-clusters and splices the buffer to insert the span and replace the normal string.
        for (let i = 0; i < b.length; i++) {
            for (let j = 0; j < b[i].length; j++) {
                //buffer.push(<span style={divStyle}>{allElements.slice(b[i][j][0], b[i][j][1]+1)}</span>);
                buffer.splice(b[i][j][0]-offset, b[i][j][1]-b[i][j][0]+1, <span style={divStyle}>{allElements.slice(b[i][j][0], b[i][j][1]+1)} </span>);
                offset += b[i][j][1]-b[i][j][0];
                console.log(offset)
            }
        }
        console.log(buffer);


        return (
            <>
                <p>{buffer}</p>
            </>
        );
    }


    //this.showCorefs = this.showCorefs.bind(this);
    //const [texres, setTexres] = useState("");
    const docu = props.text;

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

            <div>{showCorefs(docu, clusters)}</div>
            <ButtonGroup variant="contained" aria-label="outlined primary button group" style={{marginTop: 15}}>
                <Button style={{width:120}}>Back</Button>
                <Button style={{width:120}}>Next</Button>
            </ButtonGroup>
        </>
    );
}
