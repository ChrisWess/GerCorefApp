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
    wordFlags: MutableRefObject<(boolean | null)[]>
    setNewCorefSelection: Function
    markWords: Function
}

export const parseMentionId = function(mentionId: string) {
    let docIdx: number = 1
    let clusterIdx: number = mentionId.indexOf("c")
    let mentionIdx: number = mentionId.indexOf("m")
    docIdx = parseInt(mentionId.substring(docIdx, clusterIdx))
    clusterIdx = parseInt(mentionId.substring(clusterIdx + 1, mentionIdx))
    mentionIdx = parseInt(mentionId.substring(mentionIdx + 1))
    return {docIdx: docIdx, clusterIdx: clusterIdx, mentionIdx: mentionIdx}
};


export const getSentenceIdx = function(tokenIdx: number, sentenceOffsets: number[]) {
    for(let i = 0; i < sentenceOffsets.length - 2; i++) {
        if (sentenceOffsets[i] <= tokenIdx && tokenIdx < sentenceOffsets[i + 1]) {
            return i
        }
    }
    return sentenceOffsets.length - 2
};


const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               wordArr, wordFlags,
                                               setNewCorefSelection, markWords }) => {

    //For Pagination
    const [listItem, setListItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const indexOfLastItem = currentPage*itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const selectNewCorefEvent = function(value: any) {
        setNewCorefSelection(value)
    };

    const wordClickEvent = function(value: any) {
        let wid = parseInt(value.currentTarget.id.substring(1))
        markWords([wid], value.currentTarget)
    };

    //State before anything is sent to the API
    if(txt.length === 0)
        return <h1>No Document yet</h1>

    //console.log("Cluster:")
    //console.log(clust)
    //console.log("Tokens:")
    //console.log(txt)

    wordArr.current = []
    wordFlags.current = []

    //Puts Text in one long Array instead of one array for each sentence.
    let buffer: JSX.Element[][] = new Array<JSX.Element[]>()
    let sentenceOffsets: number[] = [0]
    for (let i = 0; i < txt.length; i++) {
        let sentence: JSX.Element[] = []
        for (let j = 0; j < txt[i].length; j++) {
            let token: string = txt[i][j];
            if (token.match(/^[.,:!?]$/)) {  // check for punctuation
                sentence.push(<abbr id={'w' + wordArr.current.length}>{token}</abbr>)
                if (token === '.' && j !== txt[i].length - 1) {
                    wordFlags.current.push(null)
                } else {
                    wordFlags.current.push(false)
                }
            } else {
                sentence.push(<abbr id={'w' + wordArr.current.length} className="wregular" onClick={wordClickEvent}>{" " + token}</abbr>)
                wordFlags.current.push(true)
            }
            wordArr.current.push(token)
        }
        buffer.push(sentence)
        sentenceOffsets.push(sentenceOffsets[i] + txt[i].length)
    }

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
                let sentIdx = getSentenceIdx(mentionIdxEnd, sentenceOffsets)!
                let sentence: number[] = deletedCumulated[sentIdx]
                for (let k = mentionIdxEnd - sentenceOffsets[sentIdx]; k < sentence.length; k++) {
                    sentence[k] += numRemove
                }
            }
        }
    }

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
        let sentenceIdx: number = getSentenceIdx(mentionIdxEnd, sentenceOffsets)!
        let sentBuffer: JSX.Element[] = buffer[sentenceIdx]
        let deleted = deletedCumulated[sentenceIdx]
        let startIdxInSentence = mentionIdxStart - sentenceOffsets[sentenceIdx]
        let shiftedStartIdx = startIdxInSentence - deleted[startIdxInSentence]
        if (mentionIdxStart === mentionIdxEnd) {
            sentBuffer.splice(shiftedStartIdx, 1,
            <b id={corefId} className={"cr cr-" + currentIndexOfCoref} onClick={selectNewCorefEvent}><abbr id={"w" + mentionIdxStart}><a id={"w" + mentionIdxStart}
            href="#d1c1m1">[</a>{wordArr.current[mentionIdxStart]}<a id={"w" + mentionIdxStart} href="#d1c1m1">]</a><sub id={"w" + mentionIdxStart}>
            {currentIndexOfCoref}</sub></abbr></b>);
        } else {
            // TODO: implement correct handling of overlapping coreferences
            //   => check if any mentionIdxRanges overlap (can be done on the "flattenedClust" array) &
            //      make a function that makes the correct JSXElement for these overlapping corefs.
            //      (also use the entire span of the overlapping annotations to set deletedCumulated)
            let endIdxInSentence = mentionIdxEnd - sentenceOffsets[sentenceIdx]
            let mentionSlice: JSX.Element[] = sentBuffer.slice(shiftedStartIdx + 1,
                                                               endIdxInSentence - deleted[startIdxInSentence])
            sentBuffer.splice(shiftedStartIdx, mentionIdxEnd + 1 - mentionIdxStart,
            <b id={corefId} className={"cr cr-" + currentIndexOfCoref} onClick={selectNewCorefEvent}><abbr id={"w" + mentionIdxStart}>{" "}<a id={"w" + mentionIdxStart}
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
