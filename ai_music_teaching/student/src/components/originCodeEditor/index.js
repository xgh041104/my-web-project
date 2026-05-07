import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-tomorrow_night_blue";

function getTheme(language) {
    switch (language) {
        case "python":
            return "monokai";
        case "java":
            return "github";
        case "c_cpp":
            return "tomorrow_night_blue";
        default:
    }
}

const OriginCodeEditor = ({ contentValue, originCode, handleCodeChange, readOnly = false }) => {
    // 确保 originCode 解析为对象
    let newOriginCode = {};
    try {
        newOriginCode = JSON.parse(originCode || "{}");
    } catch (e) {
        console.error("Invalid JSON format in originCode:", e);
    }

    const handleSegmentChange = (key, newValue) => {
        const updatedCode = { ...newOriginCode, [key]: newValue };
        handleCodeChange({ originCode: JSON.stringify(updatedCode) });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "600px" }}>
            {["code1", "code2", "code3"].map((key, index) => (
                <div key={key}>
                    <h2><b>{key !== "code2" ? <p><span style={{ color: "rgb(123 122 122)" }}>预设代码(此处无需填写)</span>:</p> :
                        <p>待填代码<span style={{ color: "red" }}>(在此处填写代码)：</span></p>}</b></h2>
                    <AceEditor
                        mode={contentValue?.language || "python"}
                        theme={getTheme(contentValue?.language) || "monokai"}
                        onChange={(newValue) => handleSegmentChange(key, newValue)}
                        fontSize={14}
                        showPrintMargin
                        showGutter
                        highlightActiveLine
                        value={newOriginCode[key] || ""}
                        width="700px"
                        height="200px"
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true,
                            showLineNumbers: true,
                            tabSize: 3,
                        }}
                        readOnly={readOnly || key !== "code2"}
                    />
                </div>
            ))}
        </div>
    );
};

export default OriginCodeEditor;
