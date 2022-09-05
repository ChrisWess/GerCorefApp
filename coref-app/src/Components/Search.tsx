import React, { useState } from 'react';
import axios from 'axios';
import TextField from "@mui/material/TextField";
import TableWords from "./TableWords";


interface MyProps {
  documentId: any
};

type MyState = { prevText: string, inputText: string};

class Search extends React.Component<MyProps, MyState>{
  static res: any;
  static rows: any[] = [];

  constructor(props: any) {
    super(props);
    this.state = { prevText: "", inputText: "" };
  };

  createData = (num: any, str: any) => {
    return { num, str };
  }

  inputHandlerEnter = async (event: any) => {
    console.log(event)
    if (event.charCode === 13) {
      console.log(this.state.inputText);
      Search.rows = [];
      //let formData = new FormData();
      //formData.append('input', this.state.inputText);
      //formData.append('text', this.props.documentId);
      try {
        const { data } = await axios.post(
          `http://127.0.0.1:5000/findSentences`,
          { "input": this.state.inputText, "id": this.props.documentId },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );
        Search.res = data;
        console.log(Search.res);
        for (var key in Search.res) {
          for (const i in Search.res[key]) {
            Search.rows.push(this.createData(key, Search.res[key][i]));
          }
        }
        this.setState({prevText: this.state.inputText})
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log('error message: ', error.message);
          return error.message;
        } else {
          console.log('unexpected error: ', error);
          return 'An unexpected error occurred';
        }
      }
    }
    console.log(Search.rows);
  };

  inputHandler = (event: any) => {
    var lowerCase = event.target.value.toLowerCase();
    this.setState({ inputText: lowerCase });
    console.log(this.state.inputText);
  };

  render() {
    return (
      <div className="main">
        <TextField
          value={this.state.inputText}
          id="outlined-basic"
          variant="outlined"
          fullWidth
          label="Search"
          onChange={this.inputHandler}
          onKeyPress={this.inputHandlerEnter} />
        <TableWords
          rows={Search.rows}
          inputText={this.state.prevText} />
      </div>
    );
  }
}

export default Search;

