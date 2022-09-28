import React, { MutableRefObject } from 'react';
import axios from 'axios';
import { Button } from "@mui/material";
import TableDocuments from "./TableDocuments";
import { Mention } from "./MainView";
import "./Documents.css"
import "./FileConverter"
import FileConverter from "./FileConverter";
import ButtonTextfield from "./ButtonTextfield";
import {useParams} from "react-router-dom";


interface DocumentsProps {
    sendCorefClusterToParent: any
    sendCorefTextToParent: any,
    allCorefs: MutableRefObject<Mention[][]>
    sendConfidencesToParent: Function
    sendAnnotatorsToParent: Function
    onDownloadDocument: Function
    clearCurrentMention: Function
    selectDocument: Function
    currDocInfo: string[]
    addDocumentInfo: Function
    documentsInfo: [string, string][] | undefined
    renameDocument: Function
    clearText: Function
}

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
    sendAnnotatorsToParent,
    onDownloadDocument,
    clearCurrentMention,
    selectDocument,
    currDocInfo,
    addDocumentInfo,
    documentsInfo,
    renameDocument,
    clearText }) => {

    const {projectname} = useParams();
    const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
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
            let formData = new FormData();
            formData.append('myFile', selectedFile);
            formData.append('docname', fileName);
            formData.append('projectname', projectname!);

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
                    addDocumentInfo(result._id, result.name)
                    sendAnnotatorsToParent(result.annotatedBy)
                    sendCorefClusterToParent(result.clust)
                    sendCorefTextToParent(result.tokens)
                    allCorefs.current = []
                    sendConfidencesToParent(result.probs)
                    clearCurrentMention()
                    window.history.replaceState(null, "Coref-App", "/project/"+projectname+"/doc/"+result.name)
                    // TODO: trigger pop-up if changes in current doc should be changed
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

    return (
        <div>
            <input type="file" id="file" onChange={onFileChange} accept=".txt" />
            <Button variant="outlined" style={{ margin: 1, textTransform: "none", width: "97%" }}
                onClick={onFileUpload} type="submit" disabled={!selectedFile}> Upload </Button>
            <TableDocuments
                selectDocument={selectDocument}
                currDocInfo={currDocInfo}
                documentsInfo={documentsInfo}
                clearText={clearText}/>
            <ButtonTextfield tfLabel="New Document Name" buttonText="Rename" submitFunc={renameDocument} />
            <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                Share selected document</Button>
            <span className="dropdown">
                <Button disabled={currDocInfo.length === 0} variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }}
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
