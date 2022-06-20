import React, {MutableRefObject, useEffect, useState} from 'react';
import "./MainView.css"
import Paper from '@mui/material/Paper';
import {Divider, List, ListItem,ListItemIcon, Pagination} from "@mui/material";

export type Mention = {
    id: string;
    content: string;
    selectionRange: number[]
    username?: string;
}

interface MainViewProps {
    txt: any[]
    clust: any[]
    allCorefsMapped: MutableRefObject<Map<string, Mention>>
    allCorefs: MutableRefObject<Mention[][]>
    wordArr: MutableRefObject<string[]>
    wordFlags: MutableRefObject<boolean[]>
    markedWord: MutableRefObject<number[]>
    setSelectedCoref: Function
    setClusterColor: Function
    setCurrentMention: Function
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

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefsMapped, allCorefs,
                                               wordArr, wordFlags,
                                               markedWord, setSelectedCoref, setClusterColor,
                                               setCurrentMention}) => {

    const getStyle = function(element: any, property: string) {
        return window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(property) :
            element.style[property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })];
    };


    //For Pagination
    const [listItem, setListItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const indexOfLastItem = currentPage*itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    useEffect(() => {
        let elems = document.querySelectorAll("b.cr");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                clearPrevMarking(markedWord.current)
                markedWord.current = []
                let mention: Mention | undefined = allCorefsMapped.current.get(value.id);
                if (mention) {
                    setCurrentMention(mention)
                    setSelectedCoref(mention.selectionRange)
                    setClusterColor(getStyle(value, "background-color"))
                    allCorefsMapped.current.set("current", mention)
                }
            }, false)
        });
        elems = document.querySelectorAll("bb.wregular");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                clearPrevMarking(markedWord.current)
                setCurrentMention(undefined)
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

    //State before anything is sent to the API
    if(clust[0] === "Nothing")
        return <h1>No Document yet</h1>
    wordArr.current = []
    wordFlags.current = []
    let buffer = []
    //

    //Puts Text in one long Array instead of one array for each sentence.
    for (let i = 0; i < txt.length; i++) {
        for (let j = 0; j < txt[i].length; j++) {
            buffer.push(txt[i][j] as string);
            wordArr.current.push(txt[i][j])
            wordFlags.current.push(true)
        }
    }
    //

    allCorefs.current = []
    allCorefsMapped.current.clear()
    let currentIndexOfCoref = 1;
    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = clust.length-1; i >= 0; i--) {
        let cluster: Mention[] = []
        currentIndexOfCoref = i+1;
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxStart = clust[i][j][0]
            let mentionIdxEnd = clust[i][j][1]
            let coref = buffer.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
            let corefId = `d1c${i}m${j}`
            let mention: Mention = { id: corefId, content: coref, selectionRange: [mentionIdxStart, mentionIdxEnd + 1] }
            allCorefsMapped.current.set(corefId, mention)
            cluster.push(mention)
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
        allCorefs.current.push(cluster)
    }
    allCorefs.current = allCorefs.current.reverse()

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
    for (let i = 0; i < splitString.length/2 -1; i++) {
        sentenceArray[i]= splitString[2*i]+splitString[2*i+1];
    }

    //Decide which Items are to be displayed on this page
    const currentItems = sentenceArray.slice(indexOfFirstItem, indexOfLastItem);
    const sentenceList = currentItems.map((d, index) => <ListItem divider key={index}>
        <ListItemIcon>
            {index+indexOfFirstItem+1}
        </ListItemIcon>
            <div dangerouslySetInnerHTML={{ __html:  d}}/>
            <Divider />
        </ListItem>
    );
    //

    return (
        <>
            <div style={{height:720}}>
                <article id="docView">

                        <List className="pagination">
                                {sentenceList}
                        </List>
                </article>
            </div>
            <Pagination
                count={Math.ceil(sentenceArray.length / itemsPerPage)}
                onChange={(event,page) => setCurrentPage(page)}
                style={{marginLeft: "auto", marginRight: "auto"}}
            />
        </>
    );
}

export default MainView;
