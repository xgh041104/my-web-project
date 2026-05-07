const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const docxPath = path.join(__dirname, "../../../../../中小学音乐试卷AB卷.docx");

mammoth.extractRawText({path: docxPath})
    .then(function(result) {
        const text = result.value; // The raw text
        console.log("--- TEXT START ---");
        console.log(text);
        console.log("--- TEXT END ---");
    })
    .done();
