import React, { useEffect, useState } from 'react';
import { Row, Select, Col } from 'antd';
import OriginCodeEditor from 'components/originCodeEditor';


function CodingOpen({ value, onChange, viewType = 'edit' }) {
    const [contentValue, setContentValue] = useState({ originCode: "", language: "python" });//选项数据
    const [answer, setAnswer] = useState("");//答案

    useEffect(() => {
        if (value.Options || (value.Options && JSON.stringify(value.Options) !== JSON.stringify(contentValue))) {
            setContentValue(value.Options);
            setAnswer(value.Answer);
        }
    }, [value]);

    function handleCodeChange(value) {
        setContentValue({ ...contentValue, ...value });
        onChange({ Options: { ...contentValue, ...value }, Answer: answer });
    }

    function handleAnswerChange(value) {
        setAnswer(value);
        onChange({ Options: contentValue, Answer: value });
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
        <div style={{ display: 'flex', gridGap: '20px' }}>
            <div>
                {/* 条件渲染 "设置" 文本，视图模式为 'edit' 时显示 "设置" */}
                <div>{viewType === 'edit' && "设置"}预设代码：</div>
                <OriginCodeEditor handleCodeChange={handleCodeChange} contentValue={contentValue} />
            </div>

            <div style={{ display: viewType === 'view' ? 'none' : 'block' }}>
                {/* 仅在 'view' 模式时隐藏这部分内容 */}
                <div>设置完整代码(答案)：</div>
                <OriginCodeEditor handleCodeChange={(v) => handleAnswerChange(v.originCode)} contentValue={{ originCode: answer, language: contentValue?.language || "python" }} />
            </div>
        </div>
    </>
}

export default CodingOpen