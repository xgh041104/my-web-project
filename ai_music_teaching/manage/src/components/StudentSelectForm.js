import { Form, Row, Col, Button, Radio } from 'antd'

import StudentCascader from './StudentCascader'

const FormItem = Form.Item;

import React, { useEffect, useState } from 'react'

function StudentSelectForm({ studentSource, onStudentsChange }) {

    const [formValueChanged, setFormValueChanged] = useState(false);

    const isCreate = !studentSource;

    const handleSubmit = values => {
        setFormValueChanged(false);
        onStudentsChange(values);
    }

    useEffect(() => {
        if (isCreate) {
            return;
        }
        form.setFieldsValue({
            studentIds: studentSource?.map(s => s.StudentId)
        })
    }, [studentSource])

    const infoChanged = () => {
        if (formValueChanged) {
            return;
        }
        setFormValueChanged(true);
    }


    const formLayout = { labelCol: { span: 2 }, wrapperCol: { span: 12 }, style: { width: '60vw' } }
    const [form] = Form.useForm();
    // const studentType = Form.useWatch("studentType", form)

    return <Form form={form} {...formLayout} onFinish={handleSubmit} onValuesChange={infoChanged}>

        <FormItem label="选择考生" name="studentIds" required>
            <StudentCascader />
        </FormItem>
        {formValueChanged && <Row>
            {/* <Col offset={10} span={2}>
                <Button type="primary" >取消</Button>
            </Col> */}
            <Col offset={2}>
                <Button type="primary" htmlType='submit'>提交</Button>
            </Col>
        </Row>}
    </Form>
}

export default StudentSelectForm