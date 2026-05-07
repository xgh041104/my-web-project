import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react'
import { Button, message, Spin } from 'antd';
import AceEditor from "react-ace";
import initSqlJs from "sql.js";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { baseUrl } from 'urlList';
import SQLResultTable from 'components/SQLResultTable';
import './sqlContent.css'
import { set } from 'nprogress';

/**
 * sql答题组件
 * @param {{ renderType: String, contentValue: Object, commitResult: Function, answer: String }} props
 * @param {{ judgeSQL: Function }} ref 
 * @returns {JSX.Element}
 */
function SqlQuestion({ renderType = "edit", contentValue, commitResult, answer, state = "training" }, ref) {
    const [currentSql, setCurrentSql] = useState(null);
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState(null);
    const [serverDb, setServerDb] = useState(null);
    const [queryResult, setQueryResult] = useState([]); // 查询结果
    const [columns, setColumns] = useState([]); // 表头字段信息
    const [error, setError] = useState(""); // 错误信息
    const [expectedColumns, setExpectedColumns] = useState([]);
    const [expectedResult, setExpectedResult] = useState([]);

    useEffect(() => {
        const loadDatabase = async () => {
            const SQL = await initSqlJs({
                locateFile: () => `${baseUrl}/sql/sql-wasm.wasm`
            });
            const database = new SQL.Database();
            const serverDatabase = new SQL.Database();
            setDb(database);
            setServerDb(serverDatabase);
        };
        loadDatabase();
        return () => {
            if (db) {
                db.close();
            }
            if (serverDb) {
                serverDb.close();
            }
        };
    }, [contentValue?.originSql]);

    useImperativeHandle(ref, () => ({
        judgeSQL
    }));

    /**
     * 修改sql和外部的answer
     * @param {string} value 
     */
    const handleSqlChange = (value) => {
        setCurrentSql(value);
        commitResult(value);
    };

    // const runQuery = (sql, onErr) => {
    //     if (!db) return;
    //     setLoading(true);
    //     resetDatabase();
    //     setError("");
    //     try {
    //         const res = db.exec(sql);
    //         message.success("运行成功")
    //         return res.length > 0 ? res[0] : { columns: [], values: [] };
    //     } catch (error) {
    //         onErr(error);
    //     }
    //     finally {
    //         setLoading(false);
    //     }
    // };

    /**
     * 判断SQL语句是否正确
     * @returns {Promise<boolean>}true 则表示正确
     */
    async function judgeSQL() {
        const userSQL = currentSql;
        try {
            if (!db) return false;

            resetDatabase();  // 重置用户数据库
            resetServerDatabase();  // 重置预期数据库

            let userQueryAllDataSQL = `${userSQL};${contentValue.selectSql || ''}`
            let expectedQueryAllDataSQL = `${answer};${contentValue.selectSql || ''}`

            const userFullTableResult = db.exec(userQueryAllDataSQL);
            const expectedFullTableResult = serverDb.exec(expectedQueryAllDataSQL);

            // 更新显示结果
            setQueryResult(userFullTableResult[0]?.values || []);
            setColumns(userFullTableResult[0]?.columns || []);
            setExpectedResult(expectedFullTableResult[0]?.values || []);
            setExpectedColumns(expectedFullTableResult[0]?.columns || []);

            // 比对结果
            return compareResults(
                JSON.parse(JSON.stringify(userFullTableResult)),
                JSON.parse(JSON.stringify(expectedFullTableResult))
            );

        } catch (error) {
            console.error("SQL 执行错误:", error);
            return false;
        }
    }

    /**
     * 判断两个数组是否是一样的，忽略顺序
     * @param {Array} result1 数组1
     * @param {Array} result2 数组2
     * @returns {boolean}
     */
    function compareResults(result1, result2) {
        if (result1.length === 0 && result2.length === 0) return true;
        if (result1.length !== result2.length) return false;

        const formatResult = (result) =>
            result[0].values.map((row) => JSON.stringify(row.sort()));

        const res1 = formatResult(result1);
        const res2 = formatResult(result2);

        return (
            res1.length === res2.length &&
            res1.every((row) => res2.includes(row)) &&
            res2.every((row) => res1.includes(row))
        );
    }
    /**
     * 
     * @param {Object} db 数据库实例
     */
    const clearDatabase = (db) => {
        if (db) {
            try {
                const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
                if (tables.length > 0) {
                    const tableNames = tables[0].values.map(row => row[0]);
                    tableNames.forEach(tableName => {
                        if (tableName !== "sqlite_sequence") {
                            db.run(`DROP TABLE IF EXISTS ${tableName};`);
                        }
                    });
                    setQueryResult([]);
                    setColumns([]);
                }
            } catch (err) {
                setQueryResult([]);
                setColumns([]);
                setError("SQL语法错误: " + err.message); // 设置错误信息
                message.error("SQL语法错误: " + err.message);
            }
        }
    };

    /**
     * 重置数据库
     * @param {boolean} ismsg 是否显示消息
     */
    const resetDatabase = (ismsg) => {
        if (db) {
            clearDatabase(db);
            db.run(contentValue.originSql);
            ismsg && message.success("重置成功");
        }
    };

    /**
     * 重置服务器数据库
     */
    const resetServerDatabase = () => {
        if (serverDb) {
            clearDatabase(serverDb);
            serverDb.run(contentValue.originSql);
            setExpectedColumns([]);
            setExpectedResult([]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <div style={{ display: renderType !== 'edit' ? 'none' : 'block' }}>
                <div>代码块：</div>
                <AceEditor
                    mode="mysql"
                    theme="monokai"
                    name="UNIQUE_ID_OF_DIV"
                    onChange={(newValue) => handleSqlChange(newValue)}
                    fontSize={14}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    value={currentSql || ""}
                    style={{ width: '40vw' }}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 3,
                    }} />
            </div>
            <div>
                <div style={{ minWidth: '400px', display: renderType !== 'edit' ? 'none' : 'flex' }}>
                    <Button onClick={judgeSQL}
                        loading={loading} style={{ marginLeft: 10, display: state === 'exam' ? 'none' : 'block' }}>运行代码</Button>
                    <Button onClick={() => {
                        resetDatabase(true);
                    }} style={{ marginLeft: 10 }}>
                        重置数据库
                    </Button>
                </div>
                <div>
                    {columns.length > 0 &&
                        <><div>运行结果:</div>
                            <SQLResultTable error={error} columns={columns} queryResult={queryResult} />
                        </>
                    }
                    {expectedColumns.length > 0 && <>
                        <div>预期结果:</div>
                        <SQLResultTable columns={expectedColumns} queryResult={expectedResult} />
                    </>}
                </div>
            </div>
        </div>
    );
}

export default forwardRef(SqlQuestion);
