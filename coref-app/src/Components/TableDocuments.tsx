import { AnyNsRecord } from 'dns';
import React, { useState } from 'react';
import Documents from "./Documents";
import axios from 'axios';
import { useTable } from 'react-table';
import './Table.css';
import ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import { tab } from '@testing-library/user-event/dist/tab';



function Table(props:any){

    async function handleClick(el: any ) {
        let formData = new FormData();
        formData.append(
            'myFile',
            props.tableData[el],
        );

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
            );

            props.sendCorefClusterToParent(data.clusters)
            props.sendCorefTextToParent(data.tokens)
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
    };

    //TODO: rewrite it more clear, without 2 lists and if 
   if (Object.keys(props.tableData).length != 0) {
        let arr = Array.from(Object.keys(props.tableData));

        const tableBody = arr.map((el: any, index)=> (
            <div key={index}>
                <ListItemButton>
                        <ListItemText onClick={() => handleClick(el)}>{el}</ListItemText>
                </ListItemButton>
                <Divider/>
            </div>
        ));
        return (
            <List key='list' sx={{width: '100%', maxWidth: 360,
            bgcolor: 'background.paper', height: 300, overflow: 'auto' }} component="nav"
            subheader={<ListSubheader>Files</ListSubheader>}>
                <Divider/>
                {tableBody}
            </List>
        );
    }
    else {
        return(
            <List sx={{width: '100%', maxWidth: 360,
            bgcolor: 'background.paper', height: 300, overflow: 'auto' }} component="nav"
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
export default Table;