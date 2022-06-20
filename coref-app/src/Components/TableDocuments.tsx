import { AnyNsRecord } from 'dns';
import React, { useState } from 'react';
import Documents from "./Documents";
import axios from 'axios';
import './Table.css';
import ReactDOM from 'react-dom';


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

    if (Object.keys(props.tableData).length != 0) {
        let arr = Array.from(Object.keys(props.tableData));
        class TableComponent extends React.Component{
            render() {
              // Data
              var dataColumns = ['Index', 'File'];          
              var tableHeaders = (<thead>
                    <tr>
                      {dataColumns.map(function(column) {
                        return <th>{column}</th>; })}
                    </tr>
                </thead>);
          
              var tableBody = arr.map((el: any, index)=>{
                return(
                    <tr key={index}>
                        <td>{index+1}</td>
                        <td onClick = {() =>handleClick(el)}>{el}</td>
                    </tr>
                )
            })
            return (<table className="table table-bordered table-hover" width="100%">
                    {tableHeaders}
                    {tableBody}
                </table>) }};

        return(
            <TableComponent/>
        )
    }
    else {
        return(
            <table className="table">
            </table>
        )
    }
}
export default Table;