import React, {MutableRefObject, useEffect} from 'react';
import "./MainView.css"


export type Mention = {
    id: string;
    content: string;
    selectionRange: number[]
    username?: string;
}

interface MainViewProps {
    txt: any[]
    clust: any[]
    allCorefsMapped: MutableRefObject<Map<string, Mention>>
    allCorefs: MutableRefObject<Mention[][]>
    wordArr: MutableRefObject<string[]>
    wordFlags: MutableRefObject<boolean[]>
    markedWord: MutableRefObject<number[]>
    setSelectedCoref: Function
    setClusterColor: Function
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

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefsMapped, allCorefs,
                                               wordArr, wordFlags,
                                               markedWord, setSelectedCoref, setClusterColor }) => {

    const getStyle = function(element: any, property: string) {
        return window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(property) :
            element.style[property.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })];
    };

    useEffect(() => {
        let elems = document.querySelectorAll("b.cr");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                clearPrevMarking(markedWord.current)
                markedWord.current = []
                let mention: Mention | undefined = allCorefsMapped.current.get(value.id);
                if (mention) {
                    setSelectedCoref(mention.selectionRange)
                    setClusterColor(getStyle(value, "background-color"))
                    allCorefsMapped.current.set("current", mention)
                }
            }, false)
        });
        elems = document.querySelectorAll("bb.wregular");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                clearPrevMarking(markedWord.current)
                markedWord.current = []
                let wid = parseInt(value.id.substring(1))
                setSelectedCoref([wid, wid + 1])
                // @ts-ignore
                value.style.backgroundColor = "yellow";
                setClusterColor("yellow")
                markedWord.current = [wid]
            }, false)
        });
    }, [txt, clust]);

    console.log(clust[0])
    if(clust[0] === "Nothing")
        return <h1>No Document yet</h1>
    wordArr.current = []
    wordFlags.current = []
    let buffer = []

    //Puts Text in one long Array instead of one array for each sentence.
    for (let i = 0; i < txt.length; i++) {
        for (let j = 0; j < txt[i].length; j++) {
            buffer.push(txt[i][j] as string);
            wordArr.current.push(txt[i][j])
            wordFlags.current.push(true)
        }
    }
    console.log(buffer);

    allCorefs.current = []
    allCorefsMapped.current.clear()
    let currentIndexOfCoref = 1;
    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = clust.length-1; i >= 0; i--) {
        let cluster: Mention[] = []
        currentIndexOfCoref = i+1;
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxStart = clust[i][j][0]
            let mentionIdxEnd = clust[i][j][1]
            let coref = buffer.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
            let corefId = `d1c${i}m${j}`
            let mention: Mention = { id: corefId, content: coref, selectionRange: [mentionIdxStart, mentionIdxEnd + 1] }
            allCorefsMapped.current.set(corefId, mention)
            cluster.push(mention)
            // TODO: make mouseover event that shows a small prompt with information at the mouse pointer
            if (mentionIdxStart === mentionIdxEnd) {
                buffer.splice(mentionIdxStart, 1,
                "<b id=\"" + corefId + "\" class=\"cr cr-" + currentIndexOfCoref +
                      `"><bb id="w${mentionIdxStart}"> <a id="w${mentionIdxStart}" href="#d1c1m1">[</a>` +
                    buffer[mentionIdxStart] + `<a id="w${mentionIdxStart}" href="#d1c1m1">]</a><sub id="w${mentionIdxStart}">` +
                    currentIndexOfCoref + "</sub></bb></b>");
            } else {
                buffer.splice(mentionIdxStart, 1,
                "<b id=\"" + corefId + "\" class=\"cr cr-" + currentIndexOfCoref +
                       `"><bb id="w${mentionIdxStart}"> <a id="w${mentionIdxStart}" href="#d1c1m1">[</a>` +
                    buffer[mentionIdxStart] + "</bb>");
                buffer.splice(mentionIdxEnd, 1,
                `<bb id="w${mentionIdxEnd}"> ` + buffer[mentionIdxEnd] +
                      `<a id="w${mentionIdxStart}" href="#d1c1m1">]</a><sub id="w${mentionIdxStart}">` +
                    currentIndexOfCoref + "</sub></bb></b>");
            }
        }
        allCorefs.current.push(cluster)
    }
    allCorefs.current = allCorefs.current.reverse()

    // turn result into one string
    // console.log(buffer);
    let stringAll = "";
    let corefFlag: boolean = false
    for (let i = 0; i < buffer.length; i++) {
        let token = buffer[i];
        if (token.match(/[.,:!?]/)) {  // check for punctuation
            token = `<bb id='w${i}'>` + token + "</bb>"
            wordFlags.current[i] = false
        } else if (token.startsWith("<b id")) {
            if (!token.endsWith("</b>")) {
                corefFlag = true
            }
        } else if (token.endsWith("</b>")) {
            corefFlag = false
        } else if (corefFlag) {
            token = `<bb id='w${i}'> ` + token + "</bb>"
        } else {
            token = `<bb id='w${i}' class="wregular"> ` + token + "</bb>"
        }
        stringAll += token;
    }
    // console.log(stringAll);

    //render string as html element
    return (
        <div style={{height:720}}>
            <article id="docView">
                <div dangerouslySetInnerHTML={{ __html:  stringAll}}/>
            </article>
        </div>
    );

    /* //old  function
    function showCorefs(a: any[], b: any[]){
        let allElements = []
        let buffer = []
        let currentEdge = 0;
        let offset = 0;

        //Puts Text in one long Array instead of one array for each sentence.
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[i].length; j++) {
                allElements.push(a[i][j]);
                buffer.push( (a[i][j]+" ") as any);
            }
        }
        //finds coref-clusters and splices the buffer to insert the span and replace the normal string.
        for (let i = 0; i < b.length; i++) {
            for (let j = 0; j < b[i].length; j++) {
                //buffer.push(<span style={divStyle}>{allElements.slice(b[i][j][0], b[i][j][1]+1)}</span>);
                buffer.splice(b[i][j][0]-offset, b[i][j][1]-b[i][j][0]+1, <span style={divStyle}>{allElements.slice(b[i][j][0], b[i][j][1]+1)} </span>);
                offset += b[i][j][1]-b[i][j][0];
                console.log(offset)
            }
        }
        console.log(buffer);


        return (
            <>
                <p>{buffer}</p>
            </>
        );
    }
     */


    //this.showCorefs = this.showCorefs.bind(this);
    //const [texres, setTexres] = useState("");
}

export default MainView;
