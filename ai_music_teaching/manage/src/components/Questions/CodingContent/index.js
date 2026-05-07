import React, { useEffect, useState } from 'react';
import { Button, Row, Select, Col, Spin } from 'antd';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import OriginCodeEditor from 'components/originCodeEditor';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

import { useDispatch } from 'dva';
import CodeEditorWithTestCases from './CodeEditorTestCase';

/*
#include<stdio.h>

int main(){
  print("hello world!");
  return 0
}

def sum_array(n):
    total = 0  # 初始化累加的总和
    for num in n:
        total += num  # 累加数组中的每个元素
    return total  # 返回累加结果

出题->显示题目->学生答题->提交代码->验证代码编译正确性->验证代码运行正确性->评判代码得分->返回结果
                                ->显示代码编译结果   ->显示代码运行结果  ->显示代码得分

出题->显示题目->学生提交代码->验证代码编译运行结果->评判代码得分->返回结果
*/


function CodingContent({ value, onChange, viewType = 'edit' }) {
    const [contentValue, setContentValue] = useState({ originCode: "", testCode: "", language: "python" });//选项数据
    const [answer, setAnswer] = useState("");//答案
    const [codeResult, setCodeResult] = useState([]);//代码运行结果
    const [loading, setLoading] = useState(false);

    let dispatch = null; // 只有编辑模式才能调用useDispatch
    if (viewType === 'edit') {
        dispatch = useDispatch();
    }
    const codeTestOnChange = (value) => {
        handleCodeChange({ testCode: value });
    }

    useEffect(() => {
        if (value.Options || (value.Options && JSON.stringify(value.Options) !== JSON.stringify(contentValue))) {
            setContentValue(value.Options);
            setAnswer(value.Answer);
        }
    }, [value]);


    const getLanguage = () => {
        if (contentValue?.language) {
            return contentValue.language === "c_cpp" ? "c" : contentValue.language;
        }
        return "python";
    }

    const runCode = async () => {
        const testCases = contentValue?.testCode.map((item) => item.codeTestContent);
        const expectedOutputs = contentValue?.testCode.map((item) => item.output);

        // 初始化结果，显示“运行中...”
        const initialResults = testCases.map((_, index) => ({
            caseNumber: `Case ${index + 1}`,
            input: testCases[index],
            result: "运行中...",
            expectedOutput: expectedOutputs[index],
            isCorrect: null,
        }));

        setCodeResult(initialResults);

        const results = await Promise.all(
            testCases.map((test, index) =>
                new Promise((resolve) => {
                    dispatch({
                        type: "questionManage/runCode",
                        payload: { code: `${answer}\n${test}`, language: getLanguage() },
                        callback: (result) => {
                            const output = (result.output || result.error).replace(/\n/g, '');
                            const isCorrect = output === expectedOutputs[index];

                            setCodeResult((prevResults) =>
                                prevResults.map((res, i) =>
                                    i === index
                                        ? { ...res, result: output, isCorrect }
                                        : res
                                )
                            );

                            resolve({ ...initialResults[index], result: output, isCorrect });
                        },
                    });
                })
            )
        );
        setCodeResult(results);
        return results;
    };


    function handleCodeChange(value) {
        setContentValue({ ...contentValue, ...value });
        onChange?.({ Options: { ...contentValue, ...value }, Answer: answer });
    }

    function handleAnswerChange(value) {
        setAnswer(value);
        onChange?.({ Options: contentValue, Answer: value });
    }

    return <>
        <Row justify={"bottom"}>
            <Col span={4}>选择语言：</Col>
            <Col span={8}>
                <Select disabled={viewType === 'view'} defaultValue={"python"} value={contentValue?.language || "python"} onChange={value => handleCodeChange({ language: value })}>
                    <Select.Option value="c_cpp">C</Select.Option>
                    <Select.Option value="java">Java</Select.Option>
                    <Select.Option value="python">Python</Select.Option>
                </Select>
            </Col>
        </Row>
        <br />
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <div>
                <div>{viewType === 'edit' && "设置"}预设代码：</div>
                <OriginCodeEditor handleCodeChange={handleCodeChange} contentValue={contentValue} />
            </div>
            <div style={{ display: viewType === 'view' ? 'none' : 'block', width: '900px' }}>
                <div>测试用例代码：</div>
                <CodeEditorWithTestCases language={contentValue?.language || "python"} codeTestOnChange={codeTestOnChange} codeTestCaseList={contentValue?.testCode || []} />
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <div style={{ display: viewType === 'view' ? 'none' : 'block' }}>
                <div>设置完整代码(答案)：</div>
                <AceEditor
                    mode={contentValue?.language || "python"}
                    theme="monokai"
                    name="UNIQUE_ID_OF_DIV"
                    onChange={(newValue) => handleAnswerChange(newValue)}
                    fontSize={14}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    value={answer || ""}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 3,
                    }} />
            </div>
            <div style={{ display: viewType === 'view' ? 'none' : 'block',minWidth: '400px' }}>
                <Button onClick={runCode} loading={loading} style={{ marginTop: 20, marginBottom: 20 }}>运行代码</Button>
                {codeResult && Array.isArray(codeResult) && (
                    <div>
                        <p>运行结果：</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                                    <th style={{ width: '100px', padding: '8px' }}>测试用例</th>
                                    <th style={{ padding: '8px' }}>输出</th>
                                    <th style={{ padding: '8px' }}>预期输出</th>
                                    <th style={{ width: '80px', padding: '8px' }}>结果</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codeResult.map((res, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>{res.caseNumber}</td>
                                        <td style={{ padding: '8px', wordBreak: 'break-word' }}>
                                            {res.result === "运行中..." ? <Spin size="small" /> : res.result}
                                        </td>
                                        <td style={{ padding: '8px', wordBreak: 'break-word' }}>{res.expectedOutput}</td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            {res.isCorrect === null ? null : res.isCorrect ? (
                                                <CheckCircleOutlined style={{ color: 'green' }} />
                                            ) : (
                                                <CloseCircleOutlined style={{ color: 'red' }} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    </>
}

export default CodingContent