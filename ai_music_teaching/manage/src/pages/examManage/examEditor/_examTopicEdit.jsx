import { Form, Input, Switch, Row, Col, Button } from 'antd'
import React, { useEffect, useState } from 'react'

const FormItem = Form.Item;

function ExamTopicEdit({ dispatch, examInfo }) {

    const [formValueChanged, setFormValueChanged] = useState(false);
    const [form] = Form.useForm()

    const isCreate = !examInfo || !examInfo.ExamName;

    const handleSubmit = values => {
        setFormValueChanged(false);

        console.log("get submit values", values);
        const dispatchValues = {
            "ExamName": values.ExamName,
            "ExamDescribe": values.ExamDescribe || "",
            "ExamStatus": values.ExamStatus ? 1 : 0,
            "FaceVerify": values.FaceVerify ? 1 : 0,
        }
        if (isCreate) {
            dispatch({
                type: "examManage/createExam",
                payload: dispatchValues,
                // callback:(examInfo)=>{
                //   if(examInfo&&examInfo.ExamId){
                //     setIsCreate(success);
                //   }
                // }
            })
        }
        else {
            dispatch({
                type: "examManage/modifyExam",
                payload: {
                    "Id": examInfo.Id,
                    ...dispatchValues
                },
            })
        }
    }

    useEffect(() => {
        if (isCreate) {
            return;
        }
        form.setFieldsValue({
            ExamName: examInfo.ExamName,
            ExamStatus: examInfo.ExamStatus === 1,
            FaceVerify: examInfo.FaceVerify === 0,
            ExamDescribe: examInfo.ExamDescribe,
        })
    }, [examInfo])

    const infoChanged = () => {
        if (formValueChanged) {
            return;
        }
        setFormValueChanged(true);
    }


    const formLayout = { labelCol: { span: 2 }, wrapperCol: { span: 12 }, style: { width: '60vw' } }

    return <Form form={form} {...formLayout} onFinish={handleSubmit} onValuesChange={infoChanged} >
        <FormItem label={"考试主题"} name="ExamName" required>
            <Input></Input>
        </FormItem>
        <FormItem label="考试状态" name="ExamStatus" valuePropName='checked' initialValue={false} required>
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </FormItem>
        {/* <FormItem label="人脸识别" name="FaceVerify" valuePropName='checked' initialValue={false} required>
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </FormItem> */}
        <FormItem label="考试说明" name="ExamDescribe">
            <Input.TextArea style={{ minHeight: "20vh" }} />
        </FormItem>
        {formValueChanged && <Row>
            <Col offset={2}>
                <Button type="primary" htmlType='submit'>提交</Button>
            </Col>
        </Row>}
    </Form>
}

export default ExamTopicEdit
