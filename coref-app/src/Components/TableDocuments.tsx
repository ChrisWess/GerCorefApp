import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import {FC, ReactNode} from "react";
import {Mention} from "./MainView";
import {clearPrevMarking} from "./MainPage";


interface TableDocumentsProps {
    sendCorefClusterToParent: any
    sendCorefTextToParent: any
    sendConfidencesToParent: any
    allCorefs: any
    documentId: string | undefined
    changeDocumentId: any
    documentsInfo: [string, string][] | undefined
}


const TableDocuments: FC<TableDocumentsProps> = ({ sendCorefClusterToParent, sendCorefTextToParent,
    sendConfidencesToParent, documentId, changeDocumentId, documentsInfo }) => {

    const createClickHandler = (docId: string) => {
        return async function handleClick() {
            try {
                const { data } = await axios.get(
                    `http://127.0.0.1:5000/doc/${docId}`,
                    {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'multipart/form-data',
                        },
                    },
                );

                sendCorefClusterToParent(data.clust)
                sendCorefTextToParent(data.tokens)
                // allCorefs.current = []
                sendConfidencesToParent(data.probs)
                changeDocumentId(data._id);
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    console.log('error message: ', error.message);
                    return error.message;
                } else {
                    console.log('unexpected error: ', error);
                    return 'An unexpected error occurred';
                }
            }
        }
    };

    // TODO: load in all document names of the user
    //   only "upload" button should trigger the model inference
    //   The list buttons should only query the corresponding document from DB
    //TODO: rewrite it more clear, without 2 lists and if
    if (documentsInfo && documentsInfo.length > 0) {
        let currIndex = -1
        for (let i = 0; i < documentsInfo.length; i++) {
            if (documentsInfo[i][0] === documentId) {
                currIndex = i
                break
            }
        }
        const tableBody = documentsInfo.map((item, index) => (
            <div key={"docSelect" + index}>
                <ListItemButton style={index === currIndex ? { backgroundColor: 'lightGray' } : {}}>
                    <ListItemText style={{ lineHeight: 1, margin: 0 }}
                                  onClick={() => createClickHandler(item[0])}> {item[1]} </ListItemText>
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