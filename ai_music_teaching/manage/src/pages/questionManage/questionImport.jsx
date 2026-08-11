import { Typography, Upload, Button, Rate, message, Space, Input, Table, Select, Checkbox, Radio } from 'antd';
import { UploadOutlined } from '@ant-design/icons'
import { EditableProTable, ModalForm, ProForm, ProFormItem, ProFormRadio } from '@ant-design/pro-components';
import React, { useEffect, useState, useRef } from 'react';
import CourseCascader, { getCourseName } from './_courseCascader'
import { connect } from 'umi';
import { parseWordExam } from '@/utils/wordParser';

function ListDataEdit({ value, onChange }) {
    // console.log("")
    // const [inputValues, setInputValues] = useState(value || [])
    const handleInputChange = (inputValue, index) => {
        const newInputValues = value.toSpliced(index, 1, inputValue)
        // setInputValues(newInputValues);
        onChange?.(newInputValues)
    }
    return <Space direction='vertical'>
        {value && Array.isArray(value) && value.map((item, index) => {
            let inputProps = {
                key: "qci" + index,
                value: item,
                onChange: (e) => { handleInputChange(e.target.value, index) }
            }
            // if (index === value.length - 1) {
            //     inputProps["onPressEnter"] = handleInputConfirm;
            // }
            return <Input key={"qci" + index} {...inputProps} />
        })}
    </Space>
}

function CheckboxAnswer({ value, onChange, options }) {
    const [isError, setIsError] = useState(false)

    let listValue = null;
    try {
        listValue = JSON.parse(value)
    } catch (error) {
        listValue = [];
    }
    const onListValueChange = (value) => {
        onChange?.(JSON.stringify(value))
    }
    useEffect(() => {
        setIsError(!value || value.length < 1);
    }, [value])
    return <>
        <Checkbox.Group value={listValue} onChange={onListValueChange} options={options} />
        <div style={{ color: "red", display: isError ? "block" : "none" }}>答案选项有误</div>
    </>
}
function ListAnswer({ value, onChange }) {
    const [isError, setIsError] = useState(false);

    let listValue = null;
    try {
        listValue = JSON.parse(value);
    } catch (error) {
        listValue = [];
    }

    useEffect(() => {
        setIsError(!value || value.length < 1);
    }, [value])
    const onListValueChange = (value) => {
        onChange?.(JSON.stringify(value))
        setIsError(false);
    }
    return <>
        <ListDataEdit value={listValue} onChange={onListValueChange} />
        <div style={{ color: "red", display: isError ? "block" : "none" }}>答案选项有误</div>
    </>
}

function AnswerDataEdit(rowData) {

    if (rowData && rowData.QuestionType) {
        //1：单选、2：多选、3：判断、4：填空、5：实操
        if (rowData.QuestionType === 1) {
            return <Radio.Group options={rowData.QuestionContent.map((_, index) =>
                ({ key: "qar" + index, value: String(index + 1), label: "选项" + (index + 1) }))}></Radio.Group>
        }
        else if (rowData.QuestionType === 2) {
            return < CheckboxAnswer options={
                rowData.QuestionContent.map((_, index) =>
                    ({ key: "qac" + index, value: String(index + 1), label: "选项" + (index + 1) }))
            } />
        }
        else if (rowData.QuestionType === 3) {
            return <Radio.Group options={[{ value: "0", label: "错误" }, { value: "1", label: "正确" }]}></Radio.Group>
        }
        else if (rowData.QuestionType === 4) {
            return <ListAnswer />
        }
    }
    return <Input />;

}

