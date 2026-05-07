import React, { useState, useEffect } from 'react';

/**
 * 
 * @param {Object} answers 答案
 * @param {Object} setupAnswers 用户输入答案 
 * @returns 
 */
const ObjectComparison = ({ answers, setupAnswers }) => {
    const [comparisonResults, setComparisonResults] = useState([]);

    useEffect(() => {
        const results = [];

        // 判断是否有一个对象为空
        const isAnswersEmpty = Object.keys(answers).length === 0;
        const isSetupAnswersEmpty = Object.keys(setupAnswers).length === 0;

        if (isAnswersEmpty || isSetupAnswersEmpty) {
            // 只渲染非空的对象
            const nonEmptyObject = isAnswersEmpty ? setupAnswers : answers;
            Object.keys(nonEmptyObject).forEach((key) => {
                results.push({
                    key,
                    value1: nonEmptyObject[key]?.trim() || '',
                    value2: '', // 另一个对象为空
                    result: null, // 不进行对比
                });
            });
        } else {
            // 正常比较两个对象
            const allKeys = new Set([...Object.keys(answers), ...Object.keys(setupAnswers)]);
            allKeys.forEach((key) => {
                const value1 = answers[key]?.trim() || '';
                const value2 = setupAnswers[key]?.trim() || '';
                results.push({
                    key,
                    value1,
                    value2,
                    result: value1 === value2,
                });
            });
        }

        setComparisonResults(results);
    }, [answers, setupAnswers]);

    return (
        <div>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>序号</th>
                        <th style={styles.th}>答案</th>
                        <th style={styles.th}>输入结果</th>
                        <th style={styles.th}>结果</th>
                    </tr>
                </thead>
                <tbody>
                    {comparisonResults.map((item, index) => (
                        <tr key={index} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                            <td style={styles.td}>{index + 1}</td>
                            <td style={styles.td}>{item.value1}</td>
                            <td style={styles.td}>{item.value2}</td>
                            <td style={styles.resultTd}>
                                {item.result === null ? '-' : item.result ? '✔️' : '❌'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 样式对象
const styles = {
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        marginTop: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#2E2E2E', // 深灰色背景
        color: '#E0E0E0', // 亮灰色字体
    },
    th: {
        padding: '14px',
        textAlign: 'left',
        borderBottom: '2px solid #555',
        backgroundColor: '#3A3A3A', // 深一点的灰色
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: '16px',
    },
    td: {
        padding: '12px',
        textAlign: 'left',
        borderBottom: '1px solid #444',
        fontSize: '15px',
        fontFamily: "'Courier New', monospace",
        color: '#D3D3D3', // 亮一点的灰色
    },
    evenRow: {
        backgroundColor: '#383838', // 深灰色
    },
    oddRow: {
        backgroundColor: '#2E2E2E', // 略浅一点的灰色
    },
    resultTd: {
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
    },
};

export default ObjectComparison;
