import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import { FC, ReactNode } from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import "./TableDocuments.css";
import * as React from 'react';


interface TableDocumentsProps {
    selectDocument: Function
    currDocInfo: string[]
    documentsInfo: [string, string][] | undefined
    setDocumentsInfo: Function
    clearText: Function
    changePage: Function
    clearCurrentMention: Function
    unsavedChanges: boolean
    saveChanges: Function
    clearChanges: Function

}


const TableDocuments: FC<TableDocumentsProps> = ({ selectDocument, currDocInfo,
    documentsInfo,setDocumentsInfo, clearText, changePage, clearCurrentMention, unsavedChanges, clearChanges, saveChanges }) => {

    const [items, setItems] = React.useState<[string, string][] | undefined>(documentsInfo);
    const [open, setOpen] = React.useState(false);
    const [docToDelete, setDocToDelete] = React.useState<[string, string]| undefined>();
    const [saveOpen, setSaveOpen] = React.useState(false);

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    function openSaveDialog(){
        setSaveOpen(true);
    }
    function closeSaveDialog(docId?: string){
        setSaveOpen(false);
        if(docId!)
            selectDocument(docId)
    }

    const clearButton = async () => {
        handleClose()
        if (docToDelete) {
            if(items && documentsInfo) {
                setItems(items.filter(item => item[0] != docToDelete[0]));
                setDocumentsInfo(documentsInfo.filter(item => item[0] != docToDelete[0]))
            }

            if (currDocInfo[0] === docToDelete[0]) {
                clearText();
                changePage(0);
                clearCurrentMention();
            }
            try {
                const { data } = await axios.delete(
                    `http://127.0.0.1:5000/doc/${docToDelete[0]}`,
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
        setDocToDelete(undefined)
    }

    if (items) {
        let currIndex = -1
            for (let i = 0; i < items.length; i++) {
                if (items[i][0] === currDocInfo[0]) {
                    currIndex = i
                    break
                }
            }
        const tableBody = items.map((item, index) => (
            <div key={index}>
                <ListItem style={index === currIndex ? {
                    backgroundColor: 'darkgrey',
                    height: 40
                } : { height: 40 }}
                    className="toSelect"
                    secondaryAction={
                        <IconButton aria-label="comment" onClick={() => {handleOpen(); setDocToDelete(item); console.log(open)}}>
                            <DeleteIcon />
                        </IconButton>}>
                    <ListItemText primary={item[1]} onClick={unsavedChanges? () => openSaveDialog() : () => selectDocument(item[0])} />
                </ListItem>


                <Dialog open={saveOpen} onClose={() => closeSaveDialog()}>
                    <DialogTitle sx={{color: 'red'}}>Unsaved changes!</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Please save or discard your changes before you switch to another document.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" sx={{marginRight: '70%'}} onClick={() => {saveChanges(); closeSaveDialog(item[0])}}>save</Button>
                        <Button variant="outlined" color="error" onClick={() => {clearChanges(); closeSaveDialog(item[0])}}>discard</Button>
                    </DialogActions>
                </Dialog>
                <Divider />

                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle sx={{color: 'red'}}>Delete document: {docToDelete? docToDelete[1] : ''}?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Do you really want to delete this document?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained" color="error" sx={{marginRight: '50%'}} onClick={() => clearButton()}>delete</Button>
                        <Button onClick={handleClose}>Cancel</Button>
                    </DialogActions>
                </Dialog>
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
