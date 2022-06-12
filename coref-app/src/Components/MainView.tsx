import React, {useState} from 'react';
import SentenceItem from "./SentenceItem";
import { makeStyles } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {Button, ButtonGroup, List, TextField} from "@mui/material";
import "./MainView.css"

export default function MainView(props:any) {

    function showCorefs(a: any[], b: any[]){
        console.log(b[0])
        if(b[0] === "Nothing")
            return <h1>No Document yet</h1>
        let buffer = []

        //Puts Text in one long Array instead of one array for each sentence.
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[i].length; j++) {
                buffer.push( (" " + a[i][j]) as any);
            }
        }

        let currentIndexOfCoref = 1;
        //for each coref cluster it puts an html element in front of its first word and behind its last word
        //from big to small seems to handle overlapping corefs better
        for (let i = b.length-1; i >= 0; i--) {
            currentIndexOfCoref = i+1;
            for (let j = 0; j < b[i].length; j++) {
                let coref = buffer[b[i][j][0]]
                buffer.splice(b[i][j][0], 1,
                    " <b id=\"d1c1m0\" class=\"cr cr-" + currentIndexOfCoref +
                    " onClick=\"><a href=\"#d1c1m1\">[</a>" + coref.substring(1));  // TODO: add a function that selects this mention (to show it in the CorefView)
                console.log(coref)
                buffer.splice(b[i][j][1], 1,
                    buffer[b[i][j][1]]+"<a href=\"#d1c1m1\">]</a><sub>"+currentIndexOfCoref+"</sub></b>");
            }
        }

        // turn result into one string
        console.log(buffer);
        let stringAll = "";
        for (let i = 0; i < buffer.length; i++) {
            let token = buffer[i];
            if (token.length === 2 && token[0] === " ") {  // TODO: Actual check for punctuation
                token = token.substring(1)
            }
            stringAll += token;
        }
        console.log(stringAll);

        //render string as html element
        return (
            <article>
                <div dangerouslySetInnerHTML={{ __html:  stringAll}}/>
            </article>
        );
    }

    /* //old  function
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
     */


    //this.showCorefs = this.showCorefs.bind(this);
    //const [texres, setTexres] = useState("");

    const corefText = props.text;
    const corefClusters = props.clust;


    return (
        <>
            <div style={{height:720}}>{showCorefs(corefText, corefClusters)}</div>
        </>
    );
}
