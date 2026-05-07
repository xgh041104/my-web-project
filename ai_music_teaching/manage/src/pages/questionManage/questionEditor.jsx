import React, { useState, useEffect, useRef } from 'react';
import { Radio, Input, Button, Form, Row, Col, Upload, Rate, Spin, Space, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { connect, history } from 'umi';
import CourseCascader from './_courseCascader';
import { filePrefix } from 'urlList';
import { QuestionContents } from 'components/Questions';

const FormItem = Form.Item;

const QuestionEditor = ({ dispatch, crtQuestionInfo }) => {

  const [formRef] = Form.useForm();

  const QuestionPoolId = Form.useWatch('QuestionPoolId', formRef);
  const QuestionType = Form.useWatch('QuestionType', formRef);

  const [isLoading, setIsLoading] = useState(false);

  const isCreate = !crtQuestionInfo;

  useEffect(() => {
    if (crtQuestionInfo) {
      // 编辑状态时时不能切换题型,而且赋值题型时不能跳动清空题目内容函数;
      return;
    }
    formRef?.setFieldsValue({ "QuestionContent": { Answer: null, Options: null } });

  }, [QuestionType])

  const QuestionCategoryOption = [
    {
      label: '通用题',
      value: '0'
    },
    {
      label: '只可训练题',
      value: '1'
    },
    {
      label: '只可考试题',
      value: '2'
    },
  ]

  // 附件增改处理
  function attachFileHandle() {
    //TODO:可将此段代码添加到自定义上传控件中
    let RemoveFile = []
    let addNewFiles = []
    // console.log("当前题目附件", JSON.stringify(crtQuestionInfo.FileInfo));
    if (!crtQuestionInfo.FileInfo || crtQuestionInfo.FileInfo.length === 0) {
      addNewFiles = values.QuestionFiles;
    }
    else if (!values.QuestionFiles || values.QuestionFiles.length === 0) {
      RemoveFile = crtQuestionInfo.FileInfo;
    }
    else {
      RemoveFile = crtQuestionInfo.FileInfo.filter(
        originFile => values.QuestionFiles.every(file => originFile.Id !== file.uid)
      )
      addNewFiles = values.QuestionFiles.filter(
        file => file.originFileObj)
    }
    return {
      fileData: addNewFiles?.map(f => f.originFileObj),
      RemoveFile: RemoveFile.map(file => file.Id)
    }
  }

  //提交题目
  const handleSubmit = (values) => {
    if (isLoading) {
      console.log("请勿重复提交！");
      return;
    }
    setIsLoading(true);
    console.log('提交的数据：', JSON.stringify(values));
    const currentQuestionCom = QuestionContents[parseInt(values.QuestionType || 1) - 1];
    let payload = {
      QuestionPoolId: 1,
      QuestionName: values.QuestionName,
      QuestionCategory: parseInt(values.QuestionCategory),
      QuestionType: parseInt(values.QuestionType),
      Digree: values.Digree,
      QuestionDescribe: values.QuestionDescribe || '',
      "MajorID": values.courseInfo?.[1] || 0,
      "CollegeId": values.courseInfo?.[0] || 0,
      "CourseId": values.courseInfo?.[2] || 0,
      fileData: currentQuestionCom.filesEditable ? values.QuestionFiles.map(f => f.originFileObj) : [],// 以formdata的形式提交
      QuestionContent: JSON.stringify(values.QuestionContent.Options) || "",
      Answer: JSON.stringify(values.QuestionContent.Answer) || JSON.stringify(values.QuestionContent.answer || ""),
      ...(currentQuestionCom.handleCommitData?.(values))
    }
    if (!crtQuestionInfo) {
      dispatch({
        type: "questionManage/createQuestion",
        payload,
        callback: () => {
          setIsLoading(_ => false);
        }
      })
    }
    else {
      // 编辑题目提交
      payload["RemoveFile"] = []
      if (currentQuestionCom.filesEditable) {
        payload = { ...payload, ...(attachFileHandle()) }
      }
      payload["QuestionId"] = crtQuestionInfo.QuestionId
      dispatch({
        type: "questionManage/modifyQuestion",
        payload,
        callback: () => {
          setIsLoading(_ => false);
        }
      })
    }
  };

  const requiredProps = { rules: [{ required: true }], hasFeedback: true }

  useEffect(() => {
    if (!crtQuestionInfo) {
      formRef?.resetFields();
    }
    else {
      const currentQuestionTypeIndex = crtQuestionInfo.QuestionType - 1
      const QuestionFiles = crtQuestionInfo.FileInfo?.map((file) => ({
        uid: file.Id,
        name: file.FileName,
        status: 'done',
        url: filePrefix() + file.FilePath,
      })) || []
      // 操作题没有附件
      formRef?.setFieldsValue({
        "QuestionPoolId": 1,
        "QuestionName": crtQuestionInfo.QuestionName,
        "QuestionCategory": crtQuestionInfo.QuestionCategory.toString(),
        "QuestionType": crtQuestionInfo.QuestionType.toString(),
        "Digree": crtQuestionInfo.Digree,
        "courseInfo":
          crtQuestionInfo.CourseId
          && [crtQuestionInfo.CollegeId, crtQuestionInfo.MajorID, crtQuestionInfo.CourseId]
          || undefined,
        "QuestionDescribe": crtQuestionInfo.QuestionDescribe,
        "QuestionContent": { Options: JSON.parse(crtQuestionInfo.QuestionContent || null), Answer: JSON.parse(crtQuestionInfo.Answer || null) },
        QuestionFiles: QuestionContents[currentQuestionTypeIndex].filesEditable ? QuestionFiles : undefined,
        ...(QuestionContents[currentQuestionTypeIndex].handleFieldsData?.(crtQuestionInfo))
      })
    }
  }, [crtQuestionInfo])

  const questionTypeIndex = (parseInt(QuestionType) || 1) - 1
  return <Spin spinning={isLoading} size='large'>
    <Space size={'large'} align='baseline'>
      <h1 style={{ fontSize: '.24rem' }}>{(isCreate ? "新增" : "编辑") + QuestionContents[questionTypeIndex].label}</h1>
      <Button type='primary' onClick={() => history.push('/questionManage/questionList')} >返回题目列表</Button>
    </Space>
    <Form form={formRef} style={{ width: '60%' }} onFinish={handleSubmit}
      labelCol={{ span: 2 }} wrapperCol={{ span: 16 }}
    >
      {/* <FormItem {...requiredProps} label="题库" name='QuestionPoolId' initialValue={'1'}  >
                <Radio.Group options={[
                    { label: '公共题库', value: '1', key: 'QuestionPool1' },
                    { label: '专业课题库', value: '2', key: 'QuestionPool2' },
                ]}
                />
            </FormItem> */}
      <FormItem label="难度系数" name='Digree' initialValue={1} hasFeedback>
        <Rate />
      </FormItem>
      {QuestionPoolId === '2'
        && <FormItem {...requiredProps} label='关联课程' name='courseInfo' >
          <CourseCascader />
        </FormItem>}
      <FormItem {...requiredProps} label='题型' name='QuestionType' initialValue={'1'} >
        <Radio.Group disabled={crtQuestionInfo} options={QuestionContents.map((q, i) => ({ label: q.label, value: q.value, key: "questionType" + i }))} />
      </FormItem>
      <FormItem {...requiredProps} label='题目限制' name='QuestionCategory' initialValue={'0'} >
        <Radio.Group disabled={crtQuestionInfo} options={QuestionCategoryOption} />
      </FormItem>
      <FormItem {...requiredProps} label='题干' name='QuestionName' >
        <Input.TextArea autoSize />
      </FormItem>
      <FormItem label='题目描述' name='QuestionDescribe' >
        <Input.TextArea autoSize />
      </FormItem>
      {/*TODO:上传文件进度条 */}
      {QuestionContents[questionTypeIndex].attachFile && <FormItem label='题目附件' name='QuestionFiles' hasFeedback
        valuePropName='fileList'
        getValueFromEvent={e => {
          if (Array.isArray(e)) {
            return e;
          }
          return e && e.fileList;
        }}>
        <Upload multiple beforeUpload={() => false} >
          <Button icon={<UploadOutlined />}>上传附件</Button>
        </Upload>
      </FormItem>}
      <FormItem label='题目内容' name='QuestionContent'
        hasFeedback
        rules={[{
          required: true,
          validator: QuestionContents[questionTypeIndex].validator
        }]}
      >
        {QuestionContents[questionTypeIndex].component}
      </FormItem>
      <Row >
        <Col span={14}></Col>
        <Col span={2}>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Col>
      </Row>
    </Form >
  </Spin>
}
export default connect(({ dispatch, questionManage }) => ({
  dispatch, crtQuestionInfo: questionManage.crtQuestionInfo
}))(QuestionEditor)
