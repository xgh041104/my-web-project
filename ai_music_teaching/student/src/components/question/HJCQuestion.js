import { Button, message, Tag, Spin, Tabs } from 'antd';
import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react'
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


// html+css题组件
// contentValue: 传入的题目内容 {originCode:string, testCode:Array}
// commitResult: 提交结果的回调函数 
function HJCQuestion({ renderType = "edit", contentValue, commitResult }, ref) {

    const [currentCode, setCurrentCode] = useState({ html: '', css: '' });
    const [testResults, setTestResults] = useState([]);

    const iframeRef = useRef(null);

    useImperativeHandle(ref, () => ({
        runCode
    }))

    useEffect(() => {
        if (!contentValue.originCode || !contentValue.testCase) {
            return;
        }
        setCurrentCode(contentValue.originCode);
    }, []);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        debounce(runCode, 100)()
    }, [currentCode]);

    const runCode = () => {
        if (!iframeRef?.current) return
        const iframe = iframeRef.current;
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
        return results
    };


    const handleCodeChange = (code) => {
        commitResult(JSON.stringify(code));
        setCurrentCode(code);
    };

    const resetCode = () => {
        setCurrentCode(contentValue.originCode);
        commitResult(JSON.stringify(contentValue.originCode));
    }
    return <div>
        <div style={{ display: renderType !== 'edit' ? 'none' : 'flex', flexDirection: 'row', gap: '20px' }}>
            <HJCEditor value={currentCode} onChange={handleCodeChange} />
            <div>
                <Button onClick={resetCode}>重置代码</Button>
                <iframe
                    ref={iframeRef}
                    title="preview"
                    sandbox="allow-scripts allow-same-origin"
                    style={{ width: '500px', height: '550px', border: '1px solid #ddd' }}
                    srcDoc={`${currentCode.html || ''}<style>${currentCode.css || ''}</style>`}
                />
            </div>
        </div>
        <div style={{ display: renderType !== 'edit' ? 'none' : 'block' }}>
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
}

export default forwardRef(HJCQuestion);