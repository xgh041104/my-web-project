import React, { useState, useEffect, useRef } from 'react';
import HJCTestCaseTable from './TestCaseTable';
import HJCEditor from 'components/HJCEditor';

/**
 * 防抖函数
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function HJCContent({ renderType = "edit", value, onChange }) {
    const [contentValue, setContentValue] = useState({
        originCode: { html: '', css: '' },
        testCase: []
    });
    const [answer, setAnswer] = useState({ html: '', css: '' });
    const [testResults, setTestResults] = useState([]);
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!value) {
            setContentValue({ originCode: { html: '', css: '' }, testCase: [] });
            setAnswer({ html: '', css: '' });
            return;
        }
        setContentValue(value.Options || { originCode: { html: '', css: '' }, testCase: [] });
        setAnswer(JSON.parse(value.Answer) || '');
    }, [value]);

    const handleCodeChange = (value) => {
        setContentValue({ ...contentValue, ...value });
        onChange({ Options: { ...contentValue, ...value }, Answer: JSON.stringify(answer) });
    };

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        debounce(runCode, 100)();
    }, [contentValue.originCode, answer]);

    const handleAnswerChange = (value) => {
        setAnswer(value);
        onChange({ Options: contentValue, Answer: JSON.stringify(value) });
    };


    const runCode = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) {
            console.warn("无法获取 iframe window");
            return;
        }

        const testCases = contentValue.testCase || [];

        const results = testCases.map(test => {
            try {
                // 在 iframe 内执行 validate 函数,防止污染本地环境
                const passed = iframeWindow.eval(test.validate);
                return {
                    description: test.description,
                    passed: passed
                };
            } catch (error) {
                console.error(`测试用例执行失败: ${test.description}`, error);
                return { description: test.description, passed: false };
            }
        });

        setTestResults(results);
    };



    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                <div>
                    <div>预设代码：</div>
                    <HJCEditor value={contentValue.originCode} onChange={(e) => handleCodeChange({ originCode: e })} />
                </div>
                <div>
                    <div>测试用例：</div>
                    <HJCTestCaseTable
                        codeTestCaseList={contentValue.testCase || []}
                        codeTestOnChange={(v) => handleCodeChange({ testCase: v })}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                <div>
                    <div>答案：</div>
                    <HJCEditor value={answer} onChange={(e) => handleAnswerChange(e)} />
                </div>
                <div>
                    <div>预览：</div>
                    <iframe
                        ref={iframeRef}
                        title="preview"
                        sandbox="allow-scripts allow-same-origin"
                        style={{ width: '1000px', height: '500px', border: '1px solid #ddd' }}
                        srcDoc={`${answer.html || ''}<style>${answer.css || ''}</style>`}
                    />
                </div>
            </div>
            <div>
                <h3>测试结果：</h3>
                <ul>
                    {testResults.map((test, index) => (
                        <li key={test.id || index} style={{ color: test.passed ? 'green' : 'red' }}>
                            {test.passed ? '✅' : '❌'} {test.description}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default HJCContent;
