import React, {useState, Component} from 'react';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import {Button, Box, FormControlLabel, Checkbox} from "@mui/material";
 

interface MyProps { sendCorefClusterToParent: any 
                    sendCorefTextToParent: any, 
					children: any};
type MyState = { selectedFile: any };


class Documents extends React.Component <MyProps, MyState>{

	constructor(props: any) {
		super(props);
		this.state = {selectedFile: null};
	};
	
	// On file select (from the pop up)
	onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Update the state
        let y = (event?.target as HTMLInputElement).files;
        let file = null;
        if (y != null) {
            file = y[0];
        }
        this.setState({ selectedFile: file});
	};
	
	// On file upload (click the upload button)
	onFileUpload = async () => {
        // Create an object of formData
        const formData = new FormData();
        
        // Update the formData object
        formData.append(
            "myFile",
            this.state.selectedFile !== null? this.state.selectedFile: "",
			"file123",
        );
        
        // Details of the uploaded file
        console.log(this.state.selectedFile);
        console.log(formData);
		try{
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
            console.log(JSON.stringify(data, null, 4));
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
	};

	// File content to be displayed after
	// file upload is complete
	fileData = () => {
	
	if (this.state.selectedFile) {
		return (
		<div>
			<h2>File Details:</h2>
            <p>File Name: {this.state.selectedFile['name']}</p>
            <p>File Type: {this.state.selectedFile['type']}</p>
		</div>
		);
	} else {
		return (
		<div>
			<br />
			<h4>Choose before pressing the Upload button</h4>
		</div>
		);
	}
	};
	
	render() {
	
	return (
		<div>
			<div>
                <input type="file" onChange={this.onFileChange} accept=".txt"/>
                <Button variant="outlined" style={{margin: 1, textTransform: "none"}} onClick={this.onFileUpload}>Upload</Button>
            </div>
          {this.fileData()}
		</div>
	);
	}
}

export default Documents;