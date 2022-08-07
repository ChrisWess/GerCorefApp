import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MainPage from "./MainPage";
import MuiAlert, { AlertProps } from '@mui/material/Alert';

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

    React.useEffect(() => {
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
                <MainPage
                    callSnackbar={callSnackbar}
                />
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
            <MainPage
                callSnackbar={callSnackbar}
            />
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
