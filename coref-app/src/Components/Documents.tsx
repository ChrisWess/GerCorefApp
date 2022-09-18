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
    allCorefs: MutableRefObject<Mention[][]>
    sendConfidencesToParent: Function
    onDownloadDocument: Function
    documentId: string | undefined
    changeDocumentId: any
    documentsInfo: [string, string][] | undefined
    setDocumentsInfo: Function
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
    allCorefs,
    sendConfidencesToParent,
    onDownloadDocument,
    documentId,
    changeDocumentId,
    documentsInfo,
    setDocumentsInfo }) => {

    const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
    const [fileNames, setFileNames] = React.useState<Set<string> | undefined>(
        documentsInfo === undefined ? undefined : new Set(documentsInfo?.map((item) => item[1])));
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
        if (selectedFile !== null && documentsInfo !== undefined) {
            let fileName = selectedFile.name
            if (fileNames !== undefined && fileNames.has(fileName)) {
                // TODO: show prompt that file with that name exists in docs =>
                //  user options: 1) add file (with number in name), 2) overwrite, 3) cancel
                let arr = fileName.split(".");
                let suffix = arr.pop();
                let prefix = arr.join('.');
                let sameNames = [];
                for (let i = 0; i < documentsInfo.length; i++) {
                    let fName = documentsInfo[i][1]
                    if (fName.startsWith(prefix) && fName.endsWith('.' + suffix)) {
                        sameNames.push(fName);
                    }
                }
                let number = 1;
                let newName = `${prefix}-${number}.${suffix}`
                while (sameNames.includes(newName)) {
                    ++number;
                    newName = `${prefix}-${number}.${suffix}`
                }
                fileName = newName
            }

            let formData = new FormData();
            formData.append('myFile', selectedFile);
            // TODO: default to file name from file system, but create textfield for renaming documents
            formData.append('docname', fileName);
            formData.append('projectid', "TEMP");  // TODO: ignored for now

            try {
                const { data } = await axios.post(
                    `http://127.0.0.1:5000/uploadfile`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'multipart/form-data',
                        },
                    },
                );
                if (data.status === 201) {
                    let result = data.result
                    console.log(result._id)
                    console.log(result.tokens);
                    if (fileNames === undefined) {
                        setFileNames(new Set<string>([fileName]))
                    } else {
                        fileNames.add(fileName)
                        setFileNames(fileNames)
                    }
                    let insertIndex = documentsInfo.length
                    for (let i = 0; i < insertIndex; i++) {
                        let a = documentsInfo[i][1]
                        if (fileName < a) {
                            insertIndex = 0
                            break
                        }
                    }
                    documentsInfo.splice(insertIndex, 0, [result._id, fileName])
                    setDocumentsInfo(documentsInfo)

                    sendCorefClusterToParent(result.clust)
                    sendCorefTextToParent(result.tokens)
                    allCorefs.current = []
                    sendConfidencesToParent(result.probs)
                    changeDocumentId(result._id);
                }  // TODO: handle unauthorized and other errors (make button not clickable when not logged in?)
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
                sendCorefClusterToParent={sendCorefClusterToParent}
                sendCorefTextToParent={sendCorefTextToParent}
                allCorefs={allCorefs}
                sendConfidencesToParent={sendConfidencesToParent}
                documentId={documentId}
                changeDocumentId={changeDocumentId}
                documentsInfo={documentsInfo} />
            <ButtonTextfield tfLabel="New Document Name" buttonText="Rename" submitFunc={renameDoc} />
            <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                Share selected document</Button>
            <span className="dropdown">
                <Button disabled={!documentId} variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }}
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
