import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import { FC, ReactNode } from "react";
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import "./TableDocuments.css";
import * as React from 'react';


interface TableDocumentsProps {
    selectDocument: Function
    currDocInfo: string[]
    documentsInfo: [string, string][] | undefined
    clearText: Function
}


const TableDocuments: FC<TableDocumentsProps> = ({ selectDocument, currDocInfo,
    documentsInfo, clearText }) => {

    const [items, setItems] = React.useState<[string, string][] | undefined>(documentsInfo);

    const createClickHandler = (docId: string) => {
        if (currDocInfo[0] !== docId) {
            return function handleClick() {
                // TODO: don't allow change document when there are unsaved changes => show pop-up if user wants to save/discard/cancel
                return selectDocument(docId)
            }
        }
    };

    const clearButton = async (index: number) => {
        if (documentsInfo) {
            let docId = documentsInfo[index][0];
            documentsInfo = documentsInfo.splice(index, 1)
            setItems(documentsInfo);
            if (currDocInfo[0] === docId) {
                clearText();
            }
            try {
                const { data } = await axios.delete(
                    `http://127.0.0.1:5000/doc/${docId}`,
                    {
                        withCredentials: true,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                        },
                    },
                );
                if (data.status === 200) {
                    return data.result
                } else {
                    return "error status: " + data.status
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.log('error message: ', error.message);
                    return error.message;
                } else {
                    console.log('unexpected error: ', error);
                    return 'An unexpected error occurred';
                }
            }
        }
    }

    if (documentsInfo) {
        let currIndex = -1
        for (let i = 0; i < documentsInfo.length; i++) {
            if (documentsInfo[i][0] === currDocInfo[0]) {
                currIndex = i
                break
            }
        }
        const tableBody = documentsInfo.map((item, index) => (
            <div key={index}>
                <ListItem style={index === currIndex ? {
                    backgroundColor: 'darkgrey',
                    height: 40
                } : { height: 40 }}
                    className="toSelect"
                    secondaryAction={
                        <IconButton aria-label="comment" onClick={() => clearButton(index)}>
                            <DeleteIcon />
                        </IconButton>}>
                    <ListItemText primary={item[1]} onClick={createClickHandler(item[0])} />
                </ListItem>
                <Divider />
            </div>
        ));

        return (
            <List key='list' component="nav" sx={{
                width: '100%', maxWidth: 360,
                bgcolor: 'background.paper', height: 300,
                overflow: 'auto'
            }}
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