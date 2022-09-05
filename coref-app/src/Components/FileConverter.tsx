class FileConverter {


    //todo: needs to ignore autoannotaded corefs when the toggle is off
    public convertFile(datatype: string ,name: string, clusts: any, tokens: any) {
        switch (datatype) {
            case "CoNLL-2012":
                this.convertToCoNLL2012(name, clusts, tokens)
                break;
            case "XML":
                this.convertToXML(name, clusts, tokens)
                break;
            case "plaintext":
                this.convertToPlaintext(name, clusts, tokens)
                break;
            default:
                console.log("filetype not supported:" + datatype)
                return
        }
    }

    convertToPlaintext(name: string, clusts: any, tokens: any) {
        let fileData = ""
        for (let i = 0; i < tokens.length; i++) {
            for (let j = 0; j < tokens[i].length; j++) {
                j === tokens[i].length -2 ?  fileData += tokens[i][j] : fileData += tokens[i][j]+ " "
            }
        }
        const blob = new Blob([fileData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = name+".txt";
        link.href = url;
        link.click();
    }

     convertToCoNLL2012(name: string, clusts: any, tokens: any) {

        //get amount of tokens
         let count = 0
         for (let i = 0; i < tokens.length; i++) {
             for (let j = 0; j < tokens[i].length; j++) {
                count++;
             }
         }

        let fileData = "#begin document ("+name+"); part 000\n";
         const arr = new Array(count).fill("-");

         for (let i = 0; i < clusts.length; i++) {
             for (let j = 0; j < clusts[i].length; j++) {
                 let x = ""
                 let y = null
                 clusts[i][j][0] === clusts[i][j][1] ? x = "("+(i+1)+")": (x = "("+(i+1), y = (i+1)+")")
                 arr[clusts[i][j][0]] === "-" ? arr[clusts[i][j][0]] = x : arr[clusts[i][j][0]]+= "|" + x
                 if(y){
                     arr[clusts[i][j][1]] === "-" ? arr[clusts[i][j][1]] = y : arr[clusts[i][j][1]]+= "|" + y
                 }
             }
         }
         
         count = 0
         for (let i = 0; i < tokens.length; i++) {
             for (let j = 0; j < tokens[i].length; j++) {
                 fileData += name+"\t0\t"+j+"\t"+ tokens[i][j] +"\t\t-\t-\t-\t-\t-\t-\t*\t"+arr[count]+"\n"
                 count++
             }
             fileData += "\n"
         }

         fileData += "#end document\n"

        const blob = new Blob([fileData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = name+".conll";
        link.href = url;
        link.click();
    }

    convertToXML(name: string, clusts: any, tokens: any) {
        const fileData = "TODO"
        const blob = new Blob([fileData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = name+".xml";
        link.href = url;
        link.click();
    }

}
export default FileConverter;
