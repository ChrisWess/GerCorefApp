import * as React from 'react';
import {MutableRefObject} from "react";
import {Mention} from "./MainView";
import "./AddCoreference.css"
import {Button} from "@mui/material";


interface AddCoreferenceProps {
    selectedCoref: number[]
    currentMention: Mention | undefined
    corefClusters: number[][][]
    wordArr: MutableRefObject<string[]>
    allCorefs: MutableRefObject<Mention[][]>
    markedWord: MutableRefObject<number[]>
    setNewCorefSelection: Function
    setCorefClusters: Function
    addCoref: Function
}

const AddCoreference: React.FC<AddCoreferenceProps> = ({ selectedCoref, currentMention, corefClusters,
                                                           wordArr, allCorefs,
                                                           markedWord, setNewCorefSelection,
                                                           setCorefClusters, addCoref}) => {


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

    function shortCutAddCoref() {
        console.log("succesfully invoked")
    }

    return (
        <span className="dropdown">
            <Button variant="outlined" onClick={dropdown} className="dropbtn"
                    disabled={!!currentMention || selectedCoref.length == 0}
                    style={{margin: 5, textTransform: "none", width: "97%"}}>Add new Coreference</Button>
            <div id="myDropdown" className="dropdown-content">
                <a key={"newCluster"} onClick={addCoref(allCorefs.current.length + 1)}>New Cluster</a>
                {allCorefs.current.map((mentions, index) =>
                    (<a key={"Cluster-"+index+1} onClick={addCoref(index + 1)}>Cluster {index + 1}</a>))}
            </div>
        </span>
    );
}

export default AddCoreference;
