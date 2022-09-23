import React, { useState } from 'react';
import axios from 'axios';
import TextField from "@mui/material/TextField";
import TableWords from "./TableWords";
import { IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';



interface SearchProps {
  currDocInfo: string[]
  txt: any
  changePage: any
  setSentenceToHighlight: any
  setWordsToHighlight: any
  setPrevText: any
  prevText: any
  children: any
}

const Search: React.FC<SearchProps> = ({ currDocInfo, txt, changePage, setSentenceToHighlight,
                                          setWordsToHighlight, setPrevText, prevText }) => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [inputText, setInputText] = React.useState<string>("");

  const createData = (num: any, words: any) => {
    return { num, words };
  }

  const inputHandlerEnter = async (event: any) => {
    if (event.charCode === 13) {
      try {
        const { data } = await axios.post(
          `http://127.0.0.1:5000/findSentences`,
          { "input": inputText, "id": currDocInfo[0] },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );
        let new_rows = [];
        for (const j in data) {
          for (const i in data[j]) {
            new_rows.push(createData(Number(j), data[j][i]));
          }
        }
        setPrevText(inputText);
        setRows(new_rows);
        setWordsToHighlight(new_rows);
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

  };

  const inputHandler = (event: any) => {
    var lowerCase = event.target.value.toLowerCase();
    setInputText(lowerCase);
    setPrevText('');
    setRows([]);
    setSentenceToHighlight(0);
    setWordsToHighlight([]);
  };

  const clearButton = () => {
    setInputText('');
    setPrevText('');
    setRows([]);
    setSentenceToHighlight(0);
    setWordsToHighlight([]);
  }

  return (
    <div className="main">
      <TextField
        value={inputText}
        id="outlined-basic"
        variant="outlined"
        fullWidth
        label="Search"
        onChange={inputHandler}
        onKeyPress={inputHandlerEnter}
        InputProps={{
          endAdornment: (
            <IconButton sx={{ visibility: inputText ? "visible" : "hidden" }} onClick={clearButton}>
              <ClearIcon />
            </IconButton>
          ),
        }} />
      <TableWords rows={rows} inputText={prevText} txt={txt} changePage={changePage} />
    </div>
  );
};


export default Search;

