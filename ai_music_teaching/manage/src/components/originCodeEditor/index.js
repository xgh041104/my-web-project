import React from "react";
import AceEditor from "react-ace";
import { message } from "antd";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

/**
 * 
 * @param {Object} contentValue 
 * @param {Function} handleCodeChange
 * @returns {JSX.Element}
 */

const OriginCodeEditor = ({ contentValue, handleCodeChange }) => {
    // 确保 originCode 解析为对象
    let originCode = {};
    try {
        originCode = JSON.parse(contentValue?.originCode || "{}");
    } catch (e) {
        message.error("JSON 解析失败");
    }

    const handleSegmentChange = (key, newValue) => {
        const updatedCode = { ...originCode, [key]: newValue };
        handleCodeChange({ originCode: JSON.stringify(updatedCode) });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "600px" }}>
            {["code1", "code2", "code3"].map((key, index) => (
                <AceEditor
                    key={index}
                    mode={contentValue?.language || "python"}
                    theme="monokai"
                    onChange={(newValue) => handleSegmentChange(key, newValue)}
                    fontSize={14}
                    showPrintMargin
                    showGutter
                    highlightActiveLine
                    value={originCode[key] || ""}
                    width="500px"
                    height="33%"
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 3,
                    }}
                />
            ))}
        </div>
    );
};

export default OriginCodeEditor;
