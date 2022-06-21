import React from 'react';
import axios from 'axios';
import { Button } from "@mui/material";
import Table from "./TableDocuments";


interface MyProps {
    sendCorefClusterToParent: any
    sendCorefTextToParent: any,
    changeChosenDocument: any,
    chosenDocument: any
    children: any
};
type MyState = { selectedFile: any, nameWasChanged: boolean, newName: string };

type dict = {
    [key: string]: any
};

class Documents extends React.Component<MyProps, MyState>{

    static allData: dict = new Object();

    constructor(props: any) {
        super(props);
        this.state = { selectedFile: null, nameWasChanged: false, newName: "" };
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
                this.props.sendCorefClusterToParent(data.clusters)
                this.props.sendCorefTextToParent(data.tokens)
                if (!this.state.nameWasChanged) {
                    this.props.changeChosenDocument(this.state.selectedFile['name']);
                } else {
                    this.props.changeChosenDocument(this.state.newName);
                }
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
                >
                </Table>
                <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                    Share selected document</Button>
                <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                    Download annotated document</Button>
                <Button variant="outlined" style={{ margin: 5, textTransform: "none", width: "97%" }} disabled>
                    Submit annotation <br />(Submit for online learning)</Button>
            </div>
        );
    }
}

export default Documents;