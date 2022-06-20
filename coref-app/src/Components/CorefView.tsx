import React, {MutableRefObject, useState} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, Box, FormControlLabel, Switch} from "@mui/material";
import MyList from "./MyList";
import {Mention} from "./MainView";
import AddCoreference from "./AddCoreference";

interface CorefViewProps {
    selectedCoref: number[],
    wordArr: MutableRefObject<string[]>
    allCorefsMapped: MutableRefObject<Map<string, Mention>>
    allCorefs: MutableRefObject<Mention[][]>
    clusterColor: string
    markedWord: MutableRefObject<number[]>
    currentMention: Mention | undefined
    handleSelectCoref: Function;
    setCurrentMention: Function
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

export const addNewCoref = function(clusterId: number, allCorefs: MutableRefObject<Mention[][]>,
                                    wordArr: string[], markedWord: number[]) {
    if (markedWord.length > 0) {
        if (clusterId > allCorefs.current.length) {
            allCorefs.current.push([])
        }
        let clusterIdx: number = clusterId - 1
        let corefId = `d1c${clusterIdx}m${allCorefs.current[clusterIdx].length}`
        let mention: Mention
        let elem
        let replacement
        let idxStart: number = markedWord[0]
        if (markedWord.length === 1) {
            elem = document.getElementById("w" + idxStart)
            replacement = document.createElement('b');
            replacement.innerHTML = "<b id=\"" + corefId + "\" class=\"cr cr-" + clusterId +
                      `"><bb id="w${idxStart}"> <a id="w${idxStart}" href="#d1c1m1">[</a>` +
                        wordArr[idxStart] + `<a id="w${idxStart}" href="#d1c1m1">]</a><sub id="w${idxStart}">` +
                        clusterId + "</sub></bb></b>";
            elem!.replaceWith(replacement)
            mention = { id: corefId, content: wordArr[idxStart], selectionRange: [idxStart, idxStart + 1] }
        } else {
            elem = document.getElementById("w" + idxStart)
            replacement = document.createElement('b');
            replacement.innerHTML = "<b id=\"" + corefId + "\" class=\"cr cr-" + clusterId +
                       `"><bb id="w${idxStart}"> <a id="w${idxStart}" href="#d1c1m1">[</a>` +
                        wordArr[idxStart]+ "</bb>";
            elem!.replaceWith(replacement)

            let idxEnd: number = markedWord[1]
            for (let i = idxStart + 1; i < idxEnd - 1; i++) {
                elem = document.getElementById("w" + i)
                replacement = document.createElement('b');
                replacement.innerHTML = `<bb id='w${i}'> ` + wordArr[i] + "</bb>";
                elem!.replaceWith(replacement)
            }

            elem = document.getElementById("w" + idxEnd)
            replacement = document.createElement('b');
            replacement.innerHTML = `<bb id="w${idxEnd}"> ` + wordArr[idxEnd] +
                      `<a id="w${idxEnd}" href="#d1c1m1">]</a><sub id="w${idxEnd}">` +
                        clusterId + "</sub></bb></b>";
            elem!.replaceWith(replacement)
            mention = { id: corefId, content: wordArr.slice(idxStart, idxEnd).join(" "), selectionRange: markedWord }
        }
        allCorefs.current[clusterIdx].push(mention)
        return mention
    }
};

const CorefView: React.FC<CorefViewProps> = ({ selectedCoref, wordArr, allCorefsMapped,
                                                 allCorefs, clusterColor, markedWord,
                                                 currentMention, handleSelectCoref, setCurrentMention }) => {
    const theme = useTheme();

    const currentCluster = React.useRef<Mention[]>([]);

    if (currentMention) {
        let mentionLoc = parseMentionId(currentMention.id)
        currentCluster.current = allCorefs.current[mentionLoc.clusterIdx]
    }

    // TODO: top button: open a popup window that lets you select the cluster that you want to assign the selection (marked word)
    //  as a new coreference to

    return (
        <>
            <p>Current Text Selection:</p>
            <Box sx={{ backgroundColor: "gray", border: 1, borderColor: 'black', borderRadius: 1 }}>
                <b><p style={{textAlign: "center", color: clusterColor, fontSize: "18px"}}>
                    {selectedCoref.length == 0 ? "No Selection" :
                        wordArr.current.slice(selectedCoref[0], selectedCoref[1]).join(" ")}
                </p></b>
            </Box>
            <p>Coreferences:</p>
            <MyList
                currentMention={currentMention}
                currentCluster={currentCluster}
                allCorefs={allCorefs}
                markedWord={markedWord}
                handleSelectCoref={handleSelectCoref}
                setCurrentMention={setCurrentMention}/>

            <AddCoreference
                selectedCoref={selectedCoref}
                currentMention={currentMention}
                wordArr={wordArr}
                allCorefsMapped={allCorefsMapped}
                allCorefs={allCorefs}
                markedWord={markedWord}
                handleSelectCoref={handleSelectCoref}
                setCurrentMention={setCurrentMention}/>
            <Button variant="outlined" style={{margin: 5, textTransform: "none", width: "97%"}} disabled={!currentMention}>
                Delete Coreference
            </Button>

            <FormControlLabel control={<Switch defaultChecked />} style={{margin: 5}} label="Model Inference" />
        </>
    );
}

export default CorefView;
