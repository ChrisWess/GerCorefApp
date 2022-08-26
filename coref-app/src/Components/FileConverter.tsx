class FileConverter {


    public convertFile(datatype: string ,name: string, clusts: any, tokens: any) {
        switch (datatype) {
            case "CoNLL-2012":
                this.convertToCoNLL2012(name, clusts, tokens)
                break;
            case "XML":
                this.convertToXML(name, clusts, tokens)
                break;
            default:
                console.log("filetype not supported:" + datatype)
                return
        }
    }

     convertToCoNLL2012(name: string, clusts: any, tokens: any) {
        const fileData = "TODO"
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
