import React, { useState } from 'react';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';


const Highlighted = ({ text = "a", highlight = "a" }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
        <span>
            {parts.filter(String).map((part, i) => {
                return regex.test(part) ? (
                    <mark key={i}>{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                );
            })}
        </span>
    );
};

interface TablewordsProps {
    rows: any
    inputText: any
}

const TableWords: React.FC<TablewordsProps> = ({ rows, inputText }) => {
    console.log(rows)
    console.log(inputText)
    if (rows.length) {
        return (
            <TableContainer component={Paper} style={{ maxHeight: 650 }}>
                <Table sx={{ minWidth: 100 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Num</TableCell>
                            <TableCell align="right">Words</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody> {
                        rows.map((row: { num: string | number; str: string; },
                            index: React.Key | null | undefined) => (
                            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">{row.num}</TableCell>
                                <TableCell align="right"><Highlighted text={row.str} highlight={inputText} />
                                </TableCell>
                            </TableRow>
                        ))
                    }
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
    else {
        return (<div></div>);
    }
}

export default TableWords;