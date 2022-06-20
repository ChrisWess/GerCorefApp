import * as React from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import {MutableRefObject} from "react";
import {clearPrevMarking, Mention} from "./MainView";


interface MyListProps {
    currentMention: Mention | undefined
    currentCluster: MutableRefObject<Mention[]>
    allCorefs: MutableRefObject<Mention[][]>
    markedWord: MutableRefObject<number[]>
    handleSelectCoref: Function;
    setCurrentMention: Function
}

const MyList: React.FC<MyListProps> = ({ currentMention, currentCluster,
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
            return currentCluster.current.map((mention) => (
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

    return (
    <List sx={{ marginTop: -1, width: '100%', maxWidth: 360,
        bgcolor: 'background.paper', height: 200, overflow: 'auto' }} component="nav">
        {listItems()}
    </List>
    );
}

export default MyList;
