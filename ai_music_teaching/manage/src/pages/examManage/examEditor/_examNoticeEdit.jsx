import {
    ProForm, ProFormText, ProFormItem
} from '@ant-design/pro-components';
import { Modal, Button } from 'antd';
import { QuillEditor } from 'components/quilleditor'
import React, { useState, useEffect } from 'react'
import { connect } from 'umi'

// const FormItem = Form.Item;

function ExamTopicEdit({ notice, dispatch, examInfo }) {

    const [form] = ProForm.useForm();
    const [open, setOpen] = useState(false);
    const [isCreate, setIsCreate] = useState(true);

    const handleSubmit = values => {
        console.log("get submit values", values);
        const dispatchValues = {
            "ExamId": examInfo.Id,
            ...values,
            "SchoolName": "湖北大学知行学院",
        }
        if (isCreate) {
            dispatch({
                type: "examManage/createExamNotice",
                payload: dispatchValues,
                callback:()=>{
                    setIsCreate(false);
                }
            })
        }
        else {
            dispatch({
                type: "examManage/modifyExamNotice",
                payload: dispatchValues,
            })
        }
    }
    const handleDelete = () => {
        dispatch({
            type: "examManage/removeExamNotice",
            payload: { ExamId: examInfo.Id },
            callback: () => {
                form?.resetFields()
                setIsCreate(true);
            }
        });
        setOpen(false);
    }

    useEffect(() => {
        setIsCreate(!notice);
        if (!notice) {
            return;
        }
        form.setFieldsValue({
            ...notice
        })
    }, [notice])

    useEffect(() => {
        if (!examInfo || !examInfo.Id) {
            return;
        }
        dispatch({
            type: "examManage/queryExamNotice",
            payload: { ExamId: examInfo.Id }
        })
    }, [examInfo])


    const formLayout = { labelCol: { span: 2 }, wrapperCol: { span: 12 }, style: { width: '60vw' } }

    return <>
        <Modal
            title="重置"
            centered
            open={open}
            onOk={handleDelete}
            onCancel={() => setOpen(false)}
            width={1000}
        >
            <p>确定清除考试通知？</p>
        </Modal>
        <ProForm form={form}  {...formLayout} onFinish={handleSubmit}
            submitter={{
                render: (props, doms) => {
                    console.log(props);
                    let newDoms = []
                    if (!isCreate) {
                        newDoms.push(<Button
                            key="clear"
                            onClick={() => setOpen(true)}
                        >
                            清除
                        </Button>)
                    }
                    newDoms.push(<Button
                        type="primary"
                        key="submit"
                        onClick={() => props.form?.submit?.()}
                    >
                        提交
                    </Button>)
                    return newDoms;
                }
            }}
        >
            <ProFormText
                width="md" name="Title" label="标题" placeholder="请输入标题" rules={[{ required: true, message: '请填写' }]}
            />
            <ProFormText
                width="md" name="CourseCode" label="课程代码" placeholder="请输入课程代码" rules={[{ required: true, message: '请填写' }]}
            />
            <ProFormText
                width="md" name="CourseName" label="课程名称" placeholder="请输入课程名称" rules={[{ required: true, message: '请填写' }]}
            />
            {/* <ProFormText
                width="md" name="SchoolName" label="学校名称" placeholder="请输入学校名称" rules={[{ required: true, message: '请填写' }]}
            /> */}
            <ProFormItem width="md" name="Context" label="正文内容" rules={[{ required: true, message: '请填写' }]}>
                <QuillEditor
                    // onfileUpload={onfileUpload}
                    placeholder="请输入"
                    videoLabel={false}
                    imageLabel={false}
                />
            </ProFormItem>
        </ProForm >
    </>

}

export default connect(({ examManage, dispatch }) => ({ notice: examManage.crtNotice, dispatch }))(ExamTopicEdit);