function QuestionImport({ dispatch }) {
    const [editableKeys, setEditableRowKeys] = useState([]);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [errorMessageDiv, setErrorMessageDiv] = useState(null);
    const validatedQuestions = useRef(null);

    const uploadQuestion = () => {
        if (!validatedQuestions.current) {
            message.error('请先校验题目');
            return;
        }

        const hide = message.loading('正在批量导入题目并处理数据，耗时可能较长，请耐心等待...', 0);
        dispatch({
            type: "questionManage/importQuestionData",
            payload: validatedQuestions.current,
            callback: res => {
                hide(); // 关闭 loading
                if (res.code == 1) {
                    message.success('导入题目完成');

                    console.log('后端返回导入结果:', res);
                    // 前端本地直接将状态更新为“已导入”(Status: 1)
                    setDataSource(prev => prev.map(item => ({...item, Status: 1})));
                    setErrorMessageDiv(<p style={{ color: "green" }}>导入完成！</p>);
                }
                else if (res.code == 0) {
                    message.error('导入题目错误：' + res.msg);
                }
            }
        })
    }

    const confirmInfo = () => {
        console.log('confirm question data:', dataSource);
        let errorMessage = []
        validatedQuestions.current = dataSource.map((rowData, index) => {
            const origin = {
                Answer: "2",
                CourseName: 0,
                Digree: 2,
                QuestionContent: ['1', '2', '4'],
                QuestionName: "测试1",
                QuestionPoolId: 1,
                QuestionType: 1,
                SchoolId: 0,
                Status: 0,
                TeacherId: 0,
                id: "qustion0"
            }


            let Answer = rowData.Answer
            try {
                if (rowData.QuestionType === 1) {
                    if (!rowData.Answer || rowData.Answer === "" || !parseInt(rowData.Answer)) {
                        errorMessage.push(`第${index + 1}行答案设置有问题`)
                    }
                    else {
                        Answer = String(parseInt(Answer) - 1)
                    }
                }
                else if (rowData.QuestionType === 2) {
                    if (!rowData.Answer || rowData.Answer === "") {
                        errorMessage.push(`第${index + 1}行答案设置有问题`)
                    } else {
                        const parsed = JSON.parse(rowData.Answer);
                        if (!Array.isArray(parsed) || parsed.every(i => !parseInt(i))) {
                            errorMessage.push(`第${index + 1}行答案设置有问题`)
                        } else {
                            Answer = parsed.map(i => String(parseInt(i) - 1))
                        }
                    }
                }
                else if (rowData.QuestionType === 3) {
                    if (rowData.Answer == null || rowData.Answer === ""){
                        errorMessage.push(`第${index + 1}行答案设置有问题`)
                    }
                    else {
                        Answer = Answer.toString();
                    }
                }
                else if (rowData.QuestionType === 4) {
                    if (!rowData.Answer || rowData.Answer === "") {
                        errorMessage.push(`第${index + 1}行答案设置有问题`)
                    } else {
                        const parsed = JSON.parse(rowData.Answer);
                        if (!Array.isArray(parsed)) {
                            errorMessage.push(`第${index + 1}行答案设置有问题`)
                        }
                    }
                }
                else if (typeof rowData.QuestionType !== "number" || rowData.QuestionType > 5 || rowData.QuestionType < 1) {
                    errorMessage.push(`第${index + 1}行题目类型设置有问题`)
                }
            } catch (e) {
                // JSON.parse 如果报错，说明答案格式严重错误，直接抛出红字提示
                errorMessage.push(`第${index + 1}行答案设置有问题`)
            }
            return { ...rowData, Answer }
        })
        if (errorMessage.length > 0) {
            setErrorMessageDiv(<>{errorMessage.map(e =>
                <p key={e} style={{ color: 'red', marginLeft: ".2rem" }}>{e}</p>)}</>);
            return;
        }

        setErrorMessageDiv(null);

    }

    const InitSelectedHandle = (selectedRows, onCleanSelected) => {
        const [modalForm] = ProForm.useForm()
        const questionPoolId = ProForm.useWatch("QuestionPoolId", modalForm);

        const handleSubmit = values => {
            let tableDataSource = dataSource;
            selectedRows.forEach(row => {
                let targetData = tableDataSource.find(data => data.id === row.id)
                if (targetData) {
                    if (values["QuestionPoolId"]) {
                        if (values["QuestionPoolId"] === '2') {
                            if (values["courseInfo"]) {
                                targetData["courseInfo"] = values.courseInfo;
                            }
                        }
                        targetData["QuestionPoolId"] = values["QuestionPoolId"]
                    }

                    if (values["Digree"]) {
                        targetData["Digree"] = values["Digree"]
                    }
                }
            });
            setDataSource([...tableDataSource]);
            onCleanSelected();
            return true;
        }

        return <ModalForm
            form={modalForm}
            title="批量修改"
            trigger={<Button type='link'>批量处理</Button>}
            onFinish={handleSubmit}>
            <ProFormRadio.Group label="题库" name='QuestionPoolId' options={[
                { label: '公共题库', value: '1', key: 'QuestionPool1' },
                { label: '专业课题库', value: '2', key: 'QuestionPool2' },
            ]}
            />
            {questionPoolId === "2"
                && <ProFormItem rules={[{ required: true }]} name="courseInfo" label="修改所属课程" >
                    <CourseCascader />
                </ProFormItem>}
            <ProFormItem name="Digree" label="修改难度" ><Rate /></ProFormItem>
        </ModalForm>
    }
    const handleUpload = async () => {
        setUploading(true);
        
        const fileName = uploadFile.name.toLowerCase();
        if (fileName.endsWith('.docx')) {
            try {
                const questions = await parseWordExam(uploadFile);
                message.success('Word 题目解析成功');
                setDataSource(questions);
                setUploading(false);
            } catch (error) {
                console.error('Word parse error:', error);
                message.error('Word 题目解析失败：' + error.message);
                setUploading(false);
            }
            return;
        }

        dispatch({
            type: "questionManage/parseQuestionData",
            payload: {
                fileData: [uploadFile]
            },
            callback: res => {
                if (res.code == 1) {
                    message.success('题目原始数据解析成功');
                    const tableData = res.data.map((question, index) =>
                        ({ id: "qustion" + index, ...question }))

                    console.log('获取原始表格数据', res, tableData);
                    setDataSource(tableData);
                }
                else if (res.code == 0) {
                    message.error('题目原始数据解析失败');
                }
                setUploading(false);
            }
        })
    };

    useEffect(() => {
        if (dataSource && dataSource.length > 0) {
            confirmInfo();
        }else{
            setErrorMessageDiv(<p></p>);
        }
    }, [dataSource])

    const props = {
        onRemove: () => {
            setUploadFile(null);
        },
        beforeUpload: (file) => {
            setUploadFile(file);
            return false;
        },
        maxCount: 1,
        accept: ".xls, .xlsx, .csv, .docx"
    };

    const questionPoolOptions = ['公共题库', '专业课题库']
    const columns = [
        {
            title: '所属题库',
            dataIndex: 'QuestionPoolId',
            align:'center',
            renderFormItem: () => <Select
                options={questionPoolOptions.map((o, i) => ({ value: i + 1, label: o, key: "qp" + i }))} />,
            render: (value) => questionPoolOptions[parseInt(value) - 1],
        },
        {
            //1：单选、2：多选、3：判断、4：填空、5：实操
            title: '题目类型',
            dataIndex: 'QuestionType',
            align:'center',
            // renderFormItem: (_, { record }) => questionOptions[record.QuestionType - 1],
            // render: (value) => questionOptions[value - 1],
            valueEnum: {
                1: "单选", 2: "多选", 3: "判断", 4: "填空"
            },
            readonly: true

        },
        {
            title: '题干',
            dataIndex: 'QuestionName',
            align:'center',
            render: (dom) => <Typography.Text style={{ width: '2rem' }}
                ellipsis={{ tooltip: dom }}>
                {dom}
            </Typography.Text>
        },
        {
            title: '题目内容',
            dataIndex: 'QuestionContent',
            align:'center',
            renderFormItem: (_, { record }) => {
                if (record && record.QuestionType) {
                    if ([3, 4, 5].indexOf(record.QuestionType) != -1) {
                        return "-";
                    }
                    else {
                        return <ListDataEdit />
                    }
                }
                return <Input></Input>
            },
            render: (value) => <Space direction='vertical'>{
                value && Array.isArray(value) && value.map((item, index) =>
                    <Typography.Text key={'qc' + index} style={{ width: '2rem' }} ellipsis={{ tooltip: item }}>
                        {item}
                    </Typography.Text>)}
            </Space>
        },
        {
            title: '答案',
            dataIndex: 'Answer',
            align:'center',
            fieldProps: () => ({
                rules: [{ required: true, message: '此项为必填项' }]
            }),
            renderFormItem: (_, { record }) => AnswerDataEdit(record),
            render: (value) => {
                let listValue = null;
                try {
                    listValue = JSON.parse(value)
                } catch (error) {
                    return value
                }
                if (Array.isArray(listValue)) {
                    return listValue.join("、")
                }
                else {
                    return value
                }
            }
        },

        {
            title: '难度等级',
            dataIndex: 'Digree',
            align:'center',
            renderFormItem: () => <Rate />,
            render: (value) => <Rate disabled value={value} />,
            sorter: (a, b) => a.Digree - b.Digree,
            search: false
        },
        // {
        //     title: '所属课程',
        //     dataIndex: 'courseInfo',
        //     align:'center',
        //     fieldProps: (form, { rowKey, rowIndex }) => {
        //         if (form.getFieldValue([rowKey || '', 'QuestionPoolId']) === 1) {
        //             return { disabled: true, initValue: undefined }
        //         }
        //         return { rules: [{ required: true, message: '此项为必填项' }] };
        //     },
        //     renderFormItem: (_, { record }) => record.QuestionPoolId === 2 ?
        //         <CourseCascader /> : "-",
        //     render: (value) => value && Array.isArray(value) && value.length > 2 && getCourseName(value[2]) || ""
        // },
        {
            title: '导入状态',
            dataIndex: 'Status',
            align:'center',
            valueEnum: {
                0: {
                    text: '未导入',
                    status: 'Error',
                },
                1: {
                    text: '已导入',
                    status: 'Success',
                },
                2: {
                    text: '数据错误',
                    status: 'error',
                }
            },
            readonly: true
        },
        {
            title: '操作',
            valueType: 'option',
            width: '2rem',
            align:'center',
            render: (text, record, index, action) => [
                <a
                    key="editable"
                    onClick={() => {
                        action?.startEditable?.(record.id);
                    }}
                >
                    编辑
                </a>,
                <a
                    key="delete"
                    onClick={() => {
                        setDataSource(() => dataSource.filter((item) => item.id !== record.id));
                    }}
                >
                    删除
                </a>,
            ],
        },
    ];

    return <>
        <Space align='baseline' style={{ width: '35vw', marginLeft: ".2rem" }}>
            <Upload {...props} >
                <Button icon={<UploadOutlined />}>选择题目数据表格</Button>
            </Upload>
            <Button
                type="primary"
                onClick={handleUpload}
                disabled={!uploadFile}
                loading={uploading}
                style={{
                    marginTop: 16,
                }}
            >
                {uploading ? '上传中' : '开始上传'}
            </Button>
        </Space>
        <p />
        <EditableProTable
            rowKey="id"
            headerTitle="导入的题目信息"
            scroll={{
                x: 960,
            }}
            value={dataSource}
            onChange={setDataSource}
            recordCreatorProps={false}
            loading={false}
            columns={columns}
            rowSelection={{
                selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
            }}
            tableAlertRender={({
                selectedRowKeys,
                selectedRows,
                onCleanSelected,
            }) => {
                // console.log("tableAlertRender:", selectedRowKeys, selectedRows);

                return (
                    <div>
                        <span>
                            已选 {selectedRowKeys.length} 项
                        </span>
                        {InitSelectedHandle(selectedRows, onCleanSelected)}
                    </div>
                );
            }}
            editable={{
                // type: 'multiple',
                editableKeys,
                onSave: async (rowKey, data, row) => {
                    console.log(rowKey, data, row);
                    if (!data.Answer) {
                        message.error("答案不能为空");
                        return Promise.reject("答案不能为空")
                    }
                    if (!data.QuestionName) {
                        message.error("题目名称不能为空");
                        return Promise.reject("题目名称不能为空")
                    }
                },
                onChange: setEditableRowKeys
            }}
        />
        {errorMessageDiv}
        <Button hidden={errorMessageDiv} style={{ marginLeft: ".2rem" }} type='primary' onClick={uploadQuestion}>确认导入</Button>
    </>
}

export default connect(({ dispatch }) => ({
    dispatch
}))(QuestionImport)
// export default QuestionImport
