import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MainView from "./MainView";
import Documents from "./Documents";
import CorefView from "./CorefView";
import Text from "./Text";
import {ChangeEvent} from "react";

function Copyright(props: any) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://mui.com/">
                Your Website
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}
//For Tabs
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}
function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

//unused, possibly usable to create a color theme to improve visuals
const theme = createTheme();

function MainPageContent() {
    const [corefClusters, setCorefClusters] = React.useState(["Nothing"]);
    const [corefText, setCorefText] = React.useState(["No Document"]);
    const [selectedCoref, setSelectedCoref] = React.useState("No Selection");
    const allCorefsMapped = new Map<string, string>(new Map());

    //Functions used by Child-Component "Text" to send the received data to the
    // main page. Maybe 1 function to send both would be enough
    const sendCorefClustersToMainPage = (cluster:any[]) => {
        console.log(cluster)
        setCorefClusters(cluster);
    };
    const sendCorefTextToMainPage = (messages:any[]) => {
        console.log(messages)
        setCorefText(messages);
    };

    //For Tabs
    const [value, setValue] = React.useState(0);
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <ThemeProvider theme={theme}>
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
                    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                        <Grid container spacing={3}>

                            {/* Corefview */}
                            <Grid item xs={3} md={3} lg={3}>
                                <Paper
                                    elevation={6}
                                    sx={{
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: 800,
                                }}>
                                    <CorefView
                                        selectedCoref={selectedCoref}
                                        handleSelectCoref={setSelectedCoref}
                                    />
                                </Paper>
                            </Grid>

                            {/* CurrentMainView */}
                            <Grid item xs={6} md={6} lg={6}>
                                <Paper
                                    elevation={6}
                                    sx={{
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: 800,
                                }}>
                                    <MainView
                                        txt={corefText}
                                        clust={corefClusters}
                                        allCorefs={allCorefsMapped}
                                        setSelectedCoref={setSelectedCoref}
                                    ></MainView>
                                </Paper>
                            </Grid>

                            {/* Documents */}
                            <Grid item xs={3} md={3} lg={3}>
                                <Paper
                                    elevation={6}
                                    sx={{
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: 800,
                                }}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                                                <Tab label="Text" {...a11yProps(0)} />
                                                <Tab label="Documents" {...a11yProps(1)} />
                                            </Tabs>
                                        </Box>
                                        <TabPanel value={value} index={0}>

                                            {/* Text */}
                                            <Text
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}
                                            />


                                        </TabPanel>
                                        <TabPanel value={value} index={1}>
                                            {/* Documents */}
                                            <Documents
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}>
                                            </Documents>                                        
                                        </TabPanel>
                                    </Box>
                                </Paper>
                            </Grid>

                        </Grid>

                        <Copyright sx={{ pt: 4 }} />
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default function MainPage() {
    return <MainPageContent />;
}
