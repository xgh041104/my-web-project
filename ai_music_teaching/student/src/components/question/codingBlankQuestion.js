import { Button, message, Tag, Tooltip } from 'antd';
import React, { useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';


// 编程题组件
// contentValue: 传入的题目内容 {language:string, originCode:string}
// commitResult: 提交结果的回调函数 
function CodingBlankQuestion({ renderType = "edit", contentValue, commitResult }, ref) {

    const [answers, setAnswers] = useState({});


    useImperativeHandle(ref, () => ({
        runCode
    }))

    const getLanguage = () => {
        if (contentValue?.language) {
            return contentValue.language === "c_cpp" ? "c" : contentValue.language;
        }
        return "python";
    }

    const runCode = async () => {
        if (!answers || answers.trim() === "" || answers.trim() === contentValue.originCode.trim()) {
            message.error("请输入代码");
            return;
        }
        return answers;
    };

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

    const handleAnswerChange = (e, key) => {
        const newAnswers = { ...answers, [key]: e.target.value };
        commitResult(newAnswers);
        setAnswers(newAnswers);
    };

    return <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
        <div>
            <div>当前语言: <Tag color="#108ee9">{getLanguage()}</Tag></div>
            <br />
            <div style={{ display: renderType !== 'edit' ? 'none' : 'block' }}>
                <div>代码块：</div>
                <pre style={{
                    position: 'relative', background: '#1e1e1e', // VSCode 背景色
                    borderRadius: '5px',
                    fontFamily: 'Consolas, "Courier New", monospace', // VSCode 字体
                    color: '#d4d4d4', // VSCode 默认字体颜色
                    overflowX: 'auto'
                }}>
                    {codeContent}
                </pre>
            </div>
            <div>
            </div>
        </div>
        <div>
        </div>
    </div>
}

export default forwardRef(CodingBlankQuestion);