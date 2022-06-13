import React, {useEffect} from 'react';
import "./MainView.css"


interface MainViewProps {
    txt: any[]
    clust: any[]
    allCorefs: Map<string, string>
    setSelectedCoref: Function
}

const MainView: React.FC<MainViewProps> = ({ txt, clust, allCorefs,
                                               setSelectedCoref }) => {

    useEffect(() => {
        let elems = document.querySelectorAll(".cr");
        elems.forEach(function(value) {
            value.addEventListener("click", () => setSelectedCoref(allCorefs.get(value.id)), false)
        });
    }, [txt, clust]);

    console.log(clust[0])
    if(clust[0] === "Nothing")
        return <h1>No Document yet</h1>
    let buffer = []

    //Puts Text in one long Array instead of one array for each sentence.
    for (let i = 0; i < txt.length; i++) {
        for (let j = 0; j < txt[i].length; j++) {
            buffer.push( (" " + txt[i][j]) as any);
        }
    }

    allCorefs.clear()
    let currentIndexOfCoref = 1;
    //for each coref cluster it puts an html element in front of its first word and behind its last word
    //from big to small seems to handle overlapping corefs better
    for (let i = clust.length-1; i >= 0; i--) {
        currentIndexOfCoref = i+1;
        for (let j = 0; j < clust[i].length; j++) {
            let mentionIdxStart = clust[i][j][0]
            let mentionIdxEnd = clust[i][j][1]
            let corefStart = buffer[mentionIdxStart].substring(1)
            let coref = buffer.slice(mentionIdxStart, mentionIdxEnd + 1).join("")
            let corefId = `d1c${i}m${j}`
            allCorefs.set(corefId, coref)
            buffer.splice(mentionIdxStart, 1,
                " <b id=\"" + corefId + "\" class=\"cr cr-" +
                currentIndexOfCoref + "\"><a href=\"#d1c1m1\">[</a>" + corefStart);
            console.log(coref)
            buffer.splice(mentionIdxEnd, 1,
                buffer[mentionIdxEnd]+"<a href=\"#d1c1m1\">]</a><sub>"+currentIndexOfCoref+"</sub></b>");
        }
    }

    // turn result into one string
    console.log(buffer);
    let stringAll = "";
    for (let i = 0; i < buffer.length; i++) {
        let token = buffer[i];
        if (token.length === 2 && token[0] === " ") {  // TODO: Actual check for punctuation
            token = token.substring(1)
        }
        stringAll += token;
    }
    console.log(stringAll);

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
