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
import MainView, {Mention, parseMentionId} from "./MainView";
import Documents from "./Documents";
import CorefView from "./CorefView";
import Text from "./Text";
import ResponsiveAppBar from "./ResponsiveAppBar";
import ShortcutSnackbar from "./ShortcutSnackbar";
import {useRef} from "react";


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

//For Snackbar
//Allows use of snackbar: use "callSnackbar" with the inputs message, position and type
// see "ShortcutSnackbar.tsx"
interface SnackbarProps {
    callSnackbar: Function;
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


export const clearPrevMarking = function(markedWord: number[]) {
    if (markedWord.length === 1) {
        let prev = document.getElementById("w" + markedWord[0])
        if (prev) {  // && prev.classList.contains("wregular")
            prev.style.backgroundColor = "transparent"
        }
    } else if (markedWord.length === 2) {
        for (let i = markedWord[0]; i < markedWord[1]; i++) {
            let prev = document.getElementById("w" + i)
            if (prev) {  // && prev.classList.contains("wregular")
                prev.style.backgroundColor = "transparent"
            }
        }
    }
};



//unused, possibly usable to create a color theme to improve visuals
const theme = createTheme();

export default function MainPage({callSnackbar}: SnackbarProps) {
    const [corefClusters, setCorefClusters] = React.useState<number[][][]>([]);
    const [corefText, setCorefText] = React.useState<string[][]>([]);
    const [selectedCoref, setSelectedCoref] = React.useState<number[]>([]);
    const [clusterColor, setClusterColor] = React.useState<string>("black");
    const [currentMention, setCurrentMention] = React.useState<Mention | undefined>(undefined);
    const [chosenDocument, setChosenDocument] = React.useState([null]);

    const allCorefs = React.useRef<Mention[][]>([]);
    const wordArr = React.useRef<string[]>([]);
    const wordFlags = React.useRef<(boolean | null)[]>([]);
    const markedWord = React.useRef<number[]>([])

    function addCoref(clusterId: number) {
        return function () {
            let idxStart: number = markedWord.current[0]
            let clusterIdx: number = clusterId - 1
            let mentionIdx: number
            if (clusterId > corefClusters.length) {
                corefClusters.push([])
                allCorefs.current.push([])
                mentionIdx = 0
            } else {
                let cluster: number[][] = corefClusters[clusterIdx]
                mentionIdx = cluster.length
                for (let i = 0; i < cluster.length; i++) {
                    if (cluster[i][0] >= idxStart) {
                        mentionIdx = i
                        break
                    }
                }
            }
            let corefId = `d1c${clusterIdx}m${mentionIdx}`
            let newMention: Mention
            if (markedWord.current.length === 1) {
                newMention = {
                    id: corefId,
                    content: wordArr.current[idxStart],
                    selectionRange: [idxStart, idxStart + 1],
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
                }
            } else {
                newMention = {
                    id: corefId,
                    content: wordArr.current.slice(idxStart, markedWord.current[1]).join(" "),
                    selectionRange: markedWord.current,
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
                }
            }
            setNewCorefSelection(newMention)
            allCorefs.current[clusterIdx].splice(mentionIdx, 0, newMention)
            corefClusters[clusterIdx].splice(mentionIdx, 0, [newMention.selectionRange[0], newMention.selectionRange[1] - 1])
            setCorefClusters(corefClusters)
        }
    }

    function corefShort(clusterId: number) {
        let idxStart: number = markedWord.current[0]
        let clusterIdx: number = Math.min(clusterId - 1, allCorefs.current.length);
        let mentionIdx: number
        if (clusterId > corefClusters.length) {
            corefClusters.push([])
            allCorefs.current.push([])
            mentionIdx = 0
        } else {
            let cluster: number[][] = corefClusters[clusterIdx]
            mentionIdx = cluster.length
            for (let i = 0; i < cluster.length; i++) {
                if (cluster[i][0] >= idxStart) {
                    mentionIdx = i
                    break
                }
            }
        }
        let corefId = `d1c${clusterIdx}m${mentionIdx}`
        let newMention: Mention
        if (markedWord.current.length === 1) {
            newMention = {
                id: corefId,
                content: wordArr.current[idxStart],
                selectionRange: [idxStart, idxStart + 1],
                documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
            }
        } else {
            newMention = {
                id: corefId,
                content: wordArr.current.slice(idxStart, markedWord.current[1]).join(" "),
                selectionRange: markedWord.current,
                documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx
            }
        }
        setNewCorefSelection(newMention)
        allCorefs.current[clusterIdx].splice(mentionIdx, 0, newMention)
        corefClusters[clusterIdx].splice(mentionIdx, 0, [newMention.selectionRange[0], newMention.selectionRange[1] - 1])
        setCorefClusters(corefClusters)
    }

    const deleteCoref = function() {
        let clusterIdx = currentMention!.clusterIdx
        corefClusters[clusterIdx].splice(currentMention!.mentionIdx, 1)
        if (corefClusters[clusterIdx].length === 0) {
            corefClusters.splice(clusterIdx, 1)
        }
        setCorefClusters(corefClusters)
        setNewCorefSelection(undefined)
    }

    //for the key-shortcuts used in MainView
    //todo: implement the "c", handle overwrite of current cluster (leads to error atm)
    const keyShortcutExecuted = (newCoref: string) => {
        if (newCoref === "") {
            return;
        }
        let clusterId = parseInt(newCoref)
        if (isNaN(clusterId)) {
            if (newCoref === "d") {
                deleteCoref()
                callSnackbar("deleted coreference", "top", "info")
            } else if (newCoref === "n") {
                corefShort(allCorefs.current.length + 1)
                callSnackbar("new cluster created", "top", "info")
            } else if (newCoref === "c") {
                callSnackbar("Not Yet Implemented", "top", "info")
            }
            else {
                callSnackbar("No such command: "+newCoref, "top", "warning")
            }
        } else {

            corefShort(clusterId)
            callSnackbar("Added to Cluster: "+newCoref, "top", "normal")
        }
        console.log("keyshortCutInvoked:"+newCoref)
    }

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

    const getStyle = function(element: any, property: string) {
        return window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(property) :
            element.style[property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })];
    };

    const getMentionFromId = function(mentionId: string, allCorefs: Mention[][]) {
        let mentionLoc = parseMentionId(mentionId)
        return allCorefs[mentionLoc.clusterIdx][mentionLoc.mentionIdx]
    }

    const setNewCorefSelection = (value: any) => {
        clearPrevMarking(markedWord.current)
        markedWord.current = []
        let mention: Mention
        if (!value) {
            setCurrentMention(undefined)
            setSelectedCoref([])
            setClusterColor("black")
        } else if ('mentionIdx' in value) {
            mention = value
            setCurrentMention(mention)
            setSelectedCoref(mention.selectionRange)
            let className = 'cr-' + (mention.clusterIdx + 1)
            let element: HTMLElement | null = document.querySelector(className)
            if (element) {
                setClusterColor(getComputedStyle(element).backgroundColor)
            } else {
                // hacky way to get the correct background color from CSS sheet for new clusters
                element = document.createElement('abbr')
                element.textContent = '.'
                element.className = 'cr-' + (mention.clusterIdx + 1)
                document.body.appendChild(element)
                console.log(getComputedStyle(element).backgroundColor)
                setClusterColor(getComputedStyle(element).backgroundColor)
                document.body.removeChild(element)
            }
        } else {
            mention = getMentionFromId(value.currentTarget.id, allCorefs.current)
            setCurrentMention(mention)
            setSelectedCoref(mention.selectionRange)
            setClusterColor(getStyle(value.currentTarget.children[0], "background-color"))
        }
    }

    const markWords = (markRange: number[], value: any) => {
        clearPrevMarking(markedWord.current)
        if (markRange.length === 1) {
            if (!value) {
                value = document.getElementById("w" + markRange[0])
            }
            value.style.backgroundColor = "yellow";
            setSelectedCoref([markRange[0], markRange[0] + 1])
            markedWord.current = markRange
        } else {
            if (markRange[0] + 1 === markRange[1]) {
                markedWord.current = [markRange[0]]
            } else {
                markedWord.current = markRange
            }
            for (let i = markRange[0]; i < markRange[1]; i++) {
                let prev = document.getElementById("w" + i)
                if (prev) {
                    prev.style.backgroundColor = "yellow"
                }
            }
            setSelectedCoref(markRange)
        }
        setClusterColor("yellow")
        setCurrentMention(undefined)
    }

    //For Tabs
    const [value, setValue] = React.useState(0);
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };


    const  changeChosenDocument = (newDocument: any) => {
        setChosenDocument(newDocument);
        console.log(newDocument);
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
                            let isWord: boolean = !!wordFlags.current[startWordIdx]
                            // offset needs to start at 1, because there is always a space at 0
                            if (startOffset <= 1 && isWord && endOffset === word.length + 1) {
                                markWords([startWordIdx], undefined)
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
                        let wordFlagsSlice: (boolean | null)[] = wordFlags.current.slice(startWordIdx, endWordIdx + 1)
                        for (let i = 1; i < wordFlagsSlice.length - 1; i++) {
                            if (wordFlagsSlice[i] === false) {
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
                            markWords(result, undefined)
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
                                        allCorefs={allCorefs}
                                        clusterColor={clusterColor}
                                        markedWord={markedWord}
                                        currentMention={currentMention}
                                        handleSelectCoref={setSelectedCoref}
                                        setCurrentMention={setCurrentMention}
                                        addCoref={addCoref}
                                        deleteCoref={deleteCoref}
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
                                        allCorefs={allCorefs}
                                        wordArr={wordArr}
                                        wordFlags={wordFlags}
                                        setNewCorefSelection={setNewCorefSelection}
                                        markWords={markWords}
                                        keyShortcutExecuted={keyShortcutExecuted}
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
                                                <Tab label="Statistics" {...a11yProps(2)} />
                                            </Tabs>
                                        </Box>
                                        <TabPanel value={value} index={0}>

                                            {/* Text */}
                                            <Text
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}
                                                changeChosenDocument={changeChosenDocument}
                                            />


                                        </TabPanel>
                                        <TabPanel value={value} index={1}>
                                            {/* Documents */}
                                            <Documents
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}
                                                changeChosenDocument={changeChosenDocument}
                                                chosenDocument={chosenDocument}
                                                >
                                            </Documents>                                        
                                        </TabPanel>
                                        <TabPanel value={value} index={2}>
                                            {/* Statistics */}                                      
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
