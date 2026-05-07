import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Table, Space, message } from "antd";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { ProTable } from "@ant-design/pro-components";

const HJCTestCaseTable = ({ language = 'javascript', codeTestOnChange, codeTestCaseList }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTest, setEditingTest] = useState([]);
    const [form] = Form.useForm();
    const openModal = (record) => {
        setEditingTest(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };


    const handleSubmit = (values) => {
        if (editingTest) {
            codeTestOnChange(
                codeTestCaseList.map((item) =>
                    item.case === editingTest.case ? { ...item, ...values } : item
                )
            )
        }
        else {
            const newCaseNumber = codeTestCaseList.length > 0
                ? codeTestCaseList[codeTestCaseList.length - 1].case + 1
                : 1;
            codeTestOnChange([...codeTestCaseList, { ...values, case: newCaseNumber }]);
        }
        setModalVisible(false);
    };

    const handleDeleteTestCase = (index) => {
        codeTestOnChange(codeTestCaseList.filter((item) => item.case !== index));
    }
    // 表格列定义
    const columns = [
        {
            title: "序号", dataIndex: "case", key: "case",
            render: (_, record) => 'case' + record.case
        },
        { title: "描述", dataIndex: "description", key: "description" },
        { title: "validate", dataIndex: "validate", key: "validate" },
        {
            title: "操作",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openModal(record)}>
                        编辑
                    </Button>
                    <Button size="small" danger onClick={() => handleDeleteTestCase(record.case)}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ width: "40vw" }}>
            <Modal title={editingTest ? "编辑测试用例" : "新增测试用例"} open={modalVisible} style={{ minWidth: '50vw' }}
                onCancel={() => { setModalVisible(false); form.resetFields() }}
                footer={[
                    <Button key="submit" type="primary" htmlType="submit" onClick={() => form.submit()}>提交</Button>,
                    <Button key="cancel" onClick={() => { setModalVisible(false); form.resetFields() }}>取消</Button>
                ]} >
                <Form onFinish={handleSubmit} form={form}>
                    <Form.Item name="description" label="描述" rules={[{ required: true, message: "请输入描述" }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="validate" label="输入验证代码" rules={[{ required: true, message: "请输入验证代码" }]}>
                        <AceEditor
                            mode={language}
                            theme="monokai"
                            name="UNIQUE_ID_OF_DIV"
                            onChange={(value) => { form.setFieldsValue({ codeTestContent: value }) }}
                            fontSize={14}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: true,
                                tabSize: 3,
                            }} />
                    </Form.Item>
                </Form>
            </Modal>
            <ProTable dataSource={codeTestCaseList} columns={columns} search={false}
                toolBarRender={() => [
                    <Button key="add" type="primary" onClick={() => openModal()}>新增测试用例</Button>
                ]}
            />
        </div>
    );
};

export default HJCTestCaseTable
