import React, {useState} from 'react';
import { useTheme } from '@mui/material/styles';
import {Button, TextField} from "@mui/material";
import axios from 'axios';

export default function Text(props: any) {
    const theme = useTheme();
    const [text, setText] = useState("")
    const [clust, setClust] = useState([[]])

    async function submitText(input: string) {
        try{
            const { data } = await axios.post(
                `http://127.0.0.1:5000/model`,
                { "text":input },
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );
            console.log(JSON.stringify(data, null, 4));
            props.sendCorefClusterToParent(data.clusters)
            props.sendCorefTextToParent(data.tokens)
            props.changeChosenDocument(null);
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
