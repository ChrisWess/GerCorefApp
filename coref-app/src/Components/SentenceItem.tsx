import React, {useState} from 'react';
import { useTheme } from '@mui/material/styles';

export default function SentenceItem(props:any) {
    const theme = useTheme();

    return (
        <>
            <p>{props.text}</p>
        </>
    );
}
