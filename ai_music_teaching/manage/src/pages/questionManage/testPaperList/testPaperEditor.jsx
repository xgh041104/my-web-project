import React, { useEffect, useState } from 'react';
import { Form, Space, Button, Radio, Input, InputNumber, Row, Col } from 'antd';
import { connect, history } from 'umi';

import CourseCascader from '../_courseCascader'
import QuestionSelect from './_questionSelect'

const FormItem = Form.Item;

function testPaperEditor({ dispatch, crtPaperInfo }) {
  const [formRef] = Form.useForm();

  const TestPaperType = Form.useWatch('TestPaperType', formRef);
  const FullMarks = Form.useWatch('FullMarks', formRef);
  //提交题目
  const handleSubmit = values => {
    console.log('提交的数据：', JSON.stringify(values));
    let payload = {
      TestPaperType: 1,
      TestPaperName: values.TestPaperName,
      ExamDuration: values.ExamDuration,
      "FullMarks": parseInt(values.FullMarks),
      "PassScore": parseInt(values.PassScore),
      // "TeacherId": 1,
      // "SchoolId": 1,
      "QuestionScoreJson": values.QuestionScoreJson,
      "MajorId": values.courseInfo?.[1] || 0,
      "CollegeId": values.courseInfo?.[0] || 0,
      "CourseId": values.courseInfo?.[2] || 0
    }

    if (!crtPaperInfo) {
      dispatch({
        type: "testPaper/createTestPaper",
        payload
      })
    }
    else {

      payload["Id"] = crtPaperInfo.Id
      dispatch({
        type: "testPaper/modifyTestPaper",
        payload
      })
    }
  };

  const QuestionScoreValidator = () => ({
    required: true,
    validator(_, value) {
      if (!value || !Array.isArray(value) || value.length < 1) {
        return Promise.reject(new Error('题型不能为空'))
      }
      let score = 0;
      let emptyQuestionScore = false;
      let emptyQuestion = true;
      let zeroScore = false;
      value.forEach(element => {
        score += parseFloat(element.FullMarksRatio) || 0
        if (!emptyQuestionScore) {
          emptyQuestionScore = (element.FullMarksRatio > 0 && element.QuestionArr.length == 0);
        }
        if (emptyQuestion) {
          emptyQuestion = (element.QuestionArr.length === 0);
        }
        zeroScore = element.QuestionArr.some(q => parseInt(q.Score) === 0)
      });
      if (zeroScore) {
        return Promise.reject(new Error('题目分数不能为0'));
      }
      if (emptyQuestion) {
        return Promise.reject(new Error('题目不能为空'));
      }
      if (emptyQuestionScore) {
        return Promise.reject(new Error('没有题目的题型分数不能分配分数'));
      }
      if (score.toFixed(1) !== (parseFloat(FullMarks) || 0).toFixed(1)) {
        return Promise.reject(new Error('题目分数与总分不相等'));
      }
      return Promise.resolve();
    },
  })

  const isCreate = !crtPaperInfo;

  const requiredRule = { rules: [{ required: true }], hasFeedback: true }

  useEffect(() => {
    if (!crtPaperInfo) {
      formRef?.resetFields();
    }
    else {
      formRef?.setFieldsValue({
        "Id": crtPaperInfo.Id,
        "TestPaperName": crtPaperInfo.TestPaperName,
        "ExamDuration": crtPaperInfo.ExamDuration,
        "FullMarks": crtPaperInfo.FullMarks,
        "PassScore": crtPaperInfo.PassScore,
        "TestPaperType": "1",
        "courseInfo":
          crtPaperInfo.CourseId
          && [crtPaperInfo.CollegeId, crtPaperInfo.MajorId, crtPaperInfo.CourseId]
          || undefined,
        // "TeacherId": 1,
        // "SchoolId": 1,
        "QuestionScoreJson": crtPaperInfo.QuestionScoreJson
      })
    }
  }, [crtPaperInfo])

  return <>
    <Space size={'large'} align='baseline'>
      <h1 style={{ fontSize: '.24rem' }}>{(isCreate ? "新增" : "编辑") + "试卷"}</h1>
      <Button type='primary' onClick={() => history.push('/questionManage/testPaperList')} >返回试卷列表</Button>
    </Space>
    <Form form={formRef} style={{ width: '60%' }} onFinish={handleSubmit}
      labelCol={{ span: 3 }} wrapperCol={{ span: 12 }}
    >
      <FormItem {...requiredRule} label='试卷名称' name='TestPaperName' >
        <Input />
      </FormItem>
      <Row >
        <Col span={1} />
        <Col span={8}>
          <FormItem labelCol={{ span: 8 }} label='试卷满分(分)' initialValue={'100'} name='FullMarks' hasFeedback
            rules={[{ required: true }, { pattern: /^\d{1,3}$/, message: "请输入999以内的数值" }]}>
            <Input />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem labelCol={{ span: 8 }} label='及格分(分)' initialValue={'60'} name='PassScore' hasFeedback
            rules={[{ required: true }, { pattern: /^\d{1,3}$/, message: "请输入999以内的数值" },
            {
              validator: (_, value) => (parseInt(FullMarks) || 0) > (parseInt(value) || -1) ?
                Promise.resolve() : Promise.reject(new Error("及格分必须小于总分"))
            }
            ]}>
            <Input />
          </FormItem>
        </Col>
        <Col span={7}>
          <FormItem labelCol={{ span: 10 }} {...requiredRule} label='试卷时长(分钟)' initialValue={60} name='ExamDuration' >
            <InputNumber min={1} max={240} />
          </FormItem>
        </Col>
      </Row>

      <FormItem {...requiredRule} label='试卷题目' name='QuestionScoreJson'
        rules={[QuestionScoreValidator]}
      >
        <QuestionSelect fullScore={FullMarks} />
      </FormItem>
      <Row >
        <Col span={3}></Col>
        <Col span={3}>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Col>
      </Row>
    </Form >
  </>
}

export default connect(({ dispatch, testPaper }) => ({
  dispatch,
  crtPaperInfo: testPaper.crtPaperInfo
}))(testPaperEditor)