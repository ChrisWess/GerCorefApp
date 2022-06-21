import React from 'react';
import axios from 'axios';
import { Button } from "@mui/material";
import Table from "./TableDocuments";


interface MyProps {
    sendCorefClusterToParent: any
    sendCorefTextToParent: any,
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
    onFileUpload = async () => {
        // TODO: clever handle files with same names
        // TODO: store files on backend 
        // TODO: store jsons, not recompute them every time

        if (this.state.selectedFile !== null) {
            const name = this.state.selectedFile.name;
            if (name in Documents.allData) {
                let arr = name.split(".");
                //const last = arr.at(-1);
                const last = arr.pop();
                const first = arr.join('.');
                const randomName = Math.floor(Math.random() * 10000);
                const finalName = first + '-' + randomName + '.' + last;
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
                );/*.then((response) => {
                    console.log(response);
                }, (error) => {
                    console.log(error);
                });*/
                this.props.sendCorefClusterToParent(data.clusters)
                this.props.sendCorefTextToParent(data.tokens)
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    console.log('error message: ', error.message);
                    // 👇️ error: AxiosError<any, any>
                    return error.message;
                } else {
                    console.log('unexpected error: ', error);
                    return 'An unexpected error occurred';
                }
            }
        }
    };

    // File content to be displayed after
    // file upload is complete
    fileData = () => {

        if (this.state.selectedFile) {
            if (!this.state.nameWasChanged) {
                return (
                    <div>
                        <h4>Selected file details:</h4>
                        <p>File Name: {this.state.selectedFile['name']}</p>
                        <p>File Type: {this.state.selectedFile['type']}</p>
                    </div>
                );
            } else {
                return (
                    <div>
                        <h4>There is a file with the same name. A name was changed. Selected file details:</h4>
                        <p>File Name: {this.state.newName}</p>
                        <p>File Type: {this.state.selectedFile['type']}</p>
                    </div>
                );
            }
        } else {
            return (
                <div>
                    <br />
                    <h4>Please, choose .txt file before pressing the upload button!</h4>
                </div>
            );
        }
    };

    render() {
        return (
            <div>
                <div>
                    <input type="file" onChange={this.onFileChange} accept=".txt" />
                    <Button variant="outlined" style={{ margin: 1, textTransform: "none" }} onClick={this.onFileUpload}>Upload</Button>
                    <Table
                        tableData={Documents.allData}
                        sendCorefClusterToParent={this.props.sendCorefClusterToParent}
                        sendCorefTextToParent={this.props.sendCorefTextToParent}
                    >
                    </Table>
                </div>
                {this.fileData()}
            </div>
        );
    }
}

export default Documents;