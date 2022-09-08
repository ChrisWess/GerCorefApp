import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';


interface TableDocumentsProps {
    tableData: any
    sendCorefClusterToParent: any
    sendCorefTextToParent: any
    changeChosenDocument: any
    sendConfidencesToParent: any
    allCorefs: any
    changeDocumentId: any
    chosenDocument: any
    children: React.ReactNode;
}


const TableDocuments: React.FC<TableDocumentsProps> = ({ tableData,
    sendCorefClusterToParent, sendCorefTextToParent,
    changeChosenDocument, allCorefs, sendConfidencesToParent,
    changeDocumentId, chosenDocument, children }) => {

    async function handleClick(el: any) {
        // TODO: this function should only be in the upload button, instead read the document from database and display it
        let formData = new FormData();
        formData.append(
            'myFile',
            tableData[el],
        );
        formData.append(
            'docname',
            'default_name'
        );

        try {
            const { data } = await axios.post(
                `http://127.0.0.1:5000/uploadfile`,
                formData,
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            sendCorefClusterToParent(data.clust)
            sendCorefTextToParent(data.tokens)
            changeChosenDocument(el);
            allCorefs.current = []
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

    // TODO: load in all document names of the user
    //   only "upload" button should trigger the model inference
    //   The list buttons should only query the corresponding document from DB
    //TODO: rewrite it more clear, without 2 lists and if 
    if (Object.keys(tableData).length != 0) {
        let arr = Array.from(Object.keys(tableData));
        const tableBody = arr.map((el: any, index) => (
            <div key={index}>
                <ListItemButton style={index === arr.indexOf(chosenDocument) ?
                    { backgroundColor: 'lightGray' } : {}}>
                    <ListItemText style={{ lineHeight: 1, margin: 0 }} onClick={() => handleClick(el)}> {el} </ListItemText>
                </ListItemButton>
                <Divider />
            </div>
        ));
        return (
            <List key='list' sx={{
                width: '100%', maxWidth: 360,
                bgcolor: 'background.paper', height: 300, overflow: 'auto'
            }} component="nav"
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