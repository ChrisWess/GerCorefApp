import React, {MutableRefObject, useState} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, Box, FormControlLabel, Checkbox} from "@mui/material";
import MyList from "./MyList";
import {Mention} from "./MainView";

interface CorefViewProps {
    selectedCoref: number[],
    wordArr: MutableRefObject<string[]>
    allCorefsMapped: MutableRefObject<Map<string, Mention>>
    allCorefs: MutableRefObject<Mention[][]>
    clusterColor: string
    markedWord: MutableRefObject<number[]>
    handleSelectCoref: Function;
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

const CorefView: React.FC<CorefViewProps> = ({ selectedCoref, wordArr, allCorefsMapped,
                                                 allCorefs, clusterColor,
                                                 markedWord, handleSelectCoref }) => {
    const theme = useTheme();

    // TODO: dynamically add more list entries to MyList, when coreference is selected
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
                selectedCoref={selectedCoref}
                allCorefsMapped={allCorefsMapped}
                allCorefs={allCorefs}
                markedWord={markedWord}
                handleSelectCoref={handleSelectCoref}/>

            <Button variant="outlined" style={{margin: 5, textTransform: "none"}}>Add new Coreference</Button>
            <Button variant="outlined" style={{margin: 5, textTransform: "none"}}>Delete Coreference</Button>

            <FormControlLabel control={<Checkbox defaultChecked />} style={{margin: 5}} label="Auto-Annotate" />
        </>
    );
}

export default CorefView;
