import React, {MutableRefObject, useState} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, Box, FormControlLabel, Checkbox} from "@mui/material";
import MyList from "./MyList";

interface CorefViewProps {
    selectedCoref: number[],
    wordArr: MutableRefObject<string[]>
    clusterColor: string
    handleSelectCoref: Function;
}

const CorefView: React.FC<CorefViewProps> = ({ selectedCoref, wordArr,
                                                 clusterColor, handleSelectCoref }) => {
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
            <MyList handleSelectCoref={handleSelectCoref}/>

            <Button variant="outlined" style={{margin: 5, textTransform: "none"}}>Add new Coreference</Button>
            <Button variant="outlined" style={{margin: 5, textTransform: "none"}}>Delete Coreference</Button>

            <FormControlLabel control={<Checkbox defaultChecked />} style={{margin: 5}} label="Auto-Annotate" />
        </>
    );
}

export default CorefView;
