import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import {FC, ReactNode} from "react";
import * as React from "react";


interface TableDocumentsProps {
    selectDocument: Function
    currDocInfo: string[]
    documentsInfo: [string, string][] | undefined
}


const TableDocuments: FC<TableDocumentsProps> = ({ selectDocument, currDocInfo, documentsInfo }) => {

    const createClickHandler = (docId: string) => {
        return function handleClick() {
            // TODO: don't allow save document when there are unsaved changes => show pop-up if user wants to save/discard/cancel
            return selectDocument(docId)
        }
    };

    //TODO: rewrite it more clear, without 2 lists and if-statement
    if (documentsInfo) {
        let currIndex = -1
        for (let i = 0; i < documentsInfo.length; i++) {
            if (documentsInfo[i][0] === currDocInfo[0]) {
                currIndex = i
                break
            }
        }
        const tableBody = documentsInfo.map((item, index) => (
            <div key={"docSelect" + index}>
                <ListItemButton style={index === currIndex ? { backgroundColor: 'lightGray' } : {}}
                                disabled={index === currIndex}>
                    <ListItemText style={{ lineHeight: 1, margin: 0 }}
                                  onClick={() => createClickHandler(item[0])()}> {item[1]} </ListItemText>
                </ListItemButton>
                <Divider />
            </div>
        ));
        return (
            <List key='list' component="nav" sx={{
                width: '100%', maxWidth: 360,
                bgcolor: 'background.paper', height: 300,
                overflow: 'auto' }}
                subheader={<ListSubheader>Files</ListSubheader>}>
                <Divider />
                {tableBody}
            </List>
        );
    }
    else {
        return (
            <List sx={{
                width: '100%', maxWidth: 360,
                bgcolor: 'background.paper', height: 300, overflow: 'auto'
            }} component="nav"
                subheader={<ListSubheader>Files</ListSubheader>}>
                <><Divider />
                    <ListItem>
                        <ListItemButton disabled={true}>
                            <ListItemText primary="No files uploaded" />
                        </ListItemButton>
                    </ListItem>
                </>
            </List>
        )
    }
}
export default TableDocuments;