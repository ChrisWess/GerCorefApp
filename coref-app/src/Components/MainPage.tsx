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
import MainView, {Mention, clearPrevMarking} from "./MainView";
import Documents from "./Documents";
import CorefView from "./CorefView";
import Text from "./Text";
import ResponsiveAppBar from "./ResponsiveAppBar";

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
                    <Typography component="div">{children}</Typography>
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
    const [selectedCoref, setSelectedCoref] = React.useState<number[]>([]);
    const [clusterColor, setClusterColor] = React.useState<string>("black");
    const [currentMention, setCurrentMention] = React.useState<Mention | undefined>(undefined);

    const allCorefsMapped = React.useRef<Map<string, Mention>>(new Map<string, Mention>());
    const allCorefs = React.useRef<Mention[][]>([]);  // different mention representation (more efficient access to entire docs or clusters)
    const wordArr = React.useRef<string[]>([]);
    const wordFlags = React.useRef<boolean[]>([]);
    const markedWord = React.useRef<number[]>([])

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

    React.useEffect(() => {
        document.addEventListener('mouseup', () => {
            let selection = window.getSelection()
            let words = wordArr.current
            if (selection && words.length > 0) {
                let anchor = selection.anchorNode
                let nfocus = selection.focusNode
                if (anchor && nfocus && !nfocus.hasChildNodes() && !anchor.hasChildNodes()) {
                    let startElem = anchor.parentElement
                    let endElem = nfocus.parentElement
                    let docView = document.getElementById("docView")
                    if (startElem && endElem && docView && startElem.id.startsWith("w") && endElem.id.startsWith("w") &&
                        docView.contains(startElem) && docView.contains(endElem)) {
                        let startWordIdx: number = parseInt(startElem.id.substring(1))
                        let endWordIdx: number = parseInt(endElem.id.substring(1))
                        let startOffset: number
                        let endOffset: number
                        if (startWordIdx === endWordIdx) {
                            startOffset = Math.min(selection.anchorOffset, selection.focusOffset)
                            endOffset = Math.max(selection.anchorOffset, selection.focusOffset)
                            let word: string = words[startWordIdx]
                            let isWord: boolean = wordFlags.current[startWordIdx]
                            // offset needs to start at 1, because there is always a space at 0
                            if (startOffset <= 1 && isWord && endOffset === word.length + 1) {
                                clearPrevMarking(markedWord.current)
                                markedWord.current = [startWordIdx]
                                // @ts-ignore
                                value.style.backgroundColor = "yellow";
                                setClusterColor("yellow")
                                setSelectedCoref([startWordIdx, startWordIdx + 1])
                                setCurrentMention(undefined)
                                selection.empty()
                            }
                            return
                        } else if (startWordIdx > endWordIdx) {
                            let temp: number = startWordIdx
                            startWordIdx = endWordIdx
                            endWordIdx = temp
                            startOffset = selection.focusOffset
                            endOffset = selection.anchorOffset
                        } else {
                            startOffset = selection.anchorOffset
                            endOffset = selection.focusOffset
                        }
                        let result: number[] = []
                        let wordFlagsSlice: boolean[] = wordFlags.current.slice(startWordIdx, endWordIdx + 1)
                        for (let i = 1; i < wordFlagsSlice.length - 1; i++) {
                            if (!wordFlagsSlice[i]) {
                                return
                            }
                        }

                        if (!wordFlagsSlice[0]) {
                            result.push(startWordIdx + 1)
                        } else if (startOffset <= 1) {
                            result.push(startWordIdx)
                        } else {
                            result.push(startWordIdx + 1)
                        }

                        if (!wordFlagsSlice[wordFlagsSlice.length - 1]) {
                            result.push(endWordIdx)
                        } else if (endOffset === words[endWordIdx].length + 1) {
                            result.push(endWordIdx + 1)
                        } else {
                            result.push(endWordIdx)
                        }
                        if (result[1] > result[0]) {
                            clearPrevMarking(markedWord.current)
                            if (result[0] + 1 === result[1]) {
                                markedWord.current = [result[0]]
                            } else {
                                markedWord.current = result
                            }
                            for (let i = result[0]; i < result[1]; i++) {
                                let prev = document.getElementById("w" + i)
                                if (prev) {
                                    prev.style.backgroundColor = "yellow"
                                }
                            }
                            setClusterColor("yellow")
                            setSelectedCoref(result)
                            setCurrentMention(undefined)
                            selection.empty()
                        }
                    }
                }
            }
        });
    }, []);

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
                                        wordArr={wordArr}
                                        allCorefsMapped={allCorefsMapped}
                                        allCorefs={allCorefs}
                                        clusterColor={clusterColor}
                                        markedWord={markedWord}
                                        currentMention={currentMention}
                                        handleSelectCoref={setSelectedCoref}
                                        setCurrentMention={setCurrentMention}
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
                                        allCorefsMapped={allCorefsMapped}
                                        allCorefs={allCorefs}
                                        wordArr={wordArr}
                                        wordFlags={wordFlags}
                                        markedWord={markedWord}
                                        setSelectedCoref={setSelectedCoref}
                                        setClusterColor={setClusterColor}
                                        setCurrentMention={setCurrentMention}
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
