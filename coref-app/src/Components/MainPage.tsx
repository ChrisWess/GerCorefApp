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
import {useParams} from "react-router-dom";
const _ = require('lodash');



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
interface MainPageProps {
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

export default function MainPage({callSnackbar}: MainPageProps) {
    const {docname} = useParams();
    const {projectname} = useParams();
    const [corefClusters, setCorefClusters] = React.useState<number[][][]>([]);
    const [corefText, setCorefText] = React.useState<string[][]>([]);
    const [annotators, setAnnotators] = React.useState<string[][]>([]);
    const [selectedCoref, setSelectedCoref] = React.useState<number[]>([]);
    const [clusterColor, setClusterColor] = React.useState<string>("black");
    const [currentMention, setCurrentMention] = React.useState<Mention | undefined>(undefined);
    const [confidences, setConfidences] = React.useState<(ConfidenceValues | null)[][]>([]);
    const [currDocInfo, setCurrDocInfo] = React.useState<string[]>([]);
    const [documentIdNamePairs, setDocumentIdNamePairs] = React.useState<[string, string][] | undefined>();
    const [unsavedChanges, setUnsavedChanges] = React.useState<boolean>(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage] = React.useState(10);
    const [sentenceToHighlight, setSentenceToHighlight] = React.useState(0);
    const [wordsToHighlight, setWordsToHighlight] = React.useState<number[]>([]);
    const [inputText, setInputText] = React.useState<string>("");

    const changePage = (sentence: number, words: number[]) => {
        setCurrentPage(Math.ceil(sentence / itemsPerPage));
        setSentenceToHighlight(sentence);
    }

    const [hovertoggle, setHovertoggle] = React.useState(true);
    const [autoAnnotoggle, setAutoAnnoToggle] = React.useState(true);
    //currently on the "c" button for the shortcuts
    const [shortcutSaved, setShortcutSaved] = React.useState<number>(1);

    const allCorefs = React.useRef<Mention[][]>([]);
    const wordArr = React.useRef<string[]>([]);
    const wordFlags = React.useRef<(boolean | null)[]>([]);
    const markedWord = React.useRef<number[]>([])
    const opsArr = React.useRef<number[][] | undefined>();

    function onDownloadDocument(dataType: string, documentName: string) {
        let converter = new FileConverter()
        console.log("directed to mainpage")
        converter.convertFile(dataType ,documentName, allCorefs, corefText, autoAnnotoggle)
    }

    function getCurrDocInfoFromList(docId: string) {
        if (documentIdNamePairs) {
            for (let i = 0; i < documentIdNamePairs.length; i++) {
                if (documentIdNamePairs[i][0] === docId) {
                    return documentIdNamePairs[i]
                }
            }
        }
        return []
    }

    function addOperationToStorage(opEntry: number[]) {
        // TODO: check if new opEntry reverses operation that is already in ops list =>
        //   if there are any, just cancel out both operations
        if (currDocInfo.length === 0) {
            throw "No document id set in current state"
        }
        if (opsArr.current === undefined) {
            opsArr.current = [opEntry]
        } else {
            opsArr.current.push(opEntry)
        }
        if (localStorage.getItem("docId") === null) {
            localStorage.setItem("docId", currDocInfo[0])
        }
        localStorage.setItem("ops", JSON.stringify(opsArr.current))
        if (!unsavedChanges) {
            setUnsavedChanges(true)
        }
    }

    function clearChanges() {
        // Clear storage of unsaved changes
        opsArr.current = undefined
        localStorage.removeItem("ops")
        localStorage.removeItem("docId")
        setUnsavedChanges(false)
    }

    async function saveChanges() {
        let ops: string | null = localStorage.getItem("ops")
        let docId: string | null = localStorage.getItem("docId")
        if (!!ops && !!docId) {
            try {
                const {data} = await axios.put(
                    `http://127.0.0.1:5000/doc/${docId}`,
                    {ops: ops},
                    {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                        },
                    },
                );

                if (data.status === 200) {
                    clearChanges()
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

    function createNewMention(selectionRange: number[], clusterIdx: number, mentionIdx: number,
                              idxStart: number, idxEnd: number) {
        if (clusterIdx >= allCorefs.current.length) {
            allCorefs.current.push([])
        }
        let corefId = `d1c${clusterIdx}m${mentionIdx}`
        let newMention: Mention
        if (selectionRange.length === 1) {
            newMention = {
                id: corefId,
                content: wordArr.current[idxStart],
                selectionRange: [idxStart, idxStart + 1],
                documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                autoCreated: false, createdByUser: "You"
            }
        } else {
            ++idxEnd
            newMention = {
                id: corefId,
                content: wordArr.current.slice(idxStart, idxEnd).join(" "),
                selectionRange: [idxStart, idxEnd],
                documentIdx: 0, clusterIdx: clusterIdx, mentionIdx: mentionIdx,
                autoCreated: false, createdByUser: "You"
            }
        }
        let cluster: Mention[] = allCorefs.current[clusterIdx]
        cluster.splice(mentionIdx, 0, newMention)
        for (let i = mentionIdx + 1; i < cluster.length; i++) {
            let m: Mention = cluster[i]
            let newMentionIdx: number = m.mentionIdx + 1
            m.mentionIdx = newMentionIdx
            m.id = `d1c${clusterIdx}m${newMentionIdx}`
        }
        return newMention
    }

    function addCoref(clusterIdx: number, idxStart: number, idxEnd: number) {
        console.log(clusterIdx)
        console.log(idxStart)
        console.log(idxEnd)
        let mentionIdx: number
        if (clusterIdx >= corefClusters.length) {
            corefClusters.push([])
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
        let newMention: Mention = createNewMention(markedWord.current, clusterIdx, mentionIdx, idxStart, idxEnd)
        corefClusters[clusterIdx].splice(mentionIdx, 0, [idxStart, idxEnd])
        return newMention
    }

    function insertCoref(clusters: number[][][], clusterIdx: number, mentionIdx:number,
                         idxStart: number, idxEnd: number) {
        if (clusterIdx >= clusters.length) {
            clusters.push([])
            mentionIdx = 0
        }
        let range = idxStart === idxEnd ? [idxStart] : [idxStart, idxEnd]
        createNewMention(range, clusterIdx, mentionIdx, idxStart, idxEnd)
        clusters[clusterIdx].splice(mentionIdx, 0, [idxStart, idxEnd])
        return clusters
    }

    function addCurrCorefMain(clusterIdx: number) {
        let idxStart: number = markedWord.current[0]
        let idxEnd: number
        if (markedWord.current.length > 1) {
            idxEnd = markedWord.current[1] - 1
        } else {
            idxEnd = markedWord.current[0]
        }
        let newMention: Mention = addCoref(clusterIdx, idxStart, idxEnd)
        setNewCorefSelection(newMention)
        setCorefClusters(corefClusters)
        let opEntry: number[] = [0, clusterIdx, newMention.mentionIdx, idxStart, idxEnd]
        addOperationToStorage(opEntry)
    }

    function addCurrCoref(clusterId: number) {
        return function () {
            let clusterIdx: number = clusterId - 1
            addCurrCorefMain(clusterIdx)
        }
    }

    function addCurrCorefShort(clusterId: number) {
        try {
            //let clusterIdx: number = Math.min(clusterId - 1, allCorefs.current.length);
            let clusterIdx: number = clusterId - 1
            addCurrCorefMain(clusterIdx)
        } catch (e) {
            console.log(clusterId)
            callSnackbar("An Error occurred: "+ e, "top", "error")
        }
    }

    const deleteCoref = function(clusters: number[][][], clusterIdx: number, mentionIdx: number) {
        clusters[clusterIdx].splice(mentionIdx, 1)

        let cluster: Mention[] = allCorefs.current[clusterIdx]
        cluster.splice(mentionIdx, 1)
        for (let i = mentionIdx; i < cluster.length; i++) {
            let m: Mention = cluster[i]
            let newMentionIdx: number = m.mentionIdx - 1
            m.mentionIdx = newMentionIdx
            m.id = `d1c${clusterIdx}m${newMentionIdx}`
        }

        if (clusters[clusterIdx].length === 0) {
            clusters.splice(clusterIdx, 1)
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
        return clusters
    }

    const overwriteCurrCoref = function(newCluster: number) {
        // TODO: implement versioning of the documents in order to keep track of previous annotation states
        //  (model inference should create a new version => if a coreference, that was created by the model,
        //  is deleted and re-added, the system should still be able to show the plots afterwards)

        let start = currentMention!.selectionRange[0]
        let end = currentMention!.selectionRange[1]
        let prevClust = currentMention!.clusterIdx
        let clustersTotal = corefClusters.length
        //nothing happens if overwrite with same cluster
        if (newCluster === (prevClust+1)){
            return
        }

        //delete part
        let clusterIdx = currentMention!.clusterIdx
        let mentionIdx = currentMention!.mentionIdx
        let clusters = deleteCoref(corefClusters, clusterIdx, mentionIdx)
        setCorefClusters(clusters)
        setNewCorefSelection(undefined)
        let opEntry: number[] = [1, clusterIdx, mentionIdx]
        addOperationToStorage(opEntry)
        let newMention: Mention;
        //add part
        if(newCluster < (prevClust+1)){
            newMention = addCoref(newCluster -1, start, end-1)
        } else if (clustersTotal > clusters.length){
            //if this coref was the last one of its index
            newMention = addCoref(newCluster -2, start, end-1)
        } else
            newMention = addCoref(newCluster -1, start, end-1)


        setNewCorefSelection(newMention)
        setCorefClusters(corefClusters)
        let opEntry2: number[] = [0, newCluster, newMention.mentionIdx, start, end-1]
        addOperationToStorage(opEntry2)
    }

    const deleteCurrCoref = function() {
        // TODO: implement versioning of the documents in order to keep track of previous annotation states
        //  (model inference should create a new version => if a coreference, that was created by the model,
        //  is deleted and re-added, the system should still be able to show the plots afterwards)
        let clusterIdx = currentMention!.clusterIdx
        let mentionIdx = currentMention!.mentionIdx
        let clusters = deleteCoref(corefClusters, clusterIdx, mentionIdx)
        setCorefClusters(clusters)
        setNewCorefSelection(undefined)
        let opEntry: number[] = [1, clusterIdx, mentionIdx]
        addOperationToStorage(opEntry)
    }

    const applyDocOperation = function(target: number[][][], op: number[]) {
        if (op[0] === 0) {
            let clusterIdx = op[1]
            let mentionIdx = op[2]
            let start = op[3]
            let end = op[4]
            return insertCoref(target, clusterIdx, mentionIdx, start, end)
        } else if (op[0] === 1) {
            let clusterIdx = op[1]
            let mentionIdx = op[2]
            return deleteCoref(target, clusterIdx, mentionIdx)
        } else {
            throw "Operation not permitted"
        }
    }

    function reapplyChanges(target: number[][][], ops: number[][]) {
        if (ops) {
            // re-apply doc changes in Frontend
            let targetCopy: number[][][] = _.cloneDeep(target)
            try {
                for (let op of ops) {
                    targetCopy = applyDocOperation(targetCopy, op)
                }
                target = targetCopy
            } catch (error) {
                clearChanges()
            }
        }
        return target
    }

    //for the key-shortcuts used in MainView
    //todo: handle overwrite of current cluster (not possible atm)
    const keyShortcutExecuted = (newCoref: string) => {

        //stop function if nothing was typed
        if (newCoref === "")
        {
            //callSnackbar("Invalid command!", "top", "error")
            return;
        }
        let clusterId = parseInt(newCoref)

        //if a coref is selected (if no unmarked word is selected)
        if (currentMention && markedWord.current[0] == undefined) {
            if (isNaN(clusterId)) {
                switch (newCoref) {
                    case "d":
                        deleteCurrCoref()
                        callSnackbar("deleted coreference", "top", "normal")
                        break;
                    case "n":
                        overwriteCurrCoref(corefClusters.length + 1)
                        callSnackbar("Coref overwritten.", "top", "normal")
                        break;
                    case "c":
                        setShortcutSaved(currentMention.clusterIdx + 1)
                        callSnackbar("Current copy: Coref cluster Nr." + (currentMention.clusterIdx + 1), "top", "info")
                        break;
                    case "v":
                        overwriteCurrCoref(shortcutSaved)
                        callSnackbar("Coref overwritten.", "top", "normal")
                        break;
                    default:
                        callSnackbar("No such command: " + newCoref, "top", "warning")
                        break;
                }
            } else {
                if(clusterId > corefClusters.length+1){
                    callSnackbar("No such Cluster: "+newCoref, "top", "warning")
                }else {
                    overwriteCurrCoref(clusterId)
                    callSnackbar("Coref overwritten.", "top", "normal")
                }
            }
            return;
        }

        //if an unmarked is selected (if no coref is selected)
        if (markedWord.current[0] != undefined && !currentMention) {
            if (isNaN(clusterId)) {
                switch (newCoref) {
                    case "n":
                        addCurrCorefShort(corefClusters.length + 1)
                        callSnackbar("new cluster created", "top", "normal")
                        break;
                    case "v":
                        addCurrCorefShort(shortcutSaved)
                        callSnackbar("Assigned to cluster: " +shortcutSaved, "top", "normal")
                        break;
                    default:
                        callSnackbar("No such command for unmarked words: " + newCoref, "top", "warning")
                        break;
                }
            } else {
                if(clusterId > corefClusters.length+1){
                    callSnackbar("No such Cluster: "+newCoref, "top", "error")
                }else {
                    addCurrCorefShort(clusterId)
                    callSnackbar("Assigned to: " + newCoref, "top", "normal")
                }
            }
            return;
        }
        callSnackbar("No words selected!", "top", "error")
        return;
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

    function clearCurrentMention() {
        setCurrentMention(undefined)
        clearPrevMarking(markedWord.current)
        setSelectedCoref([])
        setClusterColor("black")
    }

    const convertConfidences = (probs: number[][][]) => {
        probs[0][0].push(0)
        let confids: (ConfidenceValues | null)[][] = []
        for (let i = 0; i < probs.length; i++) {
            let probsList: (ConfidenceValues | null)[] = []
            let clust = probs[i]
            for (let j = 0; j < clust.length; j++) {
                if (clust[j] === null) {
                    probsList.push(null)
                } else {
                    probsList.push({
                        newClusterProb: clust[j][0] * 100.0,
                        noClusterProb: clust[j][1] * 100.0,
                        clusterProbs: clust[j].slice(2).map((x: number) => x * 100.0)
                    })
                }
            }
            confids.push(probsList)
        }
        console.log(confids)
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
            value.style.backgroundColor = "deepskyblue";
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
                    prev.style.backgroundColor = "deepskyblue"
                }
            }
            setSelectedCoref(markRange)
        }
        setClusterColor("deepskyblue")
        setCurrentMention(undefined)
    }

    //For Tabs
    const [value, setValue] = React.useState(0);
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        setSentenceToHighlight(0);
        setInputText("");
        setWordsToHighlight([]);
    };

    const addDocumentInfo = (newDocId: string, newDocName: string) => {
        let newDocInfo: [string, string] = [newDocId, newDocName]
        if (documentIdNamePairs !== undefined) {
            let insertIndex = documentIdNamePairs.length
            for (let i = 0; i < insertIndex; i++) {
                let a = documentIdNamePairs[i][1]
                if (newDocName < a) {
                    insertIndex = 0
                    break
                }
            }
            documentIdNamePairs.splice(insertIndex, 0, newDocInfo)
            setDocumentIdNamePairs(documentIdNamePairs)
            setCurrDocInfo(newDocInfo)
        }
    };

    const renameDoc = async (inpt: string) => {
        if (currDocInfo.length > 0) {
            try {
                const {data} = await axios.put(
                    `http://127.0.0.1:5000/doc/rename`,
                    {docid: currDocInfo[0], docname: inpt},
                    {
                        withCredentials: true,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
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
        }
    }

    const renameDocument = (inpt: string) => {
        if (documentIdNamePairs !== undefined) {
            renameDoc(inpt).then(result => {
                if (typeof result === 'string' || result instanceof String) {
                    throw result
                } else {
                    // use unique name from result in case the name already existed
                    let newDocInfo = [result._id, result.name]
                    for (let i = 0; i < documentIdNamePairs.length; i++) {
                        if (newDocInfo[0] === documentIdNamePairs[i][0]) {
                            documentIdNamePairs[i][1] = result.name
                            break
                        }
                    }
                    setDocumentIdNamePairs(documentIdNamePairs)
                    setCurrDocInfo(newDocInfo)
                    window.history.replaceState(null, "Coref-App", "/project/"+projectname+"/doc/"+result.name)
                }
            })
        }
    }

    async function selectDocument(docId: string, ops: number[][] | undefined = undefined) {
        try {
            const {data} = await axios.get(
                `http://127.0.0.1:5000/doc/${docId}`,
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            if (data.status === 200) {
                // TODO: could keep a cache of (perhaps) 5 documents
                let result = data.result
                let clust: number[][][] = result.clust
                allCorefs.current = []
                if (ops !== undefined && ops.length > 0) {
                    // fill allCorefs already when ops need to be applied
                    for (let i = 0; i < result.tokens.length; i++) {
                        let cluster: string[] = result.tokens[i]
                        for (let j = 0; j < cluster.length; j++) {
                            wordArr.current.push(cluster[j])
                        }
                    }
                    for (let i = 0; i < clust.length; i++) {
                        allCorefs.current.push(Array<Mention>())
                        let cluster: number[][] = clust[i]
                        for (let j = 0; j < cluster.length; j++) {
                            let mentionIdxStart = cluster[j][0]
                            let mentionIdxEnd = cluster[j][1]
                            let coref = wordArr.current.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
                            let corefId = `d1c${i}m${j}`
                            allCorefs.current[i][j] = {
                                id: corefId,
                                content: coref,
                                selectionRange: [mentionIdxStart, mentionIdxEnd + 1],
                                documentIdx: 0, clusterIdx: i, mentionIdx: j,
                                autoCreated: result.annotatedBy[i][j] === "0",
                                createdByUser: result.annotatedBy[i][j]
                            }
                        }
                    }
                    clust = reapplyChanges(clust, ops)
                }
                // TODO: create and set state for handling annotators (createdByUser field in Mentions)
                setCurrDocInfo([result._id, result.name]);
                setCorefClusters(clust)
                setCorefText(result.tokens)
                // TODO: the following two arrays need to be manipulated by reapplyChanges, too
                setAnnotators(result.annotatedBy)
                convertConfidences(result.probs)
                console.log()
                clearCurrentMention()
                window.history.replaceState(null, "Coref-App", "/project/"+projectname+"/doc/"+result.name)
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

    async function loadDocuments() {
        // load in the list of documents belonging to the current user and set the documentList
        if (documentIdNamePairs === undefined) {
            try {
                const {data} = await axios.get(
                    `http://127.0.0.1:5000/doc/projectname/${projectname}`,
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
                    let recoveredDocId: string | null = null
                    if (currDocInfo.length === 0) {
                        // read documentId from localStorage, if entry exists (especially when there are unsaved changes)
                        recoveredDocId = localStorage.getItem("docId")
                    }
                    let recovered = false
                    for (let i = 0; i < result.length; i++) {
                        let reducedDoc = result[i]
                        let pair: [string, string] = [reducedDoc._id, reducedDoc.name]
                        idNamePairs.push(pair)
                        if (recoveredDocId === reducedDoc._id) {
                            recovered = true
                            setCurrDocInfo(pair)
                            let ops: string | null = localStorage.getItem("ops")
                            if (ops !== null) {
                                try {
                                    opsArr.current = JSON.parse(ops)
                                    setUnsavedChanges(true)
                                } catch (error) {
                                    // handle parsing error (must clear changes => unrecoverable)
                                    clearChanges()
                                }
                            }
                            await selectDocument(reducedDoc._id, opsArr.current)
                        }
                    }
                    idNamePairs.sort((a, b) => a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : 0)
                    setDocumentIdNamePairs(idNamePairs)
                    if (!recovered) {
                        clearChanges()
                        //select document if path is /doc/docname
                        if(docname){
                            const selected = idNamePairs.find(element => element[1] === docname);
                            if (selected) {
                                await selectDocument(selected[0])
                            } else {
                                window.history.replaceState(null, "Coref-App", "/project/" + projectname)
                            }
                        }
                    }
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
        loadDocuments()
        // Create Ctrl+S shortcut for saving files
        // Create Ctrl+F shortcut for opening search
        onkeydown = function(e){
            if(e.ctrlKey && e.keyCode == 'S'.charCodeAt(0)){
                e.preventDefault();
                saveChanges()
            }
            if (e.ctrlKey && e.keyCode == 'F'.charCodeAt(0)){
                e.preventDefault();
                if (value != 2) {
                    setValue(2);
                }
            }
        }
        // TODO: recolor coreferences after text selection is removed
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
                    <h2 style={{textAlign: 'center', marginTop: '10px', marginBottom: '5px'}}>{projectname}</h2>
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
                                        addCoref={addCurrCoref}
                                        deleteCoref={deleteCurrCoref}
                                        hovertoggle={hovertoggle}
                                        setHovertoggle={setHovertoggle}
                                        autoAnnotoggle={autoAnnotoggle}
                                        setAutoAnnotoggle={setAutoAnnoToggle}
                                        unsavedChanges={unsavedChanges}
                                        saveChanges={saveChanges}
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
                                        wordsToHighlight={wordsToHighlight}
                                        unsavedChanges={unsavedChanges}
                                        currDocInfo={currDocInfo}
                                        annotators={annotators}
                                        inputText={inputText}>
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
                                                <Tab icon={<DescriptionIcon />} {...a11yProps(1)} style ={{minWidth: '25%'}}/>
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
                                                sendConfidencesToParent={convertConfidences}
                                                addDocumentInfo={addDocumentInfo}
                                            />


                                        </TabPanel>
                                        <TabPanel value={value} index={1}>
                                            {/* Documents */}
                                            <Documents
                                                sendCorefClusterToParent={sendCorefClustersToMainPage}
                                                sendCorefTextToParent={sendCorefTextToMainPage}
                                                allCorefs={allCorefs}
                                                sendConfidencesToParent={convertConfidences}
                                                onDownloadDocument={onDownloadDocument}
                                                clearCurrentMention={clearCurrentMention}
                                                selectDocument={selectDocument}
                                                currDocInfo={currDocInfo}
                                                addDocumentInfo={addDocumentInfo}
                                                documentsInfo={documentIdNamePairs}
                                                renameDocument={renameDocument}
                                            />
                                        </TabPanel>
                                        <TabPanel value={value} index={2}>
                                            <Search
                                                currDocInfo={currDocInfo}
                                                txt={corefText}
                                                changePage={changePage}
                                                setSentenceToHighlight={setSentenceToHighlight}
                                                setWordsToHighlight = {setWordsToHighlight}
                                                prevText={inputText}
                                                setPrevText={setInputText}>
                                            </Search>
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
