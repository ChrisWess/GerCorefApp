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
import set = Reflect.set;
import Statistics from "./Statistics";
import axios from "axios";
import FileConverter from "./FileConverter";
import Search from './Search';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DescriptionIcon from '@mui/icons-material/Description';




function Copyright(props: any) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://mui.com/">
                Coref-App
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

export type ConfidenceValues = {
    newClusterProb: number;
    noClusterProb: number;
    clusterProbs: number[]
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
    const [confidences, setConfidences] = React.useState<ConfidenceValues[][]>([]);
    const [documentId, setDocumentId] = React.useState<string>();
    const [documentIdNamePairs, setDocumentIdNamePairs] = React.useState<[string, string][] | undefined>();
    const [unsavedChanges, setUnsavedChanges] = React.useState<boolean>();
    const [documentIdMapping, setDocumentIdMapping] = React.useState<Map<string, string> | undefined>();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage] = React.useState(10);
    const [sentenceToHighlight, setSentenceToHighlight] = React.useState(0);
    const [wordsToHighlight, setWordsToHighlight] = React.useState<number[]>([]);


    const changePage = (sentence: number, words: number[]) => {
        setCurrentPage(Math.ceil(sentence / itemsPerPage));
        setSentenceToHighlight(sentence);
    }

    const [hovertoggle, setHovertoggle] = React.useState(true);
    const [autoAnnotoggle, setAutoAnnoToggle] = React.useState(true);

    //currently on the "c" button for the shortcuts
    const [shortcutSaved, setShortcutSaved] = React.useState<number>(0);

    const allCorefs = React.useRef<Mention[][]>([]);
    const wordArr = React.useRef<string[]>([]);
    const wordFlags = React.useRef<(boolean | null)[]>([]);
    const markedWord = React.useRef<number[]>([])

    function onDownloadDocument(dataType: string, documentName: string) {
        let converter = new FileConverter()
        console.log("directed to mainpage")
        converter.convertFile(dataType ,documentName, corefClusters, corefText)
    }

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
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                    autoCreated: false
                }
            } else {
                newMention = {
                    id: corefId,
                    content: wordArr.current.slice(idxStart, markedWord.current[1]).join(" "),
                    selectionRange: markedWord.current,
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                    autoCreated: false
                }
            }
            setNewCorefSelection(newMention)
            let cluster: Mention[] = allCorefs.current[clusterIdx]
            cluster.splice(mentionIdx, 0, newMention)
            for (let i = mentionIdx + 1; i < cluster.length; i++) {
                let m: Mention = cluster[i]
                let newMentionIdx: number = m.mentionIdx + 1
                m.mentionIdx = newMentionIdx
                m.id = `d1c${clusterIdx}m${newMentionIdx}`
            }
            corefClusters[clusterIdx].splice(mentionIdx, 0, [newMention.selectionRange[0], newMention.selectionRange[1] - 1])
            setCorefClusters(corefClusters)
        }
    }

    function corefShort(clusterId: number) {
        try {
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
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                    autoCreated: false
                }
            } else {
                newMention = {
                    id: corefId,
                    content: wordArr.current.slice(idxStart, markedWord.current[1]).join(" "),
                    selectionRange: markedWord.current,
                    documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                    autoCreated: false
                }
            }
            setNewCorefSelection(newMention)
            let cluster: Mention[] = allCorefs.current[clusterIdx]
            cluster.splice(mentionIdx, 0, newMention)
            for (let i = mentionIdx + 1; i < cluster.length; i++) {
                let m: Mention = cluster[i]
                let newMentionIdx: number = m.mentionIdx + 1
                m.mentionIdx = newMentionIdx
                m.id = `d1c${clusterIdx}m${newMentionIdx}`
            }
            corefClusters[clusterIdx].splice(mentionIdx, 0, [newMention.selectionRange[0], newMention.selectionRange[1] - 1])
            setCorefClusters(corefClusters)
        } catch (e) {
            callSnackbar("An Error occurred: "+ e, "top", "error")
        }
    }

    const deleteCoref = function() {
        // TODO: implement versioning of the documents in order to keep track of previous annotation states
        //  (model inference should create a new version => if a coreference, that was created by the model,
        //  is deleted and re-added, the system should still be able to show the plots afterwards)
        let clusterIdx = currentMention!.clusterIdx
        let mentionIdx = currentMention!.mentionIdx
        corefClusters[clusterIdx].splice(mentionIdx, 1)

        let cluster: Mention[] = allCorefs.current[clusterIdx]
        cluster.splice(mentionIdx, 1)
        for (let i = mentionIdx; i < cluster.length; i++) {
            let m: Mention = cluster[i]
            let newMentionIdx: number = m.mentionIdx - 1
            m.mentionIdx = newMentionIdx
            m.id = `d1c${clusterIdx}m${newMentionIdx}`
        }

        if (corefClusters[clusterIdx].length === 0) {
            corefClusters.splice(clusterIdx, 1)
            allCorefs.current.splice(clusterIdx, 1)
            for (let i = clusterIdx; i < allCorefs.current.length; i++) {
                cluster = allCorefs.current[i]
                for (let j = 0; j < cluster.length; j++) {
                    let m: Mention = cluster[j]
                    m.clusterIdx = i
                    m.id = `d1c${i}m${m.mentionIdx}`
                }
            }
        }
        setCorefClusters(corefClusters)
        setNewCorefSelection(undefined)
    }

    //for the key-shortcuts used in MainView
    //todo: handle overwrite of current cluster (leads to error atm)
    //todo: fix error:  when words are selected by pressing their "[]" the main view gets unselected and shortcuts stop working
    const keyShortcutExecuted = (newCoref: string) => {

        if (newCoref === "" || (!markedWord.current[0] && !currentMention)) {
            callSnackbar("No words selected!", "top", "error")
            return;
        }

        console.log(newCoref)
        let clusterId = parseInt(newCoref)

        if (isNaN(clusterId)) {
            switch (newCoref) {
                case "d":
                    deleteCoref()
                    callSnackbar("deleted coreference", "top", "info")
                    break;
                case "n":
                    corefShort(corefClusters.length + 1)
                    callSnackbar("new cluster created", "top", "info")
                    break;
                case "c":
                    if (currentMention) {
                        setShortcutSaved(currentMention.clusterIdx + 1)
                        callSnackbar("Current copy: Coref cluster Nr." + (currentMention.clusterIdx + 1), "top", "info")
                    } else {
                        callSnackbar("Please select a word with an assigned coref cluster to copy!", "top", "warning")
                    }
                    break;
                case "v":
                    corefShort(shortcutSaved)
                    break;
                default:
                    callSnackbar("No such command: " + newCoref, "top", "warning")
                    break;
            }
        } else {
            if(clusterId > corefClusters.length+1){
                callSnackbar("No such Cluster: "+newCoref, "top", "error")
            }else {
                corefShort(clusterId)
                callSnackbar("Added to Cluster: " + newCoref, "top", "normal")
            }
        }
        console.log("keyshortCutInvoked:"+newCoref)
    }

    //Functions used by Child-Component "Text" to send the received data to the
    // main page. Maybe 1 function to send both would be enough
    const sendCorefClustersToMainPage = (cluster: number[][][]) => {
        console.log(cluster)
        setCorefClusters(cluster);
    };

    const sendCorefTextToMainPage = (messages: string[][]) => {
        console.log(messages)
        setCorefText(messages);
    };

    const sendConfidencesToMainPage = (probs: number[][][]) => {
        probs[0][0].push(0)
        let confids: ConfidenceValues[][] = []
        for (let i = 0; i < probs.length; i++) {
            let probsList: ConfidenceValues[] = []
            let clust = probs[i]
            for (let j = 0; j < clust.length; j++) {
                probsList.push({
                    newClusterProb: clust[j][0] * 100.0,
                    noClusterProb: clust[j][1] * 100.0,
                    clusterProbs: clust[j].slice(2).map((x: number) => x * 100.0)
                })
            }
            confids.push(probsList)
        }
        setConfidences(confids)
    }

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
        setSentenceToHighlight(0);
    };

    const changeDocumentId = (newId: any) => {
        setDocumentId(newId);
    };

    async function loadDocuments() {
        // load in the list of documents belonging to the current user and set the documentList
        if (!documentIdNamePairs) {
            try {
                const {data} = await axios.get(
                    `http://127.0.0.1:5000/doc`,
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
                        let reducedDoc = result[i]
                        idNamePairs.push([reducedDoc._id, reducedDoc.name])
                    }
                    idNamePairs.sort((a, b) => a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : 0)
                    setDocumentIdNamePairs(idNamePairs)
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

    React.useEffect(() => {
        // add text selection event listener to the HTML document object
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
                                        hovertoggle={hovertoggle}
                                        setHovertoggle={setHovertoggle}
                                        autoAnnotoggle={autoAnnotoggle}
                                        setAutoAnnotoggle={setAutoAnnoToggle}
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
                                        hovertoggle={hovertoggle}
                                        autoAnnotoggle={autoAnnotoggle}
                                        setCurrentPage={setCurrentPage}
                                        currentPage={currentPage}
                                        itemsPerPage={itemsPerPage}
                                        sentenceToHighlight={sentenceToHighlight}
                                        setSentenceToHighlight={setSentenceToHighlight}
                                        wordsToHighlight={wordsToHighlight}>
                                    </MainView>
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
                                            <Tabs value={value} onChange={handleChange}> 
                                                <Tab icon={<TextFieldsIcon />} {...a11yProps(0)} style={{minWidth:"25%"}}/>
                                                <Tab icon={<DescriptionIcon />} {...a11yProps(1)} onClick={loadDocuments} style ={{minWidth: '25%'}}/>
                                                <Tab icon={<SearchIcon />}  {...a11yProps(2)} style ={{minWidth: '25%'}}/> 
                                                <Tab icon={<AssessmentIcon />} {...a11yProps(3)} style ={{minWidth: '25%'}}/>
                                            </Tabs>
                                        </Box>
                                        <TabPanel value={value} index={0}>

                                            {/* Text */}
                                            <Text
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}
                                                allCorefs={allCorefs}
                                                sendConfidencesToParent={sendConfidencesToMainPage}
                                                changeDocumentId={changeDocumentId}
                                            />


                                        </TabPanel>
                                        <TabPanel value={value} index={1}>
                                            {/* Documents */}
                                            <Documents
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}
                                                allCorefs={allCorefs}
                                                sendConfidencesToParent={sendConfidencesToMainPage}
                                                onDownloadDocument={onDownloadDocument}
                                                documentId={documentId}
                                                changeDocumentId={changeDocumentId}
                                                documentsInfo={documentIdNamePairs}
                                                setDocumentsInfo={setDocumentIdNamePairs}
                                            />
                                        </TabPanel>
                                        <TabPanel value={value} index={2}>
                                            <Search                                         
                                                documentId={documentId}  
                                                txt={corefText}
                                                changePage={changePage} 
                                                setSentenceToHighlight={setSentenceToHighlight}
                                                setWordsToHighlight = {setWordsToHighlight}  
                                            ></Search>
                                        </TabPanel>
                                        <TabPanel value={value} index={3}>
                                            <Statistics
                                                currentMention={currentMention}
                                                confidences={confidences}
                                                allCorefs={allCorefs}
                                            ></Statistics>
                                        </TabPanel>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
