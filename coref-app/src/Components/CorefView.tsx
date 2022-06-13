import React, {useState} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, Box, FormControlLabel, Checkbox} from "@mui/material";
import MyList from "./MyList";

interface CorefViewProps {
    selectedCoref: string,
    handleSelectCoref: Function;
}

const CorefView: React.FC<CorefViewProps> = ({ selectedCoref, handleSelectCoref }) => {
    const theme = useTheme();

    // TODO: make the text (in Box) have the same color as the mention cluster that it is from
    // TODO: dynamically add more list entries to MyList, when coreference is selected
    return (
        <>
            <p>Current Text Selection:</p>
            <Box sx={{ backgroundColor: "lightgray", border: 1, borderColor: 'black', borderRadius: 1 }}>
                <p style={{textAlign: "center"}}>{selectedCoref}</p>
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
