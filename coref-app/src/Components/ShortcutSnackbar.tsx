import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MainPage from "./MainPage";
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import {useParams} from "react-router-dom";
import axios from "axios";
import NotFound from "./NotFound";
import {CircularProgress} from "@mui/material";


export interface SnackbarMessage {
    message: string;
    key: number;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export interface State {
    open: boolean;
    snackPack: readonly SnackbarMessage[];
    messageInfo?: SnackbarMessage;
}

export default function ConsecutiveSnackbars() {
    const [snackPack, setSnackPack] = React.useState<readonly SnackbarMessage[]>([]);
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState("bottom" as ("bottom" | "top") );
    const [isAlert, setAlert] = React.useState(false);
    const [severity, setSeverity] = React.useState("info" as ("success" | "info" | "warning" | "error"));
    const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(
        undefined,
    );
    const [render, setRender] = React.useState(
        <CircularProgress style={{marginLeft: '50%', marginTop: '20%'}}/>
    );
    const {projectname} = useParams();

    async function projectExists(pname: string){
        try {
            const {data} = await axios.get(
                `http://127.0.0.1:5000/project`,
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    },
                    params: {_id: 1, name: 1}
                },
            );
            if (data.status === 200) {
                let result = data.result
                let idNamePairs: [string, string][] = []
                for (let i = 0; i < result.length; i++) {
                    let reducedProject = result[i]
                    let pair: [string, string] = [reducedProject._id, reducedProject.name]
                    idNamePairs.push(pair)
                }
                const x = idNamePairs.find(element => element[1] === pname);
                x? setRender(<MainPage callSnackbar={callSnackbar}/>): setRender(<NotFound/>);
            }
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

    React.useEffect(() => {
        projectname? projectExists(projectname):setRender(<NotFound/>);
        if (snackPack.length && !messageInfo) {
            // Set a new snack when we don't have an active one
            setMessageInfo({ ...snackPack[0] });
            setSnackPack((prev) => prev.slice(1));
            setOpen(true);
        } else if (snackPack.length && messageInfo && open) {
            // Close an active snack when a new one is added
            setOpen(false);
        }
    }, [snackPack, messageInfo, open]);

    const callSnackbar =  function(message: string, position: "bottom" | "top", type: string) {
        setAlert(false);

        if (type != "normal"){
            setAlert(true);
            setSeverity(type as ("success" | "info" | "warning" | "error"));
        }

        setPosition(position);
        setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
    };

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleExited = () => {
        setMessageInfo(undefined);
    };

    if(isAlert) {
        return (
            <div>
                {render}
                <Snackbar
                    key={messageInfo ? messageInfo.key : undefined}
                    open={open}
                    autoHideDuration={6000}
                    onClose={handleClose}
                    TransitionProps={{onExited: handleExited}}
                    anchorOrigin={{horizontal: 'center', vertical: position}}
                    action={
                        <React.Fragment>
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                sx={{p: 0.5}}
                                onClick={handleClose}
                            >
                                <CloseIcon/>
                            </IconButton>
                        </React.Fragment>
                    }>
                    <Alert
                        onClose={handleClose}
                        severity={severity}
                        variant="filled"
                        sx={{width: '100%'}}>
                        {messageInfo ? messageInfo.message : undefined}

                    </Alert>
                </Snackbar>
            </div>
        );
    }
    return (
        <div>
            {render}
            <Snackbar
                key={messageInfo ? messageInfo.key : undefined}
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                TransitionProps={{ onExited: handleExited }}
                anchorOrigin={{horizontal: 'center', vertical: position}}
                message={messageInfo ? messageInfo.message : undefined}
                action={
                    <React.Fragment>
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            sx={{ p: 0.5 }}
                            onClick={handleClose}
                        >
                            <CloseIcon />
                        </IconButton>
                    </React.Fragment>
                }
            />
        </div>
    );
}
