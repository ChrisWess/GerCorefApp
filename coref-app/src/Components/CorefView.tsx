import React, {MutableRefObject} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, Box, FormControlLabel, Switch} from "@mui/material";
import MyList from "./MyList";
import {Mention, parseMentionId} from "./MainView";
import AddCoreference from "./AddCoreference";

interface CorefViewProps {
    selectedCoref: number[],
    wordArr: MutableRefObject<string[]>
    corefClusters: number[][][]
    allCorefs: MutableRefObject<Mention[][]>
    clusterColor: string
    markedWord: MutableRefObject<number[]>
    currentMention: Mention | undefined
    handleSelectCoref: Function;
    setCurrentMention: Function
    setCorefClusters: Function
}

export const getCluster = function(mention: Mention, allCorefs: Mention[][]) {
    let mentionLoc = parseMentionId(mention.id)
    return allCorefs[mentionLoc.clusterIdx]
}

const CorefView: React.FC<CorefViewProps> = ({ selectedCoref, wordArr, corefClusters,
                                                 allCorefs, clusterColor, markedWord,
                                                 currentMention, handleSelectCoref, setCurrentMention, setCorefClusters }) => {
    const theme = useTheme();

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
                allCorefs={allCorefs}
                markedWord={markedWord}
                handleSelectCoref={handleSelectCoref}
                setCurrentMention={setCurrentMention}/>

            <AddCoreference
                selectedCoref={selectedCoref}
                currentMention={currentMention}
                corefClusters={corefClusters}
                wordArr={wordArr}
                allCorefs={allCorefs}
                markedWord={markedWord}
                handleSelectCoref={handleSelectCoref}
                setCurrentMention={setCurrentMention}
                setCorefClusters={setCorefClusters}/>
            <Button variant="outlined" style={{margin: 5, textTransform: "none", width: "97%"}} disabled={!currentMention}>
                Delete Coreference
            </Button>

            <FormControlLabel control={<Switch defaultChecked />} style={{margin: 5}} label="Model Inference" />
        </>
    );
}

export default CorefView;
