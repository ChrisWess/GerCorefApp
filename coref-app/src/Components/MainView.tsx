import React, {useEffect} from 'react';
import "./MainView.css"


export type Mention = {
    id: string;
    content: string;
    username?: string;
}

interface MainViewProps {
    txt: any[]
    clust: any[]
    allCorefs: Map<string, Mention>
    setSelectedCoref: Function
}

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               setSelectedCoref }) => {

    useEffect(() => {
        let elems = document.querySelectorAll(".cr");
        elems.forEach(function(value) {
            value.addEventListener("click", () => {
                let mention = allCorefs.get(value.id)
                if (mention) {
                    setSelectedCoref(mention.content)
                }
            }, false)
        });
    }, [txt, clust]);

    console.log(clust[0])
    if(clust[0] === "Nothing")
        return <h1>No Document yet</h1>
    let buffer = []

    //Puts Text in one long Array instead of one array for each sentence.
    for (let i = 0; i < txt.length; i++) {
        for (let j = 0; j < txt[i].length; j++) {
            buffer.push(txt[i][j] as any);
        }
    }
    // TODO: keep copy of this array globally (perhaps change it to an array of array=[w<id>, word])
    //   => wordList in MainPage
    console.log(buffer);

    allCorefs.clear()
    let currentIndexOfCoref = 1;
    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = clust.length-1; i >= 0; i--) {
        currentIndexOfCoref = i+1;
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxStart = clust[i][j][0]
            let mentionIdxEnd = clust[i][j][1]
            let coref = buffer.slice(mentionIdxStart, mentionIdxEnd + 1).join(" ")
            let corefId = `d1c${i}m${j}`
            allCorefs.set(corefId, { id: corefId, content: coref })
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
                `<bb id="w${mentionIdxEnd}">` + buffer[mentionIdxEnd] +
                      `<a id="w${mentionIdxStart}" href="#d1c1m1">]</a><sub id="w${mentionIdxStart}">` +
                    currentIndexOfCoref + "</sub></bb></b>");
            }
        }
    }

    // turn result into one string
    // console.log(buffer);
    let stringAll = "";
    for (let i = 0; i < buffer.length; i++) {
        let token = buffer[i];
        if (token.match(/[.,:!?]/)) {  // check for punctuation
            token = `<bb id='w${i}'>` + token + "</bb>"
        } else if (!token.startsWith("<b id")) {
            // TODO: make a click-event on words to make single words easier to select as annotations
            token = `<bb id='w${i}'> ` + token + "</bb>"
        }
        stringAll += token;
    }
    // console.log(stringAll);

    //render string as html element
    return (
        <div style={{height:720}}>
            <article>
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
