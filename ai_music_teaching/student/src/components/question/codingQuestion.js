import { Button, message, Tag, Spin, Tooltip } from 'antd';
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useDispatch } from '@umijs/max';
import OriginCodeEditor from 'components/originCodeEditor';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';


// 编程题组件
// contentValue: 传入的题目内容 {language:string, originCode:string, testCode:string}
// commitResult: 提交结果的回调函数
function CodingQuestion({ renderType = "edit", contentValue, commitResult, state = "training" }, ref) {

  const [codeResult, setCodeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  let dispatch = null
  dispatch = useDispatch();

  useImperativeHandle(ref, () => ({
    runCode
  }))

  const getLanguage = () => {
    if (contentValue?.language) {
      return contentValue.language === "c_cpp" ? "c" : contentValue.language;
    }
    return "python";
  }

  useEffect(() => {
    if (!contentValue || !contentValue.language || !contentValue.testCode) {
      return;
    }
    setCurrentCode(contentValue.originCode);
  }, [contentValue.originCode]);

  const runCode = async () => {
    if (!currentCode || currentCode.trim() === "" || currentCode.trim() === contentValue.originCode.trim()) {
      message.error("请输入代码");
      return;
    }

    const originCodeObj = JSON.parse(currentCode);
    const newOriginCode = [originCodeObj.code1, originCodeObj.code2, originCodeObj.code3].filter(Boolean).join("\n");
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
          dispatch?.({
            type: "questionsModel/runCode",
            payload: { code: `${newOriginCode}\n${test}`, language: getLanguage() },
            callback: (result) => {
              console.log(result);
              if (!result.output) {
                const errorMessage = result.error || "未知错误";
                setCodeResult((prevResults) =>
                  prevResults.map((res, i) =>
                    i === index
                      ? { ...res, result: errorMessage, isCorrect: false }
                      : res
                  )
                );
                resolve({ ...initialResults[index], result: errorMessage, isCorrect: false });
                return;
              }

              const output = result.output.replace(/\n/g, '');
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



  const handleCodeChange = ({ originCode }) => {
    commitResult(originCode);
    setCurrentCode(originCode);
  };

  const resetPresetCode = () => {
    setCurrentCode(contentValue.originCode);
    commitResult(contentValue.originCode);
  }

  return <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
    <div>
      <div>当前语言: <Tag color="#108ee9">{getLanguage()}</Tag></div>
      <br />
      <div style={{ display: renderType !== 'edit' ? 'none' : 'block' }}>
        <OriginCodeEditor contentValue={contentValue} originCode={currentCode} handleCodeChange={handleCodeChange} />
      </div>
    </div>
    <div>
      <div style={{ display: renderType !== "edit" ? "none" : "flex", flexDirection: "row", gap: "10px" }}>
        <Button onClick={resetPresetCode}>重置代码</Button>
        <Button style={{ display: state === "exam" ? "none" : "block" }} onClick={runCode} loading={loading} >编译运行</Button>
      </div>
      {codeResult && renderType === 'edit' && Array.isArray(codeResult) && (
        <div style={{ width: '25vw' }}>
          <p>运行结果：</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                <th style={{ width: '80px', padding: '8px', textAlign: 'center' }}>测试用例</th>
                <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>输出</th>
                <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>预期输出</th>
                <th style={{ width: '80px', padding: '8px', textAlign: 'center' }}>结果</th>
              </tr>
            </thead>
            <tbody>
              {codeResult.map((res, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <Tooltip title={res.caseNumber}>
                      <span>{res.caseNumber}</span>
                    </Tooltip>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {
                      res.result === "运行中..." ? <Spin size='small' /> :
                        (<Tooltip
                          title={res.result}
                        >
                          <span style={{
                            display: 'inline-block',
                            width: '100px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}>
                            {res.result}
                          </span>
                        </Tooltip>)
                    }
                  </td>
                  <td style={{ padding: '8px', wordBreak: 'break-word', textAlign: 'center' }}>
                    <Tooltip title={res.expectedOutput}>
                      <span>{res.expectedOutput}</span>
                    </Tooltip>
                  </td>
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
}

export default forwardRef(CodingQuestion);
