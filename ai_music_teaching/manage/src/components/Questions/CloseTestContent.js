import { Space, Input, Button, Row } from 'antd';
import React, { useState, useEffect } from 'react';
import { DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';


export default ({ value, onChange }) => {

  const [contentValue, setContentValue] = useState({ Answer: [] });//选项数据

  useEffect(() => {
    if (!value || !value.Answer || JSON.stringify(contentValue) === JSON.stringify(value)) {
      return;
    }
    setContentValue(value);
  }, [value])


  //删除填空题答案
  const deleteChoice = (key) => {
    // console.log("deleteChoice", key);
    // setContentValue(current => current.toSpliced(key, 1)
    // );
    let newOptions = contentValue.Answer;
    newOptions = newOptions.toSpliced(key, 1);
    const newContentValue = { ...contentValue, Answer: newOptions }
    setContentValue(newContentValue);
    onChange(newContentValue);
  };
  //添加填空题答案
  const addChoice = () => {
    // console.log(employees);
    // setContentValue(current => current.toSpliced(current.length, 0, ''));
    let newOptions = contentValue.Answer;
    newOptions = newOptions.toSpliced(newOptions.length, 0, '');
    const newContentValue = { ...contentValue, Answer: newOptions }
    setContentValue(newContentValue);
    onChange(newContentValue);
  };
  //修改填空题答案
  const inputChange = (key, item) => {
    // setContentValue(value => {
    //   value[key] = item
    //   // console.log("optionChange", value, key, item)
    //   return [...value]
    // });
    let newOptions = contentValue.Answer;
    newOptions[key] = item;
    const newContentValue = { ...contentValue, Answer: newOptions }
    setContentValue(newContentValue);
    onChange(newContentValue)
  }


  return <>
    {contentValue.Answer && contentValue.Answer.length > 0 && Array.isArray(contentValue.Answer) && <><Row>
      <Space direction="vertical">
        {contentValue.Answer?.map((item, index) => {
          return (
            <div key={'_c' + String(index)}>
              <Space direction="horizontal">
                {index + 1}
                <Input name="Input" size="large" style={{ width: '36vw' }}
                  value={item} placeholder={"请输入答案"}
                  onChange={e => inputChange(index, e.target.value)}>
                </Input>
                <Button type="text" icon={<DeleteOutlined />} onClick={() => deleteChoice(index)} />
              </Space>
            </div>
          );
        })}
      </Space>
    </Row>
      <p /></>}
    <Button style={{ width: "30vw", marginLeft: '7%' }} size='large' icon={<PlusCircleOutlined />}
      onClick={addChoice} >新增选项</Button>
  </>
}

