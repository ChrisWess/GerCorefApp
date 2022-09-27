import React, {MutableRefObject} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, Box, FormControlLabel, Switch} from "@mui/material";
import MyList from "./MyList";
import {Mention, parseMentionId} from "./MainView";
import AddCoreference from "./AddCoreference";

interface CorefViewProps {
    selectedCoref: number[],
    wordArr: MutableRefObject<string[]>
    allCorefs: MutableRefObject<Mention[][]>
    clusterColor: string
    markedWord: MutableRefObject<number[]>
    markedWordsPrevColors: MutableRefObject<any[]>
    currentMention: Mention | undefined
    handleSelectCoref: Function;
    setCurrentMention: Function
    addCoref: Function
    deleteCoref: Function
    setHovertoggle: Function
    hovertoggle: boolean
    autoAnnotoggle: boolean
    setAutoAnnotoggle: Function
    unsavedChanges: boolean
    saveChanges: Function
    changePage: Function
}

export const getCluster = function(mention: Mention, allCorefs: Mention[][]) {
    let mentionLoc = parseMentionId(mention.id)
    return allCorefs[mentionLoc.clusterIdx]
}

const CorefView: React.FC<CorefViewProps> = ({ selectedCoref, wordArr,
                                                 allCorefs, clusterColor, markedWord, markedWordsPrevColors,
                                                 currentMention, handleSelectCoref, setCurrentMention,
                                                 addCoref, deleteCoref, setHovertoggle, hovertoggle, autoAnnotoggle,
                                                 setAutoAnnotoggle, unsavedChanges, saveChanges, 
                                                 changePage }) => {
    const theme = useTheme();

    function deleteC() {
        deleteCoref()
    }

    function saveChange() {
        saveChanges()
    }

    function toggleAutoAnno() {
        setAutoAnnotoggle(!autoAnnotoggle)
    }

    function toggleHover() {
        setHovertoggle(!hovertoggle)
    }

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
                allCorefs={allCorefs}
                markedWord={markedWord}
                markedWordsPrevColors={markedWordsPrevColors}
                handleSelectCoref={handleSelectCoref}
                setCurrentMention={setCurrentMention}
                changePage={changePage}/>

            <AddCoreference
                selectedCoref={selectedCoref}
                currentMention={currentMention}
                allCorefs={allCorefs}
                addCoref={addCoref}/>
            <Button variant="outlined" style={{margin: 5, textTransform: "none", width: "97%"}} disabled={!currentMention}
                    onClick={deleteC}>
                Delete Coreference
            </Button>
            <Button variant="outlined" style={{margin: 5, textTransform: "none", width: "97%"}} disabled={!unsavedChanges}
                    onClick={saveChange}>
                Save Changes (Ctrl + S)
            </Button>

            <FormControlLabel onChange={toggleAutoAnno} control={<Switch defaultChecked />} style={{margin: 5}} label="Model Inference" />
            <FormControlLabel onChange={toggleHover} control={<Switch defaultChecked />} style={{margin: 5}} label="Hover Information" />
        </>
    );
}

export default CorefView;
