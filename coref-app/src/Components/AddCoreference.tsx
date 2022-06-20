import * as React from 'react';
import {MutableRefObject} from "react";
import {Mention} from "./MainView";
import {addNewCoref} from "./CorefView";
import "./AddCoreference.css"
import {Button} from "@mui/material";


interface AddCoreferenceProps {
    selectedCoref: number[]
    currentMention: Mention | undefined
    wordArr: MutableRefObject<string[]>
    allCorefsMapped: MutableRefObject<Map<string, Mention>>
    allCorefs: MutableRefObject<Mention[][]>
    markedWord: MutableRefObject<number[]>
    handleSelectCoref: Function;
    setCurrentMention: Function
}

const AddCoreference: React.FC<AddCoreferenceProps> = ({ selectedCoref, currentMention, wordArr,
                                                           allCorefsMapped, allCorefs, markedWord,
                                                           handleSelectCoref, setCurrentMention}) => {

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
            let mention: Mention = addNewCoref(clusterId, allCorefs.current, allCorefsMapped.current, wordArr.current, markedWord.current)!
            setCurrentMention(mention)
            handleSelectCoref(mention.selectionRange)
        }
    }

    return (
        <span className="dropdown">
            <Button variant="outlined" onClick={dropdown} className="dropbtn"
                    disabled={!!currentMention || selectedCoref.length == 0}
                    style={{margin: 5, textTransform: "none", width: "97%"}}>Add new Coreference</Button>
            <div id="myDropdown" className="dropdown-content">
                <a href="#" onClick={addCoref(allCorefs.current.length + 1)}>New Cluster</a>
                {allCorefs.current.map((mentions, index) =>
                    (<a href="#" onClick={addCoref(index + 1)}>Cluster {index + 1}</a>))}
            </div>
        </span>
    );
}

export default AddCoreference;
