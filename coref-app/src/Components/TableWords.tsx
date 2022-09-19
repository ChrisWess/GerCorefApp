import React, { useState } from 'react';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import "./TableWords.css";


function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const Highlighted = ({ text = "a", highlight = "a" }) => {
    highlight = escapeRegExp(highlight);
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
    rows: any[]
    inputText: any
    txt: any
    changePage: any
}

const TableWords: React.FC<TablewordsProps> = ({ rows, inputText, txt, changePage }) => {
    const createData = (num: any, str: any) => {
        return { num, str };
    }

    const handleClick = (index: any) => {
        changePage(rows[index].num, rows[index].words);
    };

    if (rows.length) {
        let result = []
        for (let i = 0; i < rows.length; i++) {
            let start = rows[i].words[0], end = rows[i].words[1];
            let text = txt[rows[i].num - 1][start];
            for (let j = start + 1; j <= end; j++) {
                if (!!txt[rows[i].num - 1][j].match(/^[.,:!?]/)) {
                    text += txt[rows[i].num - 1][j];
                }
                else {
                    text += " ";
                    text += txt[rows[i].num - 1][j];
                }
            }
            result.push(createData(rows[i].num, text))
        }

        return (
            <TableContainer component={Paper} style={{ maxHeight: 630 }}>
                <Table sx={{ minWidth: 100 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Num</TableCell>
                            <TableCell align="right">Words</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody> {
                        result.map((res: { num: string | number; str: string; },
                            index: React.Key | null | undefined) => (
                            <TableRow key={index} 
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }} 
                                        onClick={() => handleClick(index)} 
                                        className="foundWords">
                                <TableCell component="th" scope="row">{res.num}</TableCell>
                                <TableCell align="right"><Highlighted text={res.str} highlight={inputText} />
                                </TableCell>
                            </TableRow>
                        ))
                    }
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
    return (<div></div>);
}

export default TableWords;