import React, { useState, useEffect, useRef, useCallback } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { Tabs } from "antd";

const HJCEditor = ({ value, onChange }) => {
    const [status, setStatus] = useState('html');


    const handleOnChange = (v) => {
        onChange({ ...value, [status]: v });
    };

    return (
        <div>
            <Tabs
                activeKey={status}
                onChange={(key) => setStatus(key)}
                items={[
                    { key: 'html', label: 'HTML' },
                    { key: 'css', label: 'CSS' },
                ]}
            />
            <AceEditor
                mode={status}
                theme="monokai"
                name="ace-editor-html-origin"
                fontSize={14}
                showPrintMargin={false}
                showGutter={false}
                value={value[status] || ''}
                onChange={handleOnChange}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 3,
                }}
            />
        </div>
    );
};

export default HJCEditor;