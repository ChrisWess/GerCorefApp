import React, {MutableRefObject, useState} from 'react';
import "./MainView.css"
import {Divider, List, ListItem,ListItemIcon, Pagination} from "@mui/material";
const _ = require('lodash');


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
    let buffer: JSX.Element[][] = new Array<JSX.Element[]>()
    // TODO: sentence offsets can be used also in text selection (don't allow marking over sentences this way)
    let sentenceOffsets: number[] = [0]
    for (let i = 0; i < txt.length; i++) {
        let sentence: JSX.Element[] = []
        for (let j = 0; j < txt[i].length; j++) {
            let token: string = txt[i][j];
            if (token.match(/[.,:!?]/)) {  // check for punctuation
                sentence.push(<abbr id={'w' + wordArr.current.length}>{token}</abbr>)
                wordFlags.current.push(false)
            } else {
                sentence.push(<abbr id={'w' + wordArr.current.length} className="wregular" onClick={wordClickEvent}>{" " + token}</abbr>)
                wordFlags.current.push(true)
            }
            wordArr.current.push(token)
        }
        buffer.push(sentence)
        sentenceOffsets.push(sentenceOffsets[i] + txt[i].length)
    }

    let getSentenceIdx = function(tokenIdx: number) {
        for(let i = 0; i < sentenceOffsets.length - 2; i++) {
            if (sentenceOffsets[i] <= tokenIdx && tokenIdx < sentenceOffsets[i + 1]) {
                return i
            }
        }
        return sentenceOffsets.length - 2
    };

    let flattenedClust = []
    let clustCopy = _.cloneDeep(clust);
    let deletedCumulated: number[][] = Array(buffer.length).fill(null).map(
        (value, index) => Array(buffer[index].length).fill(0))
    allCorefs.current = []
    for (let i = 0; i < clust.length; i++) {
        allCorefs.current.push(Array<Mention>(clust[i].length))
        for (let j = 0; j < clust[i].length; j++) {
            // Create a flattened array of clusters
            if (flattenedClust.length === 0) {
                let cluster = clustCopy[i][j]
                cluster.push(i, j)
                flattenedClust.push(cluster)
            } else {
                let currLen = flattenedClust.length
                for(let k = 0; k < currLen - 1; k++) {
                    let cluster = clustCopy[i][j]
                    if (flattenedClust[k][0] <= cluster[0] && cluster[0] < flattenedClust[k + 1][0]) {
                        cluster.push(i, j)
                        if (flattenedClust[k][0] == cluster[0] && flattenedClust[k][1] >= cluster[1]) {
                            // TODO: correctly sort end indices, too
                            flattenedClust.splice(k + 2, 0, cluster)
                        } else {
                            flattenedClust.splice(k + 1, 0, cluster)
                        }
                        break
                    }
                }
                if (flattenedClust.length === currLen) {
                    let cluster = clustCopy[i][j]
                    cluster.push(i, j)
                    flattenedClust.push(cluster)
                }
            }

            // Create a look-up for deleted JSX elements in the buffer (resulting from splicing)
            let mentionIdxEnd = clust[i][j][1]
            let numRemove = mentionIdxEnd - clust[i][j][0]
            if (numRemove > 0) {
                let sentIdx = getSentenceIdx(mentionIdxEnd)!
                let sentence: number[] = deletedCumulated[sentIdx]
                for (let k = mentionIdxEnd - sentenceOffsets[sentIdx]; k < sentence.length; k++) {
                    sentence[k] += numRemove
                }
            }
        }
    }
    console.log(flattenedClust)

    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = 0; i < flattenedClust.length; i++) {
        let mentionIdxStart = flattenedClust[i][0]
        let mentionIdxEnd = flattenedClust[i][1]
        let clusterIdx = flattenedClust[i][2]
        let currentIndexOfCoref = clusterIdx + 1;
        let mentionIdx = flattenedClust[i][3]
        let coref = wordArr.current.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
        let corefId = `d1c${clusterIdx}m${mentionIdx}`
        allCorefs.current[clusterIdx][mentionIdx] = {
            id: corefId,
            content: coref,
            selectionRange: [mentionIdxStart, mentionIdxEnd + 1],
            documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
        }

        // TODO: make mouseover event that shows a small prompt with information at the mouse pointer
        let sentenceIdx: number = getSentenceIdx(mentionIdxEnd)!
        let sentBuffer: JSX.Element[] = buffer[sentenceIdx]
        let deleted = deletedCumulated[sentenceIdx]
        let startIdxInSentence = mentionIdxStart - sentenceOffsets[sentenceIdx]
        let shiftedStartIdx = startIdxInSentence - deleted[startIdxInSentence]
        if (mentionIdxStart === mentionIdxEnd) {
            sentBuffer.splice(shiftedStartIdx, 1,
            <b id={corefId} className={"cr cr-" + currentIndexOfCoref} onClick={corefClickEvent}><abbr id={"w" + mentionIdxStart}><a id={"w" + mentionIdxStart}
            href="#d1c1m1">[</a>{wordArr.current[mentionIdxStart]}<a id={"w" + mentionIdxStart} href="#d1c1m1">]</a><sub id={"w" + mentionIdxStart}>
            {currentIndexOfCoref}</sub></abbr></b>);
        } else {
            // TODO: implement correct handling of overlapping coreferences
            //   => check if any mentionIdxRanges overlap (can be done on the "clust" array) &
            //      make a function that makes the correct JSXElement for these overlapping corefs.
            //      (also use the entire span of the overlapping annotations to set deletedCumulated)
            let endIdxInSentence = mentionIdxEnd - sentenceOffsets[sentenceIdx]
            let mentionSlice: JSX.Element[] = sentBuffer.slice(shiftedStartIdx + 1,
                                                               endIdxInSentence - deleted[startIdxInSentence])
            sentBuffer.splice(shiftedStartIdx, mentionIdxEnd + 1 - mentionIdxStart,
            <b id={corefId} className={"cr cr-" + currentIndexOfCoref} onClick={corefClickEvent}><abbr id={"w" + mentionIdxStart}>{" "}<a id={"w" + mentionIdxStart}
            href="#d1c1m1">[</a>{wordArr.current[mentionIdxStart]}</abbr>
                {mentionSlice.map((elem, index) => (
                                <abbr id={'w' + (mentionIdxStart + index + 1)}>{" " + wordArr.current[mentionIdxStart + index + 1]}</abbr>
                              ))}
                <abbr id={"w" + mentionIdxEnd}>{" " + wordArr.current[mentionIdxEnd]}<a id={"w" + mentionIdxEnd}
            href="#d1c1m1">]</a><sub id={"w" + mentionIdxEnd}>{currentIndexOfCoref}</sub></abbr></b>);
        }
    }

    //Decide which Items are to be displayed on this page
    const currentItems = buffer.slice(indexOfFirstItem, indexOfLastItem);
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
                count={Math.ceil(buffer.length / itemsPerPage)}
                onChange={(event,page) => setCurrentPage(page)}
                style={{marginLeft: "auto", marginRight: "auto"}}
            />
        </>
    );
}

export default MainView;
