import React, {MutableRefObject, useState} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, TextField} from "@mui/material";
import axios from 'axios';

export default function Text(props: any) {
    const theme = useTheme();
    const [text, setText] = useState("")

    async function submitText(input: string) {
        try{
            const { data } = await axios.post(
                `http://127.0.0.1:5000/model`,
                { "text": input, "docname": "default_name", "projectid": "TEMP" },  // TODO: project id
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );
            if (data.status === 201) {
                let result = data.result
                console.log(JSON.stringify(result, null, 4));
                props.sendCorefClusterToParent(result.clust)
                props.sendCorefTextToParent(result.tokens)
                props.allCorefs.current = []
                props.sendConfidencesToParent(result.probs)
                // TODO: maybe automatically switch to documents tab and select the newly created document from the list
            }
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

    // TODO: use a default file name when submitting text (e.g. doc1, doc2 => increment by looking at all previously created doc names with that pattern)
    return (
        <>
            <TextField
                label={"text"}
                fullWidth
                multiline rows={26}
                variant={"outlined"}
                onChange={(e) => setText(e.target.value)}>
            </TextField>
            <Button onClick={() => submitText(text)} color={"primary"} variant={"contained"} style={{marginTop: 15}}>Submit</Button>
        </>
    );
}
