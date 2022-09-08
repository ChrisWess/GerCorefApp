import React, { useState } from 'react';
import axios from 'axios';
import TextField from "@mui/material/TextField";
import TableWords from "./TableWords";


interface SearchProps {
  documentId: any
};

type MyState = { prevText: string, inputText: string };

const Search: React.FC<SearchProps> = ({ documentId }) => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [inputText, setInputText] = React.useState<string>("");
  const [prevText, setPrevText] = React.useState<string>("");

  const createData = (num: any, str: any) => {
    return { num, str };
  }

  const inputHandlerEnter = async (event: any) => {
    console.log(event)
    if (event.charCode === 13) {
      console.log(inputText);
      try {
        const { data } = await axios.post(
          `http://127.0.0.1:5000/findSentences`,
          { "input": inputText, "id": documentId },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );
        let new_rows = [];
        console.log(data);
        for (var key in data) {
          for (const i in data[key]) {
            new_rows.push(createData(key, data[key][i]));
          }
        }
        setPrevText(inputText);
        setRows(new_rows);
      } catch (error) {
        setRows([]);
        if (axios.isAxiosError(error)) {
          console.log('error message: ', error.message);
          return error.message;
        } else {
          console.log('unexpected error: ', error);
          return 'An unexpected error occurred';
        }
      }
    }
    console.log(rows);
    console.log(prevText);
  };

  const inputHandler = (event: any) => {
    var lowerCase = event.target.value.toLowerCase();
    setInputText(lowerCase);
    console.log(inputText);
  };

  return (
    <div className="main">
      <TextField
        value={inputText}
        id="outlined-basic"
        variant="outlined"
        fullWidth
        label="Search"
        onChange={inputHandler}
        onKeyPress={inputHandlerEnter} />
      <TableWords rows={rows} inputText={prevText} />
    </div>
  );
}

export default Search;

