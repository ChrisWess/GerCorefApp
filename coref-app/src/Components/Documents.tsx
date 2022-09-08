import React, { MutableRefObject } from 'react';
import axios from 'axios';
import { Button } from "@mui/material";
import TableDocuments from "./TableDocuments";
import { Mention } from "./MainView";
import "./Documents.css"
import "./FileConverter"
import FileConverter from "./FileConverter";
import ButtonTextfield from "./ButtonTextfield";


interface DocumentsProps {
    sendCorefClusterToParent: any
    sendCorefTextToParent: any,
    changeChosenDocument: any,
    chosenDocument: any
    allCorefs: MutableRefObject<Mention[][]>
    sendConfidencesToParent: Function
    onDownloadDocument: Function
    changeDocumentId: any
    children: React.ReactNode;
}

type dict = {
    [key: string]: any
};

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
    // @ts-ignore
    if (!event.target!.matches('.dropbtn')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}


const Documents: React.FC<DocumentsProps> = ({ sendCorefClusterToParent,
    sendCorefTextToParent,
    changeChosenDocument,
    chosenDocument,
    allCorefs,
    sendConfidencesToParent,
    onDownloadDocument,
    changeDocumentId, children }) => {

    const [allData] = React.useState<dict>(new Object());
    const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
    const [nameWasChanged, setNameWasChanged] = React.useState<boolean>(false);
    const [newName, setNewName] = React.useState<string>("");
    const supportedDataTypes = ["XML", "CoNLL-2012", "plaintext"];

    // On file download (click the download button)
    const onFileDownload = (event: any) => {
        document.getElementById("documentsDropDown")!.classList.toggle("show");
    };


    // On file select (from the pop up)
    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Update the state
        let y = (event?.target as HTMLInputElement).files;
        let file = null;
        if (y != null) {
            file = y[0];
        }
        setSelectedFile(file);
    };

    // On file upload (click the upload button)
    const onFileUpload = async (event: any) => {
        // TODO: store files on backend 
        // TODO: store jsons, not recompute them every time

        if (selectedFile !== null) {
            const name = selectedFile.name;
            if (name in allData) {
                let arr = name.split(".");
                const last = arr.pop();
                const first = arr.join('.');
                let sameNames = [];
                for (const [key, value] of Object.entries(allData)) {
                    if (key.startsWith(first) && key.endsWith('.' + last)) {
                        sameNames.push(key);
                    }
                }
                let number = 1;
                while (sameNames.includes(first + '-' + number + '.' + last)) {
                    ++number;
                }
                const finalName = first + '-' + number + '.' + last;
                allData[finalName] = selectedFile;
                setNameWasChanged(true);
                setNewName(finalName);
            } else {
                allData[name] = selectedFile;
                setNameWasChanged(false);
            }


            let formData = new FormData();
            formData.append(
                'myFile',
                selectedFile !== null ? selectedFile : "",
            );
            // TODO: default to file name from file system, but create textfield for renaming documents
            formData.append('docname', name);

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
                console.log(data._id)
                console.log(data.tokens);
                sendCorefClusterToParent(data.clust)
                sendCorefTextToParent(data.tokens)
                if (!nameWasChanged) {
                    changeChosenDocument(selectedFile['name']);
                } else {
                    changeChosenDocument(newName);
                }
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
            setSelectedFile(null);
        }
        if (document !== null && document.getElementById('file') !== null) {
            (document.getElementById('file') as HTMLInputElement).value = '';
        }
    };

    const renameDoc = (inpt: string) => {
        console.log(inpt)
    }

    return (
        <div>
            <input type="file" id="file" onChange={onFileChange} accept=".txt" />
            <Button variant="outlined" style={{ margin: 1, textTransform: "none", width: "97%" }}
                onClick={onFileUpload} type="submit" disabled={!selectedFile}> Upload </Button>
            <TableDocuments
                tableData={allData}
                sendCorefClusterToParent={sendCorefClusterToParent}
                sendCorefTextToParent={sendCorefTextToParent}
                changeChosenDocument={changeChosenDocument}
                chosenDocument={chosenDocument}
                allCorefs={allCorefs}
                sendConfidencesToParent={sendConfidencesToParent}
                changeDocumentId={changeDocumentId}
            >
            </TableDocuments>
            <ButtonTextfield tfLabel="New Document Name" buttonText="Rename" submitFunc={renameDoc} />
            <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                Share selected document</Button>
            <span className="dropdown">
                <Button disabled={!chosenDocument} variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }}
                    onClick={onFileDownload} className="dropbtn">
                    Download annotated document</Button>
                <div id="documentsDropDown" className="dropdown-content">
                    {supportedDataTypes.map((dataTypes, index) =>
                    (<a key={"DT-" + index + 1} onClick={() => onDownloadDocument(dataTypes, "TestName")}>
                        {supportedDataTypes[index]}</a>))}
                </div>
            </span>
            <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                Submit annotation <br />(Submit for online learning)</Button>
        </div>
    );
}

export default Documents;
