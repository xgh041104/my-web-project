import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Select, Tooltip } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";


function CodingComplete({ value, onChange, renderType = "edit" }) {
    // 保存用户输入的答案
    const [contentValue, setContentValue] = useState({ originCode: '', language: 'python' });
    const [answers, setAnswers] = useState({});


    const getLanguage = () => {
        if (contentValue?.language) {
            return contentValue.language === "c_cpp" ? "c" : contentValue.language;
        }
        return "python";
    };

    useEffect(() => {
        if (value.Options || (value.Options && JSON.stringify(value.Options) !== JSON.stringify(contentValue))) {
            setContentValue(value.Options);
            setAnswers(value.Answer);
        }
    }, [value]);

    const codeContent = useMemo(() => {
        return contentValue.originCode?.split(/({{blank\d+(?::[^}]*)?}})/g)?.map((part, idx) => {
            // 检查是否是填空占位符
            const match = part.match(/{{(blank\d+)(?::([^}]*))?}}/);
            if (match) {
                const key = match[1];  // blank1, blank2...
                const hint = match[2] || "";  // 可能为空

                const inputElement = (
                    <input
                        key={idx}
                        type="text"
                        value={answers[key] || ''}
                        onChange={(e) => handleAnswerChange(e, key)}
                        style={{
                            width: '120px',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: '#fff',
                            fontFamily: 'monospace',
                            fontSize: 'inherit',
                            padding: '0 4px',
                            borderBottom: '2px solid #fff',
                        }}
                    />
                );

                return hint ? (
                    <Tooltip
                        key={idx}
                        title={hint}
                        placement="top"
                        overlayStyle={{
                            backgroundColor: '#fff',
                            color: '#000',
                            fontSize: '16px',
                            padding: '8px',
                            borderRadius: '5px',
                            maxWidth: '200px',
                            textAlign: 'center',
                        }}
                    >
                        {inputElement}
                    </Tooltip>
                ) : inputElement;

            }

            // 代码部分，使用高亮组件
            return (
                <SyntaxHighlighter
                    key={idx}
                    language={getLanguage()}
                    style={tomorrow}
                    customStyle={{ display: 'inline', background: 'none', padding: 0, margin: 0 }}
                    PreTag="span"
                >
                    {part}
                </SyntaxHighlighter>
            );
        });
    }, [contentValue.originCode, answers]);


    // 更新题目内容
    const handleCodeChange = (value) => {
        setContentValue({ ...contentValue, ...value });
        onChange({ Options: { ...contentValue, ...value }, Answer: answers });
    };

    // 更新答案
    const handleAnswerChange = (e, key) => {
        setAnswers({ ...answers, [key]: e.target.value });
        onChange({ Options: contentValue, Answer: { ...answers, [key]: e.target.value } });
    };

    return (<>
        <Row justify={"bottom"}>
            <Col span={4}>选择语言：</Col>
            <Col span={8}>
                <Select disabled={renderType === 'view'} defaultValue={"python"} value={contentValue?.language || "python"} onChange={(value) => handleCodeChange({ language: value })}>
                    <Select.Option value="c_cpp">C</Select.Option>
                    <Select.Option value="java">Java</Select.Option>
                    <Select.Option value="python">Python</Select.Option>
                </Select>
            </Col>
        </Row>
        <br />
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', height: '500px', width: '80vw' }}>
            <AceEditor
                mode={contentValue?.language || "python"}
                theme="monokai"
                onChange={(value) => handleCodeChange({ originCode: value })}
                name="UNIQUE_ID_OF_DIV"
                fontSize={14}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                value={contentValue.originCode || ""}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 3,
                }} />
            <pre style={{
                position: 'relative', background: '#1e1e1e',
                borderRadius: '5px',
                fontFamily: 'Consolas, "Courier New", monospace',
                color: '#d4d4d4',
                overflowX: 'auto'
            }}>
                {codeContent}
            </pre>
        </div >
    </>
    );
}

export default CodingComplete;
