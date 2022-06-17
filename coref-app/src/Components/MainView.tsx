import React, {MutableRefObject, useEffect} from 'react';
import "./MainView.css"
import Paper from '@mui/material/Paper';
import {Divider, List, ListItem} from "@mui/material";


export type Mention = {
    id: string;
    content: string;
    selectionRange: number[]
    username?: string;
}

interface MainViewProps {
    txt: any[]
    clust: any[]
    allCorefs: Map<string, Mention>
    wordArr: MutableRefObject<string[]>
    wordFlags: MutableRefObject<boolean[]>
    markedWord: MutableRefObject<number[]>
    setSelectedCoref: Function
    setClusterColor: Function
}

export const clearPrevMarking = function(markedWord: number[]) {
    if (markedWord.length === 1) {
        let prev = document.getElementById("w" + markedWord[0])
        if (prev) {  // && prev.classList.contains("wregular")
            prev.style.backgroundColor = "transparent"
        }
    } else if (markedWord.length === 2) {
        for (let i = markedWord[0]; i < markedWord[1]; i++) {
            let prev = document.getElementById("w" + i)
            if (prev) {  // && prev.classList.contains("wregular")
                prev.style.backgroundColor = "transparent"
            }
        }
    }
};

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               wordArr, wordFlags,
                                               markedWord, setSelectedCoref, setClusterColor }) => {

    const getStyle = function(element: any, property: string) {
        return window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(property) :
            element.style[property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })];
    };

    useEffect(() => {
        let elems = document.querySelectorAll("b.cr");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                clearPrevMarking(markedWord.current)
                markedWord.current = []
                let mention = allCorefs.get(value.id)
                if (mention) {
                    setSelectedCoref(mention.selectionRange)
                    setClusterColor(getStyle(value, "background-color"))
                }
            }, false)
        });
        elems = document.querySelectorAll("bb.wregular");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                clearPrevMarking(markedWord.current)
                markedWord.current = []
                let wid = parseInt(value.id.substring(1))
                setSelectedCoref([wid, wid + 1])
                // @ts-ignore
                value.style.backgroundColor = "yellow";
                setClusterColor("yellow")
                markedWord.current = [wid]
            }, false)
        });
    }, [txt, clust]);

    console.log(clust[0])
    if(clust[0] === "Nothing")
        return <h1>No Document yet</h1>
    wordArr.current = []
    wordFlags.current = []
    let buffer = []

    //Puts Text in one long Array instead of one array for each sentence.
    for (let i = 0; i < txt.length; i++) {
        for (let j = 0; j < txt[i].length; j++) {
            buffer.push(txt[i][j] as string);
            wordArr.current.push(txt[i][j])
            wordFlags.current.push(true)
        }
    }
    console.log(buffer);

    allCorefs.clear()
    let currentIndexOfCoref = 1;
    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = clust.length-1; i >= 0; i--) {
        currentIndexOfCoref = i+1;
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxStart = clust[i][j][0]
            let mentionIdxEnd = clust[i][j][1]
            let coref = buffer.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
            let corefId = `d1c${i}m${j}`
            allCorefs.set(corefId, { id: corefId, content: coref, selectionRange: [mentionIdxStart, mentionIdxEnd + 1] })
            // TODO: make mouseover event that shows a small prompt with information at the mouse pointer
            if (mentionIdxStart === mentionIdxEnd) {
                buffer.splice(mentionIdxStart, 1,
                "<b id=\"" + corefId + "\" class=\"cr cr-" + currentIndexOfCoref +
                      `"><bb id="w${mentionIdxStart}"> <a id="w${mentionIdxStart}" href="#d1c1m1">[</a>` +
                    buffer[mentionIdxStart] + `<a id="w${mentionIdxStart}" href="#d1c1m1">]</a><sub id="w${mentionIdxStart}">` +
                    currentIndexOfCoref + "</sub></bb></b>");
            } else {
                buffer.splice(mentionIdxStart, 1,
                "<b id=\"" + corefId + "\" class=\"cr cr-" + currentIndexOfCoref +
                       `"><bb id="w${mentionIdxStart}"> <a id="w${mentionIdxStart}" href="#d1c1m1">[</a>` +
                    buffer[mentionIdxStart] + "</bb>");
                buffer.splice(mentionIdxEnd, 1,
                `<bb id="w${mentionIdxEnd}"> ` + buffer[mentionIdxEnd] +
                      `<a id="w${mentionIdxStart}" href="#d1c1m1">]</a><sub id="w${mentionIdxStart}">` +
                    currentIndexOfCoref + "</sub></bb></b>");
            }
        }
    }

    // turn result into one string
    // console.log(buffer);
    let stringAll = "";
    let corefFlag: boolean = false
    for (let i = 0; i < buffer.length; i++) {
        let token = buffer[i];
        if (token.match(/[.,:!?]/)) {  // check for punctuation
            token = `<bb id='w${i}'>` + token + "</bb>"
            wordFlags.current[i] = false
        } else if (token.startsWith("<b id")) {
            if (!token.endsWith("</b>")) {
                corefFlag = true
            }
        } else if (token.endsWith("</b>")) {
            corefFlag = false
        } else if (corefFlag) {
            token = `<bb id='w${i}'> ` + token + "</bb>"
        } else {
            token = `<bb id='w${i}' class="wregular"> ` + token + "</bb>"
        }
        stringAll += token;
    }

    //Cut up string into sentences, resulting in sentenceArray
    var sentenceArray = [];
    var splitString = stringAll.split(/([.,:;!?]<\/bb>)/);
    for (let i = 0; i < splitString.length-1; i = i+2) {
        sentenceArray[i]= splitString[i]+splitString[i+1];
    }

    const sentenceList = sentenceArray.map((d) => <ListItem divider key={d.toString()}>
        <div dangerouslySetInnerHTML={{ __html:  d}}/>
        <Divider />
    </ListItem>
);
    
    return (
        <div style={{height:720}}>
            <article id="docView">
                <List>
                {sentenceList}
                </List>
            </article>
        </div>
    );
}

export default MainView;
