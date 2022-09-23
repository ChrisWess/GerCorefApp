import React, {MutableRefObject} from 'react';
import {ThemeProvider, useTheme} from '@mui/material/styles';
import {
    Button,
    Box,
    FormControlLabel,
    Switch,
    List,
    ListItem,
    ListItemIcon,
    Divider,
    Dialog,
    DialogTitle, DialogContent, DialogContentText, DialogActions, TextField
} from "@mui/material";
import ResponsiveAppBar from "./ResponsiveAppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import axios from "axios";
import ButtonTextfield from "./ButtonTextfield";
interface DashboardProps {

}

function startProject() {
    console.log("start project")
    return undefined
}

function openProject(project: string) {
    console.log("opens project: "+project)
    window.location.href = 'http://localhost:3000/project/'+project;
    return undefined
}


const UserDashboard: React.FC<DashboardProps> = ({}) => {
    const [projectIdNamePairs, setProjectIdNamePairs] = React.useState<[string, string][] | undefined>();
    const [projectname, setProjectname] = React.useState('');
    const [error, setError] = React.useState(false);
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setProjectname('');
        setError(false);
        setOpen(false);
    };

    function handleChange(event: any) {
        setProjectname(event.target.value);
    };

    async function handleClick(event: any){
        event.preventDefault();
        if(projectname === '' || projectname.trim() === '')
        {
            setError(true)
            return
        }
        console.log('handleClick 👉️', projectname);

        try {
            const { data } = await axios.post(
                `http://127.0.0.1:5000/project`,
                {projectname: projectname },
                {
                    withCredentials: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );
            if (data.status === 201) {
                let result = data.result
            }
            handleClose();
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('error message: ', error.message);
                handleClose();
                return error.message;
            } else {
                console.log('unexpected error: ', error);
                handleClose();
                return 'An unexpected error occurred';
            }
        }
    };


    let projectList = [
        <React.Fragment key={0}>
            <ListItem divider key={"0.1"}>
                <div key={"0.3"}>no projects</div>
                <Divider key={"0.4"}/>
            </ListItem>
        </React.Fragment>]

    async function loadProjects() {
        // load in the list of projects belonging to the current user and set the projectList
        if (projectIdNamePairs === undefined) {
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
                    idNamePairs.sort((a, b) => a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : 0)
                    setProjectIdNamePairs(idNamePairs)
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
    }

    if(projectIdNamePairs) {
        projectList = projectIdNamePairs.map((d, index) =>
            <React.Fragment key={index} >
                <ListItem divider key={index + ".1"} onClick={() => openProject(d[1])} >
                    <ListItemIcon key={index + ".2"}>
                        {index + 1}
                    </ListItemIcon>
                    <div key={index + ".3"}>{d[1]}</div>
                    <Divider key={index + ".4"}/>
                </ListItem>
            </React.Fragment>
        );
    }

    React.useEffect(() => {
        loadProjects();
    });


    return (
        <ThemeProvider theme={theme}>
            <ResponsiveAppBar></ResponsiveAppBar>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'light'
                                ? theme.palette.grey[100]
                                : theme.palette.grey[900],
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                    }}
                >
                    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, marginTop: "100pt"}}>


                        <Grid container spacing={3} rowSpacing={3} sx={{marginLeft: "20%", width: "30%", float: "left"}}>
                            <Grid item xs={12} md={12} lg={12}>
                                <Paper
                                    elevation={6}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 465,
                                        overflow: 'auto'
                                    }}>
                                    <List className="pagination" key={"mainList"}>
                                        {projectList}
                                    </List>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={12} lg={12}>
                                <Button variant={"contained"} style={{backgroundColor:"primary" , margin: 1, textTransform: "none", width: "97%" }}
                                        onClick={handleClickOpen} type="submit"> new project </Button>
                                <Dialog open={open} onClose={handleClose}>
                                        <DialogTitle>new Project</DialogTitle>
                                        <DialogContent>
                                            <DialogContentText>
                                                Please type in the name of the new project!
                                            </DialogContentText>
                                                    <TextField
                                                        error={error}
                                                        onChange={handleChange}
                                                        autoFocus
                                                        margin="dense"
                                                        id="name"
                                                        label="Project Name"
                                                        type="text"
                                                        fullWidth
                                                        required={true}
                                                        variant="standard"
                                                    />
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={(event) => {handleClick(event); }}>Create</Button>
                                            <Button onClick={handleClose}>Cancel</Button>
                                        </DialogActions>
                                </Dialog>
                            </Grid>

                        </Grid>

                        <Grid  container spacing={3} rowSpacing={3}  sx={{marginLeft: "10pt", width: "30%", float: "left"}}>
                            <Grid item xs={12} md={12} lg={12}>
                                <Paper
                                    elevation={6}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 250,
                                    }}>
                                    User Information
                                </Paper>
                            </Grid>


                            <Grid item xs={12} md={12} lg={12}>
                                <Paper
                                    elevation={6}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 250,
                                    }}>
                                    Not sure yet.
                                </Paper>
                            </Grid>
                        </Grid>

                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default UserDashboard;
