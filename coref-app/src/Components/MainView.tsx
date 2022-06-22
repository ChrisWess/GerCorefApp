import React, {MutableRefObject, useEffect, useState} from 'react';
import "./MainView.css"
import Paper from '@mui/material/Paper';
import {Divider, List, ListItem,ListItemIcon, Pagination} from "@mui/material";

export type Mention = {
    id: string;
    content: string;
    selectionRange: number[]
    documentIdx: number
    clusterIdx: number
    mentionIdx: number
    createdByUser?: string;  // TODO: or id (number)?
}

interface MainViewProps {
    txt: any[]
    clust: number[][][]
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

export const parseMentionId = function(mentionId: string) {
    let docIdx: number = 1
    let clusterIdx: number = mentionId.indexOf("c")
    let mentionIdx: number = mentionId.indexOf("m")
    docIdx = parseInt(mentionId.substring(docIdx, clusterIdx))
    clusterIdx = parseInt(mentionId.substring(clusterIdx + 1, mentionIdx))
    mentionIdx = parseInt(mentionId.substring(mentionIdx + 1))
    return {docIdx: docIdx, clusterIdx: clusterIdx, mentionIdx: mentionIdx}
};

export const getMentionFromId = function(mentionId: string, allCorefs: Mention[][]) {
    let mentionLoc = parseMentionId(mentionId)
    return allCorefs[mentionLoc.clusterIdx][mentionLoc.mentionIdx]
}

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               wordArr, wordFlags,
                                               markedWord, setSelectedCoref, setClusterColor,
                                               setCurrentMention }) => {

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

    const corefClickEvent = function(value: any) {
        clearPrevMarking(markedWord.current)
        markedWord.current = []
        let mention: Mention = getMentionFromId(value.currentTarget.id, allCorefs.current);
        if (mention) {
            setCurrentMention(mention)
            setSelectedCoref(mention.selectionRange)
            setClusterColor(getStyle(value.currentTarget, "background-color"))
        }
    };

    const wordClickEvent = function(value: any) {
        clearPrevMarking(markedWord.current)
        setCurrentMention(undefined)
        markedWord.current = []
        let wid = parseInt(value.currentTarget.id.substring(1))
        setSelectedCoref([wid, wid + 1])
        // @ts-ignore
        value.currentTarget.style.backgroundColor = "yellow";
        setClusterColor("yellow")
        markedWord.current = [wid]
    };

    //State before anything is sent to the API
    if(clust.length === 0)
        return <h1>No Document yet</h1>

    //console.log("Cluster:")
    //console.log(clust)

    wordArr.current = []
    wordFlags.current = []

    //Puts Text in one long Array instead of one array for each sentence.
    let buffer: JSX.Element[] = new Array<JSX.Element>()
    for (let i = 0; i < txt.length; i++) {
        for (let j = 0; j < txt[i].length; j++) {
            let token: string = txt[i][j];
            if (token.match(/[.,:!?]/)) {  // check for punctuation
                buffer.push(<abbr id={'w' + wordArr.current.length}>{token}</abbr>)
                wordFlags.current.push(false)
            } else {
                buffer.push(<abbr id={'w' + wordArr.current.length} className="wregular" onClick={wordClickEvent}>{" " + token}</abbr>)
                wordFlags.current.push(true)
            }
            wordArr.current.push(token)
        }
    }

    allCorefs.current = []
    let delOps: number[] = Array(wordArr.current.length).fill(0)
    for (let i = 0; i < clust.length; i++) {
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxEnd = clust[i][j][1]
            let numRemove = mentionIdxEnd - clust[i][j][0]
            delOps[mentionIdxEnd] += numRemove
        }
    }
    let deletedCumulated: number[] = []
    let currentDels = 0
    for (let i = 0; i < delOps.length; i++) {
        deletedCumulated.push(currentDels)
        currentDels += delOps[i]
    }
    console.log(deletedCumulated)
    let currentIndexOfCoref = 1;
    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = 0; i < clust.length; i++) {
        let cluster: Mention[] = []
        currentIndexOfCoref = i+1;
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxStart = clust[i][j][0]
            let mentionIdxEnd = clust[i][j][1]
            let coref = wordArr.current.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
            let corefId = `d1c${i}m${j}`
            let mention: Mention = {
                id: corefId,
                content: coref,
                selectionRange: [mentionIdxStart, mentionIdxEnd + 1],
                documentIdx: 0, clusterIdx: i, mentionIdx: j
            }
            cluster.push(mention)
            // TODO: make mouseover event that shows a small prompt with information at the mouse pointer
            if (mentionIdxStart === mentionIdxEnd) {
                buffer.splice(mentionIdxStart - deletedCumulated[mentionIdxStart], 1,
                <b id={corefId} className={"cr cr-" + currentIndexOfCoref} onClick={corefClickEvent}><abbr id={"w" + mentionIdxStart}><a id={"w" + mentionIdxStart}
                href="#d1c1m1">[</a>{wordArr.current[mentionIdxStart]}<a id={"w" + mentionIdxStart} href="#d1c1m1">]</a><sub id={"w" + mentionIdxStart}>
                {currentIndexOfCoref}</sub></abbr></b>);
            } else {
                // TODO: implement correct handling of overlapping coreferences
                let mentionSlice: JSX.Element[] = buffer.slice(mentionIdxStart + 1 - deletedCumulated[mentionIdxStart],
                                                               mentionIdxEnd - deletedCumulated[mentionIdxStart])
                buffer.splice(mentionIdxStart - deletedCumulated[mentionIdxStart], mentionIdxEnd + 1 - mentionIdxStart,
                <b id={corefId} className={"cr cr-" + currentIndexOfCoref} onClick={corefClickEvent}><abbr id={"w" + mentionIdxStart}>{" "}<a id={"w" + mentionIdxStart}
                href="#d1c1m1">[</a>{wordArr.current[mentionIdxStart]}</abbr>
                    {mentionSlice.map((elem, index) => (
                                    <abbr id={'w' + (mentionIdxStart + index + 1)}>{" " + wordArr.current[mentionIdxStart + index + 1]}</abbr>
                                  ))}
                    <abbr id={"w" + mentionIdxEnd}>{" " + wordArr.current[mentionIdxEnd]}<a id={"w" + mentionIdxEnd}
                href="#d1c1m1">]</a><sub id={"w" + mentionIdxEnd}>{currentIndexOfCoref}</sub></abbr></b>);
            }
        }
        allCorefs.current.push(cluster)
    }

    // TODO: correctly split into sentences
    let sentenceIndices: number[] = [0];
    for (let i = 0; i < buffer.length; i++) {
        let wordIdx = i + deletedCumulated[i]
        if (!wordFlags.current[wordIdx]) {
            sentenceIndices.push(i + 1)
        }
    }
    sentenceIndices.pop()
    console.log(sentenceIndices)

    let sentenceArray: JSX.Element[][] = []
    for (let i = 0; i < sentenceIndices.length - 1; i++) {
        sentenceArray.push(buffer.slice(sentenceIndices[i], sentenceIndices[i + 1]))
    }
    sentenceArray.push(buffer.slice(sentenceIndices[sentenceIndices.length - 1]))

    //Decide which Items are to be displayed on this page
    const currentItems = sentenceArray.slice(indexOfFirstItem, indexOfLastItem);
    const sentenceList = currentItems.map((d, index) => <ListItem divider key={index}>
        <ListItemIcon>
            {index+indexOfFirstItem+1}
        </ListItemIcon>
            <div>{d}</div>
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
