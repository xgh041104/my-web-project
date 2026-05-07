import React, { useState, useEffect } from 'react';
import { Radio } from 'antd';

// 判断题组件
export default function TrueOrFalseContent({ value, onChange }) {

    const [answer, setAnswer] = useState({
        Answer: undefined,
        Options: [{ value: '0', label: '错误' }, { value: '1', label: '正确' }]
    })

    useEffect(() => {
        if (!value || value == "" || !value.Answer || value.Answer === answer.Answer) {
            return;
        }
        setAnswer({ ...answer, Answer: value.Answer });
    }, [value])

    return <Radio.Group
        value={answer.Answer}
        onChange={e => {
            setAnswer({ ...answer, Answer: e.target.value })
            onChange({ ...answer, Answer: e.target.value })
        }}
        options={answer.Options}
    />
}