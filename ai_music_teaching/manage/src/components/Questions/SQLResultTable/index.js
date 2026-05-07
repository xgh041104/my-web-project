import React from 'react';
/**
 * 
 * @param {error: string, columns: Array, queryResult: Array} props
 * @returns {JSX.Element}
 */
const SQLResultTable = ({ error, columns, queryResult }) => {
    return (
        <div>
            {error ? (
                <div style={{ color: 'red' }}>
                    <strong>错误:</strong> {error}
                </div>
            ) : (
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {queryResult.map((row, index) => (
                                <tr key={index}>
                                    {row.map((value, idx) => (
                                        <td key={idx}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SQLResultTable;
