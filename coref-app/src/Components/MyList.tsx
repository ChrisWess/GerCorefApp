import * as React from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import {MutableRefObject} from "react";
import {Mention} from "./MainView";
import {clearPrevMarking} from "./MainPage";


interface MyListProps {
    currentMention: Mention | undefined
    allCorefs: MutableRefObject<Mention[][]>
    markedWord: MutableRefObject<number[]>
    handleSelectCoref: Function;
    setCurrentMention: Function
}

const MyList: React.FC<MyListProps> = ({ currentMention, allCorefs,
                                           markedWord, handleSelectCoref, setCurrentMention }) => {

    const handleClick = (mention: Mention) => {
        return function () {
          clearPrevMarking(markedWord.current)
          handleSelectCoref(mention.selectionRange)
          setCurrentMention(mention)
        }
    };

    const listItems = () => {
        if (currentMention) {
            let currentCluster: Mention[] = allCorefs.current[currentMention.clusterIdx]
            return currentCluster.map((mention) => (
                                    <ListItemButton key={"corefitem-" + mention.id} id={"corefitem-" + mention.id} onClick={handleClick(mention)}>
                                        <ListItemText key={"corefcontent-" + mention.id} primary={mention.content} />
                                    </ListItemButton>
                                  ))
        } else {
            return <ListItemButton key="corefitemNA" id="corefitemNA" disabled={true}>
                    <ListItemText primary="N/A" />
                </ListItemButton>
        }
    };

    return (
    <List sx={{ marginTop: -1, width: '100%', maxWidth: 360,
        bgcolor: 'background.paper', height: 200, overflow: 'auto' }} component="nav">
        {listItems()}
    </List>
    );
}

export default MyList;
