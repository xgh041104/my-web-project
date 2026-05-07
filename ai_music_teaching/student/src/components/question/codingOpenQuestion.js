import { Button, Tag } from 'antd';
import { useEffect, useState, forwardRef } from 'react'
import OriginCodeEditor from 'components/originCodeEditor';


// 编程题组件
// contentValue: 传入的题目内容 {language:string, originCode:string, testCode:string}
// commitResult: 提交结果的回调函数
function CodingOpenQuestion({ renderType = "edit", contentValue, commitResult }, ref) {
  const [currentCode, setCurrentCode] = useState(null);

  const getLanguage = () => {
    if (contentValue?.language) {
      return contentValue.language === "c_cpp" ? "c" : contentValue.language;
    }
    return "python";
  }

  useEffect(() => {
    if (!contentValue || !contentValue.language) {
      return;
    }
    setCurrentCode(contentValue.originCode);
  }, [contentValue.originCode]);

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
        <div>代码块：</div>
        <OriginCodeEditor contentValue={contentValue} originCode={currentCode} handleCodeChange={handleCodeChange} />
      </div>
    </div>
    <div>
      <div style={{ display: renderType !== "edit" ? "none" : "flex", flexDirection: "row", gap: "10px" }}>
        <Button onClick={resetPresetCode}>重置代码</Button>
      </div>
    </div>
  </div>
}

export default forwardRef(CodingOpenQuestion);
