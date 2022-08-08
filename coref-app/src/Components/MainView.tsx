import React, {MutableRefObject, useState} from 'react';
import "./MainView.css"
import {Divider, List, ListItem,ListItemIcon, Pagination} from "@mui/material";
import set = Reflect.set;
import HoverBox from "./HoverBox";
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
    keyShortcutExecuted: Function
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

function flattenClust(buffer: any, clust: any, allCorefs: any, sentenceOffsets: any){
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
    return [flattenedClust, deletedCumulated]
}


const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               wordArr, wordFlags,
                                               setNewCorefSelection, markWords, keyShortcutExecuted }) => {



    //For Pagination
    const [listItem, setListItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const indexOfLastItem = currentPage*itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    //functions for editing shortcuts: "a" activates shortcut, subsequent number is recorded and saved in current input
    //input is processed and cleared when "a" is released (currentInput and setInput).
    //
    const [currentInput, setInput] = useState("");
    const [listenToKeyboard, toggleListener] = useState(false);

    function isProcessable(key: string){
        let processableKeys = ["0","1","2","3","4","5","6","7","8","9","d","n","c","v"]
        return processableKeys.includes(key)
    }

    const deactivateListener = (e: React.KeyboardEvent<HTMLImageElement>) => {
        if(e.key === "a"){
            toggleListener(false)
            console.log(currentInput)
            keyShortcutExecuted(currentInput)
            setInput("")
        }
    };

    const processKey = (e: React.KeyboardEvent<HTMLImageElement>) => {
        let key = e.key
        if(key === "a"){
            toggleListener(true)
        }
        if(listenToKeyboard){
            if (isProcessable(key)) {
                setInput(key)
            }
        }
    };
    //

    const selectNewCorefEvent = function(value: any) {
        setNewCorefSelection(value)
    };

    const hoverEvent = function(word: any, clust: any) {
        console.log(word+" and "+clust);
    };

    const wordClickEvent = function(value: any) {
        let wid = parseInt(value.currentTarget.id.substring(1))
        markWords([wid], value.currentTarget)
    };

    //State before anything is sent to the API
    if(txt.length === 0)
        return <h1>No Document yet</h1>

    wordArr.current = []
    wordFlags.current = []

    //Puts Text in array of sentences, each word wrapped in <abbr> element.
    let buffer: JSX.Element[][] = new Array<JSX.Element[]>()
    let sentenceOffsets: number[] = [0]
    for (let i = 0; i < txt.length; i++) {
        let sentence: JSX.Element[] = []
        for (let j = 0; j < txt[i].length; j++) {
            let token: string = txt[i][j];
            let currentId = 'w' + wordArr.current.length;
            if (token.match(/^[.,:!?]$/)) {  // check for punctuation
                sentence.push(<abbr key={currentId} id={currentId}>{token}</abbr>)
                if (token === '.' && j !== txt[i].length - 1) {
                    wordFlags.current.push(null)
                } else {
                    wordFlags.current.push(false)
                }
            } else {
                sentence.push(<abbr key={currentId} id={currentId} className="wregular" onClick={wordClickEvent}>{" " + token}</abbr>)
                wordFlags.current.push(true)
            }
            wordArr.current.push(token)
        }
        buffer.push(sentence)
        sentenceOffsets.push(sentenceOffsets[i] + txt[i].length)
    }

    //not sure what this does lol
    let results = flattenClust(buffer, clust,allCorefs,sentenceOffsets);
    let flattenedClust = results[0]
    let deletedCumulated = results[1]
    console.log(clust)
    console.log(flattenedClust)
    console.log(deletedCumulated)

    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //
    // !! overlapping corefs cause many errors, also when trying to make new overlapping corefs !!
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
        let id = "w" + mentionIdxStart;
        if (mentionIdxStart === mentionIdxEnd) {
            sentBuffer.splice(shiftedStartIdx, 1,
            <b key={corefId}
               id={corefId}
               onClick={selectNewCorefEvent}>
                                                {" "}
                                                <abbr
                                                    key={id+"-1"}
                                                    id={id}
                                                    className={"cr cr-" + currentIndexOfCoref}>
                                                                    <a key={id+"-2"} id={id} href="#d1c1m1">[</a>
                                                    <HoverBox
                                                    word={wordArr.current[mentionIdxStart]}
                                                    cluster={currentIndexOfCoref}/>
                                                                    <a key={id+"-4"} id={id} href="#d1c1m1">]</a>
                                                    <sub key={id+"-5"} id={id}>{currentIndexOfCoref}</sub>
                                                </abbr>
            </b>);
        } else {
            // TODO: implement correct handling of overlapping coreferences
            //   => check if any mentionIdxRanges overlap (can be done on the "flattenedClust" array) &
            //      make a function that makes the correct JSXElement for these overlapping corefs.
            //      (also use the entire span of the overlapping annotations to set deletedCumulated)
            let endIdxInSentence = mentionIdxEnd - sentenceOffsets[sentenceIdx]
            let mentionSlice: JSX.Element[] = sentBuffer.slice(shiftedStartIdx + 1,
                                                               endIdxInSentence - deleted[startIdxInSentence])
            let id1 = "w" + mentionIdxEnd;
            sentBuffer.splice(shiftedStartIdx, mentionIdxEnd + 1 - mentionIdxStart,
            <b key={corefId} id={corefId} onClick={selectNewCorefEvent}>{" "}<abbr key={id+"-1"} id={id} className={"cr cr-" + currentIndexOfCoref}><a key={id+"-2"} id={id}
            href="#d1c1m1">[</a>{wordArr.current[mentionIdxStart]}</abbr>
                {mentionSlice.map((elem, index) => (
                                <abbr key={'w' + (mentionIdxStart + index + 1)+"-1"} id={'w' + (mentionIdxStart + index + 1)} className={"cr cr-" + currentIndexOfCoref}>{" " + wordArr.current[mentionIdxStart + index + 1]}</abbr>
                              ))}
                <abbr key={id1+"-1"} id={id1} className={"cr cr-" + currentIndexOfCoref}>{" " + wordArr.current[mentionIdxEnd]}<a key={id1+"-2"} id={id1}
            href="#d1c1m1">]</a><sub key={id1+"-3"} id={id1}>{currentIndexOfCoref}</sub></abbr></b>);
        }
    }

    //Decide which Items are to be displayed on this page
    const currentItems = buffer.slice(indexOfFirstItem, indexOfLastItem);
    const sentenceList = currentItems.map((d, index) =>
        <React.Fragment key={index}>
            <ListItem divider key={index+".1"}>
                <ListItemIcon key={index+".2"}>
                    {index+indexOfFirstItem+1}
                </ListItemIcon>
                <div key={index+".3"}>{d}</div>
                <Divider key={index+".4"} />
            </ListItem>
        </React.Fragment>
    );
    //

    return (
        <>
            <div style={{height:720}}  onKeyUp={deactivateListener} onKeyPress={processKey} tabIndex={1}>
                <article id="docView">
                        <List className="pagination" key={"mainList"}>
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
};

export default MainView;
