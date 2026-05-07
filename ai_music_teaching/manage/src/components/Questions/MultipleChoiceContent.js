import React, { useEffect } from 'react'
import { Checkbox, Space, Input, Button } from 'antd';
import { useState } from 'react';
import { DeleteOutlined, PlusCircleOutlined  } from '@ant-design/icons';

// {value, onChange}实现受控组件
export default function ({ value={}, onChange }) {
  const [contentValue, setContentValue] = useState({ Answer: [], Options: [] });

  useEffect(() => {
    if (!value || !value.Options||JSON.stringify(contentValue) === JSON.stringify(value)) {
      return;
    }    
    setContentValue(value);
  }, [value])

  //删除选择题选项
  const deleteChoice = (key) => {
    console.log("deleteChoice", key);
    // setContentValue(current => current.toSpliced(key, 1));
    let newOptions = contentValue.Options;
    newOptions = newOptions.toSpliced(key, 1);
    const newContentValue = {...contentValue, Options:newOptions}
    setContentValue(newContentValue);
    onChange(newContentValue);
  };
  //添加选择题选项
  const addChoice = () => {
    // console.log(employees);
    // setContentValue(current => current.toSpliced(current.length, 0, ''));
    let newOptions = contentValue.Options;
    newOptions = newOptions.toSpliced(newOptions.length, 0, '');
    const newContentValue = {...contentValue, Options:newOptions}
    setContentValue(newContentValue);
    onChange(newContentValue);
  };
  //选择题选项内容修改
  const optionChange = (key, item) => {
    // setContentValue(value => {
    //   value[key] = item
    //   console.log("optionChange", value, key, item)
    //   return [...value]
    // });
    let newOptions = contentValue.Options;
    newOptions[key] = item;
    const newContentValue = {...contentValue, Options:newOptions}
    setContentValue(newContentValue);
    onChange(newContentValue)
  }
  const handleAnswerChange = (answer)=>{
    setContentValue({...contentValue, Answer:answer}) 
    onChange({...contentValue, Answer:answer});
  }

  return <>
    {contentValue.Options.length > 0 && <><Checkbox.Group 
    value={contentValue.Answer}
    onChange={handleAnswerChange}
      style={{ width: '100%' }} 
    >
      <Space direction='vertical' >
        {contentValue.Options.map((item, index) => {
          console.log("content :", item, index);
          return <Checkbox value={index} key={'optionIndex' + index} >
            <Space>
              <Input
                style={{ width: "36vw" }}
                value={item} placeholder={'请输入选项内容'}
                onChange={(e) => optionChange(index, e.target.value)}>
              </Input>
              <Button icon={<DeleteOutlined />}
                onClick={() => deleteChoice(index)} />
            </Space>
          </Checkbox>
        })}
      </Space>
    </Checkbox.Group><p /></>}
    <Button style={{ width: "30vw", marginLeft: '7%' }} size='large' icon={<PlusCircleOutlined />} onClick={addChoice} >新增选项</Button>
  </>
}