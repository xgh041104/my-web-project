import React, { useEffect, useState } from 'react';
import { Button, Spin, message } from 'antd';
import AceEditor from "react-ace";
import initSqlJs from "sql.js";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { baseUrl } from 'urlList';
import './sqlContent.css'
import SQLResultTable from '../SQLResultTable';
/*预设sql
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    salary INTEGER NOT NULL,
    hire_date TEXT NOT NULL
);

INSERT INTO employees (name, position, salary, hire_date) VALUES
('Alice', 'Manager', 70000, '2021-05-01'),
('Bob', 'Developer', 60000, '2022-01-15'),
('Charlie', 'Designer', 50000, '2023-03-23'),
('David', 'Developer', 62000, '2020-11-30'),
('Eve', 'Tester', 48000, '2022-08-19');
*/

/*答案
select * from employees
*/
function SQLContent({ value, onChange, viewType = 'edit' }) {
    const [contentValue, setContentValue] = useState({ originSql: "", selectSql: "" });
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState(null); // SQLite 数据库实例
    const [queryResult, setQueryResult] = useState([]); // 查询结果
    const [columns, setColumns] = useState([]); // 表头字段信息
    const [error, setError] = useState(""); // 错误信息

    useEffect(() => {
        const loadDatabase = async () => {
            const SQL = await initSqlJs({
                locateFile: () => `${baseUrl}/sql/sql-wasm.wasm`
            });
            const database = new SQL.Database();
            setDb(database);
        };
        loadDatabase();
    }, []);

    useEffect(() => {
        if (value.Options || (value.Options && JSON.stringify(value.Options) !== JSON.stringify(contentValue))) {
            setContentValue(value.Options);
            setAnswer(value.Answer);
        }
    }, [value]);

    function handleSqlChange(value) {
        setContentValue({ ...contentValue, ...value });
        onChange({ Options: { ...contentValue, ...value }, Answer: answer });
    }

    function handleAnswerChange(value) {
        setAnswer(value);
        onChange({ Options: contentValue, Answer: value });
    }

    const runQuery = () => {
        if (!db) return;
        setLoading(true);
        setError("");
        try {
            const res = db.exec(answer + ";" + contentValue.selectSql);
            if (res.length > 0) {
                setColumns(res[0].columns);
                setQueryResult(res[0].values);
            } else {
                setQueryResult([]);
                setColumns([]);
            }
            message.success("运行成功")
        } catch (error) {
            setQueryResult([]);
            setColumns([]);
            setError("SQL语法错误: " + error.message);
            message.error("SQL语法错误: " + error.message)
        }
        setLoading(false);
    };

    const runPresetQuery = () => {
        if (!db) return;
        setLoading(true);
        setError("");
        try {
            const res = db.exec(contentValue.originSql);
            if (res.length > 0) {
                setColumns(res[0].columns);
                setQueryResult(res[0].values);
            } else {
                setQueryResult([]);
                setColumns([]);
            }
            message.success("运行成功")
        } catch (error) {
            setQueryResult([]);
            setColumns([]);
            setError("SQL语法错误: " + error.message); // 设置错误信息
            message.error("SQL语法错误: " + error.message)
        }
        setLoading(false);
    };

    const clearDatabase = () => {
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
                    message.success("清空成功")
                }
            } catch (err) {
                setQueryResult([]);
                setColumns([]);
                setError("SQL语法错误: " + err.message); // 设置错误信息
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <div>
                <div>{viewType === 'edit' && "设置"}预设SQL语句：</div>
                <AceEditor
                    mode="mysql"
                    theme="monokai"
                    name="UNIQUE_ID_OF_DIV"
                    onChange={(newValue) => handleSqlChange({ originSql: newValue })}
                    fontSize={14}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    value={contentValue?.originSql || ""}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 3,
                    }} />
            </div>
            <div style={{ display: viewType === 'view' ? 'none' : 'block' }}>
                <div>设置答案：</div>
                <AceEditor
                    mode="mysql"
                    theme="monokai"
                    name="UNIQUE_ID_OF_DIV"
                    onChange={(newValue) => handleAnswerChange(newValue)}
                    fontSize={14}
                    showPrintMargin={true}
                    showGutter={true}
                    height='40%'
                    highlightActiveLine={true}
                    value={answer || ""}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 3,
                    }} />
                <div>检索结果:</div>
                <AceEditor
                    mode="mysql"
                    theme="monokai"
                    name="UNIQUE"
                    onChange={(newValue) => handleSqlChange({ selectSql: newValue })}
                    fontSize={14}
                    showPrintMargin={true}
                    showGutter={true}
                    height='40%'
                    highlightActiveLine={true}
                    value={contentValue?.selectSql || ""}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                        tabSize: 3,
                    }} />
            </div>
            <div style={{ display: viewType === 'view' ? 'none' : 'block', minWidth: '400px' }}>
                <Button onClick={() => runPresetQuery()} style={{ marginLeft: 10 }}>运行预设 SQL</Button>
                <Button onClick={runQuery} loading={loading} style={{ marginLeft: 10 }}>运行代码</Button>
                <Button onClick={clearDatabase} style={{ marginLeft: 10 }}>
                    清空数据库
                </Button>
                <div>运行结果:</div>
                <SQLResultTable columns={columns} queryResult ={queryResult} error={error} />
            </div>
        </div>
    );
}

export default SQLContent;