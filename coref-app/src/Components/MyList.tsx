import * as React from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import {MutableRefObject, useEffect} from "react";
import {clearPrevMarking, Mention} from "./MainView";
import {parseMentionId} from "./CorefView";


interface MyListProps {
    selectedCoref: number[]
    allCorefsMapped: MutableRefObject<Map<string, Mention>>
    allCorefs: MutableRefObject<Mention[][]>
    markedWord: MutableRefObject<number[]>
    currentMention: Mention | undefined
    handleSelectCoref: Function;
    setCurrentMention: Function
}

const MyList: React.FC<MyListProps> = ({ selectedCoref, allCorefsMapped, allCorefs,
                                           markedWord, currentMention,
                                           handleSelectCoref, setCurrentMention }) => {

    const handleClick = (mention: Mention) => {
        return function () {
          clearPrevMarking(markedWord.current)
          handleSelectCoref(mention.selectionRange)
          setCurrentMention(mention)
        }
    };

    const listItems = () => {
        if (selectedCoref.length != 0 && currentMention) {
            let mentionLoc = parseMentionId(currentMention.id)
            let cluster: Mention[] = allCorefs.current[mentionLoc.clusterIdx]
            return cluster.map((mention) => (
                                    <ListItemButton id={"corefitem-" + mention.id} onClick={handleClick(mention)}>
                                        <ListItemText primary={mention.content} />
                                    </ListItemButton>
                                  ))
        } else {
            return <ListItemButton id="corefitemNA" disabled={true}>
                    <ListItemText primary="N/A" />
                </ListItemButton>
        }
    };

    /*useEffect(() => {
        allCorefs.current
    }, [allCorefs]);*/

    // TODO: keep track of each mention id in the corresponding item and set it as selected coref when selected in list
    return (
    <List sx={{ marginTop: -1, width: '100%', maxWidth: 360,
        bgcolor: 'background.paper', height: 200, overflow: 'auto' }} component="nav">
        {listItems()}
    </List>
    );
}

export default MyList;
