import * as React from 'react';
import {MutableRefObject} from "react";
import {clearPrevMarking, Mention} from "./MainView";
import "./AddCoreference.css"
import {Button} from "@mui/material";


interface AddCoreferenceProps {
    selectedCoref: number[]
    currentMention: Mention | undefined
    corefClusters: number[][][]
    wordArr: MutableRefObject<string[]>
    allCorefs: MutableRefObject<Mention[][]>
    markedWord: MutableRefObject<number[]>
    handleSelectCoref: Function;
    setCurrentMention: Function
    setCorefClusters: Function
}

const AddCoreference: React.FC<AddCoreferenceProps> = ({ selectedCoref, currentMention, corefClusters,
                                                           wordArr, allCorefs,
                                                           markedWord, handleSelectCoref, setCurrentMention,
                                                           setCorefClusters }) => {

    function dropdown() {
        document.getElementById("myDropdown")!.classList.toggle("show");
    }

    // Close the dropdown if the user clicks outside of it
    window.onclick = function(event) {
      // @ts-ignore
        if (!event.target!.matches('.dropbtn')) {
            let dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                let openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
      }
    }

    function addCoref(clusterId: number) {
        return function () {
            let idxStart: number = markedWord.current[0]
            let clusterIdx: number = clusterId - 1
            let mentionIdx: number
            if (clusterId > corefClusters.length) {
                corefClusters.push([])
                allCorefs.current.push([])
                mentionIdx = 0
            } else {
                let cluster: number[][] = corefClusters[clusterIdx]
                mentionIdx = cluster.length
                for (let i = 0; i < cluster.length; i++) {
                    if (cluster[i][0] >= idxStart) {
                        mentionIdx = i
                        break
                    }
                }
            }
            let corefId = `d1c${clusterIdx}m${mentionIdx}`
            let newMention: Mention
            if (markedWord.current.length === 1) {
                newMention = {
                    id: corefId,
                    content: wordArr.current[idxStart],
                    selectionRange: [idxStart, idxStart + 1],
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
                }
            } else {
                newMention = {
                    id: corefId,
                    content: wordArr.current.slice(idxStart, markedWord.current[1]).join(" "),
                    selectionRange: markedWord.current,
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
                }
            }
            clearPrevMarking(markedWord.current)
            markedWord.current = []
            // TODO: set color of selected text
            // TODO: couple setSelectedCoref with setClusterColor (call both in one function)
            allCorefs.current[clusterIdx].splice(mentionIdx, 0, newMention)
            setCurrentMention(newMention)
            handleSelectCoref(newMention.selectionRange)
            corefClusters[clusterIdx].splice(mentionIdx, 0, [newMention.selectionRange[0], newMention.selectionRange[1] - 1])
            setCorefClusters(corefClusters)
        }
    }

    return (
        <span className="dropdown">
            <Button variant="outlined" onClick={dropdown} className="dropbtn"
                    disabled={!!currentMention || selectedCoref.length == 0}
                    style={{margin: 5, textTransform: "none", width: "97%"}}>Add new Coreference</Button>
            <div id="myDropdown" className="dropdown-content">
                <a onClick={addCoref(allCorefs.current.length + 1)}>New Cluster</a>
                {allCorefs.current.map((mentions, index) =>
                    (<a onClick={addCoref(index + 1)}>Cluster {index + 1}</a>))}
            </div>
        </span>
    );
}

export default AddCoreference;
