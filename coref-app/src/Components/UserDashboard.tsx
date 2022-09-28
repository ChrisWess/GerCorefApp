import React, {MutableRefObject} from 'react';
import {ThemeProvider, useTheme} from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
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
    DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Skeleton, Typography, IconButton
} from "@mui/material";
import ResponsiveAppBar from "./ResponsiveAppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import axios from "axios";
import ButtonTextfield from "./ButtonTextfield";
import {ReactComponent} from "*.svg";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Avatar from "@mui/material/Avatar";
interface DashboardProps {

}

function openProject(project: string) {
    console.log("opens project: "+project)
    window.location.href = 'http://localhost:3000/project/'+project;
    return undefined
}


const UserDashboard: React.FC<DashboardProps> = ({}) => {
    const [projectIdNamePairs, setProjectIdNamePairs] = React.useState<[string, string][] | undefined>();
    const [projectname, setProjectname] = React.useState('');
    const [projectToDelete, setProjectToDelete] = React.useState<[string, string]| undefined>();
    const [userInfo, setUserInfo] = React.useState<JSX.Element | undefined>();
    const [error, setError] = React.useState(false);
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [openDelete, setOpenDelete] = React.useState(false);
    let projectList: any;

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setProjectname('');
        setError(false);
        setOpen(false);
    };

    const handleClickOpenDelete = () => {
        setOpenDelete(true);
    };

    const handleCloseDelete = () => {
        setOpenDelete(false);
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
                openProject(projectname)
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

    async function loadUserInfo() {
        // load in the list of projects belonging to the current user and set the projectList
        if (userInfo === undefined) {
            try {
                const {data} = await axios.get(
                    `http://127.0.0.1:5000/user`,
                    {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json',
                        },
                        params: {email: 1, name: 1}
                    },
                );

                if (data.status === 200) {
                    let result = data.result
                    setUserInfo(<Box sx={{width: '100%', maxWidth: 500}}>
                        <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" style={{marginLeft: '45%'}}/>
                        <br/>
                        <Typography variant={"overline"}>Username:</Typography>
                        <Typography variant={"h5"} color={"gray"} align={'center'}>{data.result[0].name}</Typography>
                        <br/>
                        <Typography variant={"overline"}>Email:</Typography>
                        <Typography variant={"h5"} color={"gray"} align={'center'}>{data.result[0].email}</Typography>
                    </Box>)
                    console.log(result)
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

    async function deleteProject(){
        setOpenDelete(false)
        if(projectIdNamePairs && projectToDelete) {
            setProjectIdNamePairs(projectIdNamePairs.filter(item => item[0] != projectToDelete[0]));
        }
        try {
            const { data } = await axios.delete(
                `http://127.0.0.1:5000/project/${projectToDelete![0]}`,
                {
                    withCredentials: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );
            if (data.status === 200) {
                return data.result
            } else {
                return "error status: " + data.status
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
        setProjectToDelete(undefined)
    }

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
                <ListItem divider>
                    <ListItemButton key={index + ".1"} onClick={() => openProject(d[1])} >
                        <ListItemIcon key={index + ".2"}>
                            {index + 1}
                        </ListItemIcon>
                        <ListItemText key={index + ".3"}>{d[1]}</ListItemText>
                    </ListItemButton>
                    <ListItemIcon>
                        <IconButton aria-label="comment" onClick={() => {handleClickOpenDelete(); setProjectToDelete(d)}}>
                            <DeleteIcon />
                        </IconButton>
                    </ListItemIcon>
                </ListItem>
            </React.Fragment>
        );

    }

    React.useEffect(() => {
        loadUserInfo();
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
                        height: '92.9vh',
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
                                        height: 525,
                                        overflow: 'auto'
                                    }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: 485,
                                            overflow: 'auto'
                                        }}>
                                    {projectList ? (<List className="pagination" key={"mainList"}>{projectList}</List>) : (<><Skeleton variant="rectangular" width={'auto'} height={20}/><Skeleton variant="rectangular" style={{marginTop: '10px'}} width={'auto'} height={20}/><Skeleton variant="rectangular" style={{marginTop: '10px'}} width={'auto'} height={20}/></>
                                    )}
                                    </Paper>
                                    <Button variant={"contained"} style={{backgroundColor:"primary" , margin: 1, textTransform: "none", width: "97%" }}
                                            onClick={handleClickOpen} type="submit"> new project </Button>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={12} lg={12}>
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
                                        height: 525,
                                    }}>
                                    {userInfo? userInfo: <><Skeleton variant="rectangular" width={'auto'} height={20}/><Skeleton variant="rectangular" style={{marginTop: '10px'}} width={'auto'} height={20}/><Skeleton variant="rectangular" style={{marginTop: '10px'}} width={'auto'} height={20}/></>}
                                </Paper>
                            </Grid>

                            <Dialog open={openDelete} onClose={handleCloseDelete}>
                                <DialogTitle sx={{color: 'red'}}>Delete Project: {projectToDelete? projectToDelete[1]: ''}?</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Do you really want to delete this project?
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button variant="contained" color="error" sx={{marginRight: '50%'}} onClick={deleteProject}>delete</Button>
                                    <Button onClick={handleCloseDelete}>Cancel</Button>
                                </DialogActions>
                            </Dialog>
                        </Grid>

                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default UserDashboard;
