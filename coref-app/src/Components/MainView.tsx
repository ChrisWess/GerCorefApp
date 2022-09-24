import React, {MutableRefObject, useState} from 'react';
import "./MainView.css"
import {Divider, List, ListItem, ListItemIcon, Pagination} from "@mui/material";
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
    autoCreated: boolean
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
    hovertoggle: boolean
    autoAnnotoggle: boolean
    setCurrentPage: any
    currentPage: any
    itemsPerPage: any
    children: any
    sentenceToHighlight: any
    setSentenceToHighlight: any
    wordsToHighlight: any
    unsavedChanges: boolean
    currDocInfo: string[]
    inputText: any
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

function flattenClust(buffer: any, clust: any, allCorefs: any, sentenceOffsets: any, isNewDoc: boolean) {
    let flattenedClust = []
    let clustCopy = _.cloneDeep(clust);
    let deletedCumulated: number[][] = Array(buffer.length).fill(null).map(
        (value, index) => Array(buffer[index].length).fill(0))
    for (let i = 0; i < clust.length; i++) {
        if (isNewDoc) {
            allCorefs.current.push(Array<Mention>())
        }
        for (let j = 0; j < clust[i].length; j++) {
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


const Highlighted = ({ text = "a", highlight = "a" }) => {
    if (highlight == ".") {
        return <span style={{backgroundColor: "yellow"}}>{text}</span>;
    }
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
        <span>
            {parts.filter(String).map((part, i) => {
                return regex.test(part) ? (
                    <mark key={i}>{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                );
            })}
        </span>
    );
};

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               wordArr, wordFlags,
                                               setNewCorefSelection, markWords, keyShortcutExecuted, 
                                               hovertoggle, autoAnnotoggle, setCurrentPage,
                                               currentPage, itemsPerPage, sentenceToHighlight,
                                               setSentenceToHighlight, wordsToHighlight, unsavedChanges,
                                               currDocInfo, inputText}) => {
    //For Pagination
    const [listItem, setListItems] = useState([]);
    const indexOfLastItem = currentPage*itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    //const style={ index_to_highlight === index? {fontFamily: "cursive", fontWeight: "bold", fontSize: "2rem"};
    //{fontFamily: "sans-serif", fontWeight: "normal", fontSize: "1rem"}

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
                setInput(currentInput+key)
            }
        }
    };
    //

    const selectNewCorefEvent = function(value: any) {
        setNewCorefSelection(value)
    };

    const wordClickEvent = function(value: any) {
        let wid = parseInt(value.currentTarget.id.substring(1))
        markWords([wid], value.currentTarget)
    };

    //State before anything is sent to the API
    if(txt.length === 0)
        return <h1>no document</h1>

    wordArr.current = []
    wordFlags.current = []

    //Puts Text in array of sentences, each word wrapped in <abbr> element.
    let buffer: JSX.Element[][] = new Array<JSX.Element[]>()
    let sentenceOffsets: number[] = [0]
    let current = 0;
    for (let i = 0; i < txt.length; i++) {
        let sentence: JSX.Element[] = []
        for (let j = 0; j < txt[i].length; j++) {
            let token: string = txt[i][j];
            let currentId = 'w' + wordArr.current.length;
            if (token.match(/^[.,:!?;]$/)) {  // check for punctuation
                if (wordsToHighlight.length != 0 && current < wordsToHighlight.length
                    && i == wordsToHighlight[current].num - 1 
                    && j >= wordsToHighlight[current].words[0] 
                    && j <= wordsToHighlight[current].words[1]) {
                    sentence.push(<abbr key={currentId} id={currentId}>
                        <Highlighted text={token} highlight={inputText} /></abbr>);
                    if (j == wordsToHighlight[current].words[1]) {
                        current += 1;
                    }
                }
                else {
                    sentence.push(<abbr key={currentId} id={currentId}>{token}</abbr>)
               }
                if (token === '.' && j !== txt[i].length - 1) {
                    wordFlags.current.push(null)
                } else {
                    wordFlags.current.push(false)
                }
            } else {
                if (wordsToHighlight.length != 0 && current < wordsToHighlight.length 
                    && i == wordsToHighlight[current].num - 1 
                    && j >= wordsToHighlight[current].words[0] 
                    && j <= wordsToHighlight[current].words[1]) {  
                    if  (j == wordsToHighlight[current].words[0]) {
                        sentence.push(<abbr key={currentId} id={currentId} className="wregular" onClick={wordClickEvent} 
                            ><Highlighted text={" " + token} highlight={inputText.split(" ")[0]} /></abbr>);
                    } else if (j == wordsToHighlight[current].words[1]) {
                        sentence.push(<abbr key={currentId} id={currentId} className="wregular" onClick={wordClickEvent} 
                            ><Highlighted text={" " + token} highlight={" " + inputText.split(" ").at(-1)} />
                        </abbr>);
                    } else {
                        sentence.push(<abbr key={currentId} id={currentId} className="wregular" onClick={wordClickEvent} 
                            style={{backgroundColor: "yellow"}}>{" " + token} </abbr>);
                    }
                    if (j == wordsToHighlight[current].words[1]) {
                        current += 1;
                    }
                } else {
                    sentence.push(<abbr key={currentId} id={currentId} className="wregular" onClick={wordClickEvent}>
                        {" " + token}</abbr>)
                }
                wordFlags.current.push(true)
            }
            wordArr.current.push(token)
        }
        buffer.push(sentence)
        sentenceOffsets.push(sentenceOffsets[i] + txt[i].length)
    }

    let isNewDoc: boolean = allCorefs.current.length === 0
    let results = flattenClust(buffer, clust, allCorefs, sentenceOffsets, isNewDoc);
    let flattenedClust = results[0]
    let deletedCumulated = results[1]

    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //
    // !! overlapping corefs cause many errors, also when trying to make new overlapping corefs !!
    current = 0;
    for (let i = 0; i < flattenedClust.length; i++) {
        let mentionIdxStart = flattenedClust[i][0]
        let mentionIdxEnd = flattenedClust[i][1]
        let clusterIdx = flattenedClust[i][2]
        let currentIndexOfCoref = clusterIdx + 1;
        let mentionIdx = flattenedClust[i][3]
        let coref = wordArr.current.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
        let corefId = `d1c${clusterIdx}m${mentionIdx}`
        let cluster: Mention[] = allCorefs.current[clusterIdx]
        if (mentionIdx >= cluster.length) {
            cluster[mentionIdx] = {
                id: corefId,
                content: coref,
                selectionRange: [mentionIdxStart, mentionIdxEnd + 1],
                documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                autoCreated: true
            }
        }
        let sentenceIdx: number = getSentenceIdx(mentionIdxEnd, sentenceOffsets)!
        let sentBuffer: JSX.Element[] = buffer[sentenceIdx]
        let deleted = deletedCumulated[sentenceIdx]
        let startIdxInSentence = mentionIdxStart - sentenceOffsets[sentenceIdx]
        let shiftedStartIdx = startIdxInSentence - deleted[startIdxInSentence]
        let id = "w" + mentionIdxStart;

        let toHightlight = (wordsToHighlight.length != 0 && current < wordsToHighlight.length
            && sentenceIdx == wordsToHighlight[current].num - 1
            && startIdxInSentence >= wordsToHighlight[current].words[0]
            && startIdxInSentence <= wordsToHighlight[current].words[1]);

        while (wordsToHighlight.length != 0 && current < wordsToHighlight.length 
            && (wordsToHighlight[current].num - 1 < sentenceIdx 
                || (wordsToHighlight[current].num - 1 <= sentenceIdx 
                    && wordsToHighlight[current].words[0] < startIdxInSentence))
                    && !toHightlight) {
            current = current + 1;
            toHightlight = (wordsToHighlight.length != 0 && current < wordsToHighlight.length
                && sentenceIdx == wordsToHighlight[current].num - 1
                && startIdxInSentence >= wordsToHighlight[current].words[0]
                && startIdxInSentence <= wordsToHighlight[current].words[1])
        }

        if (mentionIdxStart === mentionIdxEnd && !(!autoAnnotoggle && cluster[mentionIdx].autoCreated)) {
            let highlight = toHightlight ? 
                            inputText.split(" ")[startIdxInSentence - wordsToHighlight[current].words[0]] 
                            : "";
            sentBuffer.splice(shiftedStartIdx, 1,
            <b key={corefId}
               id={corefId}
               onClick={selectNewCorefEvent}>
                {" "}
                <abbr
                    key={id+"-1"}
                    id={id}
                    className={"cr cr-" + currentIndexOfCoref}>
                    <a key={id+"-2"} id={id} href="#d1c1m1" >[</a>
                    <HoverBox
                    word={wordArr.current[mentionIdxStart]}
                    cluster={currentIndexOfCoref}
                    hovertoggle={hovertoggle}
                    mention={cluster[mentionIdx]} 
                    inputText={highlight}/>
                                    <a key={id+"-4"} id={id} href="#d1c1m1">]</a>
                    <sub key={id+"-5"} id={id}>{currentIndexOfCoref}</sub>
                </abbr>
            </b>);
        } else if (!(!autoAnnotoggle && cluster[mentionIdx].autoCreated)){
            // TODO: implement correct handling of overlapping coreferences
            //   => check if any mentionIdxRanges overlap (can be done on the "flattenedClust" array) &
            //      make a function that makes the correct JSXElement for these overlapping corefs.
            //      (also use the entire span of the overlapping annotations to set deletedCumulated)
            let endIdxInSentence = mentionIdxEnd - sentenceOffsets[sentenceIdx]
            let mentionSlice: JSX.Element[] = sentBuffer.slice(shiftedStartIdx + 1,
                endIdxInSentence - deleted[startIdxInSentence])
            let id1 = "w" + mentionIdxEnd;
           // style={toHightlight?{fontWeight: "bold", fontSize: "2rem"}:{}}>
            let highlight = toHightlight ? 
                            (inputText.split(" ").slice(startIdxInSentence - wordsToHighlight[current].words[0],
                                endIdxInSentence - wordsToHighlight[current].words[0])).join(" ") : "";
            sentBuffer.splice(shiftedStartIdx, mentionIdxEnd + 1 - mentionIdxStart,
                <b key={corefId} id={corefId} onClick={selectNewCorefEvent} >
                    {" "}
                    <abbr key={id+"-1"} id={id} className={"cr cr-" + currentIndexOfCoref}>
                        <a key={id+"-2"} id={id} href="#d1c1m1">[</a>
                        <HoverBox word={wordArr.current[mentionIdxStart]} cluster={currentIndexOfCoref} 
                            hovertoggle={hovertoggle} mention={cluster[mentionIdx]} inputText={highlight}/>
                    </abbr>
                    {mentionSlice.map((elem, index) => (
                        <abbr key={'w' + (mentionIdxStart + index + 1)+"-1"}
                              id={'w' + (mentionIdxStart + index + 1)}
                              className={"cr cr-" + currentIndexOfCoref}>
                            {" "}
                            <HoverBox word={wordArr.current[mentionIdxStart + index + 1]} cluster={currentIndexOfCoref} 
                                    hovertoggle={hovertoggle} mention={cluster[mentionIdx]} inputText={highlight}/>
                        </abbr>
                    ))}
                    <abbr key={id1+"-1"} id={id1} className={"cr cr-" + currentIndexOfCoref}>
                        {" "}
                        <HoverBox word={wordArr.current[mentionIdxEnd]} cluster={currentIndexOfCoref} 
                            hovertoggle={hovertoggle} mention={cluster[mentionIdx]} inputText={highlight}/>
                        <a key={id1+"-2"} id={id1} href="#d1c1m1">]</a>
                        <sub key={id1+"-3"} id={id1}>{currentIndexOfCoref}</sub>
                    </abbr>
                </b>);
        }
    }


    //Decide which Items are to be displayed on this page
    const currentItems = buffer.slice(indexOfFirstItem, indexOfLastItem);
    let index_to_highlight = -1;
    if (indexOfFirstItem < sentenceToHighlight && sentenceToHighlight <= indexOfLastItem) {
        index_to_highlight = sentenceToHighlight - indexOfFirstItem - 1;
    }
    const sentenceList = currentItems.map((d, index) =>
        <React.Fragment key={index}>
            <ListItem divider key={index+".1"} selected={index_to_highlight === index? true : false}>
                <ListItemIcon key={index+".2"}>
                    {index+indexOfFirstItem+1}
                </ListItemIcon>
                <div key={index+".3"}>{d}</div>
                <Divider key={index+".4"} />
            </ListItem>
        </React.Fragment>
    );
    //todo: fix problem with scrolling
    //style={{fontSize: index_to_highlight === index? 20: 15}}
    return (
        <>
            <div style={{height:720, overflow: 'auto', paddingTop: '10px'}}  onKeyUp={deactivateListener} onKeyPress={processKey} tabIndex={1}>
                <div style={{textAlign: 'center', overflow: 'auto'}}>
                    {currDocInfo.length === 0 ? "" : unsavedChanges ? (currDocInfo[1] + "*") : currDocInfo[1]}
                </div>
                <article id="docView">
                        <List className="pagination" key={"mainList"}>
                                {sentenceList}
                        </List>
                </article>
            </div>
            <Pagination
                count={Math.ceil(buffer.length / itemsPerPage)}
                onChange={(event,page) => { setCurrentPage(page); setSentenceToHighlight(0); }}
                style={{marginLeft: "auto", marginRight: "auto"}}
                page={currentPage}
            />
        </>
    );
};

export default MainView;
