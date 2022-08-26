import React, {MutableRefObject} from 'react';
import axios from 'axios';
import { Button } from "@mui/material";
import Table from "./TableDocuments";
import {Mention} from "./MainView";
import "./Documents.css"
import "./FileConverter"
import FileConverter from "./FileConverter";


interface MyProps {
    sendCorefClusterToParent: any
    sendCorefTextToParent: any,
    changeChosenDocument: any,
    chosenDocument: any
    allCorefs: MutableRefObject<Mention[][]>
    sendConfidencesToParent: Function
    children: any
    onDownloadDocument: Function
};
type MyState = { selectedFile: any, nameWasChanged: boolean, newName: string };

type dict = {
    [key: string]: any
};

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
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

class Documents extends React.Component<MyProps, MyState>{

    static allData: dict = new Object();
    static supportedDataTypes = ["XML", "CoNLL-2012", "plaintext"];

    constructor(props: any) {
        super(props);
        this.state = { selectedFile: null, nameWasChanged: false, newName: "" };
    };


    // On file download (click the download button)
    onFileDownload = (event: any) => {
        document.getElementById("documentsDropDown")!.classList.toggle("show");
    };


    // On file select (from the pop up)
    onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Update the state
        let y = (event?.target as HTMLInputElement).files;
        let file = null;
        if (y != null) {
            file = y[0];
        }
        this.setState({ selectedFile: file });
    };

    // On file upload (click the upload button)
    onFileUpload = async (event: any) => {
        // TODO: store files on backend 
        // TODO: store jsons, not recompute them every time

        if (this.state.selectedFile !== null) {
            const name = this.state.selectedFile.name;
            if (name in Documents.allData) {
                let arr = name.split(".");
                const last = arr.pop();
                const first = arr.join('.');
                let sameNames = [];
                for (const [key, value] of Object.entries(Documents.allData)) {
                    if (key.startsWith(first) && key.endsWith('.' + last)) {
                        sameNames.push(key);
                    }
                }
                let number = 1;
                while (sameNames.includes(first + '-' + number + '.' + last)) {
                    ++number;
                }
                const finalName = first + '-' + number + '.' + last;
                Documents.allData[finalName] = this.state.selectedFile;
                this.setState({ nameWasChanged: true });
                this.setState({ newName: finalName });
            } else {
                Documents.allData[name] = this.state.selectedFile;
                this.setState({ nameWasChanged: false });
            }


            let formData = new FormData();
            formData.append(
                'myFile',
                this.state.selectedFile !== null ? this.state.selectedFile : "",
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
                this.props.sendCorefClusterToParent(data.clust)
                this.props.sendCorefTextToParent(data.tokens)
                if (!this.state.nameWasChanged) {
                    this.props.changeChosenDocument(this.state.selectedFile['name']);
                } else {
                    this.props.changeChosenDocument(this.state.newName);
                }
                this.props.allCorefs.current = []
                this.props.sendConfidencesToParent(data.probs)
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
            this.setState({ selectedFile: null });
        }
        if (document !== null && document.getElementById('file') !== null) {
            (document.getElementById('file') as HTMLInputElement).value = '';
        }
    };
    
    render() {
        return (
            <div>
                <input type="file" id="file" onChange={this.onFileChange} accept=".txt" />
                <Button variant="outlined" style={{ margin: 1, textTransform: "none", width: "97%" }}
                    onClick={this.onFileUpload} type="submit" disabled={!this.state.selectedFile}> Upload </Button>
                <Table
                    tableData={Documents.allData}
                    sendCorefClusterToParent={this.props.sendCorefClusterToParent}
                    sendCorefTextToParent={this.props.sendCorefTextToParent}
                    changeChosenDocument={this.props.changeChosenDocument}
                    chosenDocument={this.props.chosenDocument}
                    allCorefs={this.props.allCorefs}
                    sendConfidencesToParent={this.props.sendConfidencesToParent}
                >
                </Table>
                <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                    Share selected document</Button>
                <span className="dropdown">
                    <Button disabled={!this.props.chosenDocument} variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} onClick={this.onFileDownload} className="dropbtn">
                        Download annotated document</Button>
                    <div id="documentsDropDown" className="dropdown-content">
                        {Documents.supportedDataTypes.map((dataTypes, index) =>
                            (<a key={"DT-"+index+1} onClick={() => this.props.onDownloadDocument(dataTypes, "TestName")}>{Documents.supportedDataTypes[index]}</a>))}
                    </div>
                </span>
                <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                    Submit annotation <br />(Submit for online learning)</Button>
            </div>
        );
    }
}

export default Documents;
