import React, { useState, useMemo, useEffect } from 'react'
import { Radio, Modal, Button, Popconfirm, Divider, Select, Upload, Row, Col, message, Table, Space } from 'antd'
import { EditableProTable, ProForm, ModalForm, ProFormSelect } from '@ant-design/pro-components'
import { UploadOutlined } from '@ant-design/icons'
import { connect } from 'dva'

// @connect(({ organizationInfo }) => ({
//     studentList: organizationInfo.studentList,
// }))

function UploadStudentFile({ onDataSourceChanged, dispatch, studentType, standId = -1 }) {

    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const callback = res => {
        if (res.code == 1) {
            message.success('学生信息原始数据解析成功');
            // onDataSourceChanged(_ => );
            const tableData = res.data.map((student, index) =>
                ({ id: "student" + index, ...student }))
            console.log('获取原始表格数据', res, tableData);
            // setDataSource(()=>tableData)
            // setTimeout(() => setDataSource(tableData))
            onDataSourceChanged(tableData);
        }
        else if (res.code == 0) {
            message.error('学生信息原始数据解析失败');
        }
        setUploading(false);
    }

    const handleUpload = () => {
        setUploading(true);

        dispatch({
            type: "organizationInfo/studentImport",
            payload: {
                fileData: [uploadFile],
                studentType,
                standId
            },
            callback
        })
    };
    const uploadProps = {
        onRemove: () => {
            setUploadFile(null);
        },
        beforeUpload: (file) => {
            setUploadFile(file);
            return false;
        },
        maxCount: 1,
        accept: ".xls, .xlsx, .csv, .xml"
    };

    return <Space align='baseline'>
        <Upload {...uploadProps} >
            <Button icon={<UploadOutlined />}>选择学生数据表格</Button>
        </Upload>
        <Button
            type="primary"
            onClick={handleUpload}
            disabled={!uploadFile || (studentType === "social" && standId == -1)}
            loading={uploading}
        >
            {uploading ? '上传中' : '开始上传'}
        </Button>
    </Space>
}


function StudentListImport({
    dispatch, standList, adminSchoolId,
    originClassList, originMajorList, originCollegeList
}) {
    const [editableKeys, setEditableRowKeys] = useState([]);
    const [confirmHidden, setConfirmHidden] = useState(true);
    const [crtStandId, setCrtStandId] = useState(-1);
    const [dataSource, setDataSource] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null)
    const [crtDataType, setCrtDataType] = useState(null)

    let collegeEnum = {}
    originCollegeList.forEach(item => {
        collegeEnum[item.Id] = item.CollegeName
    });

    const columns = [
        { title: "姓名", dataIndex: "TrueName" },
        // { title: "学生类型", dataIndex: "StudentType" },
        { title: "账号", dataIndex: "StudentAccount" },
        // { title: "密码", dataIndex: "StudentPwd" },
        // { title: "ExamName", dataIndex: "ExamName" },
        // {title:"考试站点",dataIndex:    "StandId"},

        { title: "证件号", dataIndex: "IDNumber", },
        { title: "准考证号", dataIndex: "ExamNumber", },
        {
            title: "出生日期", dataIndex: "Birthday",
            // renderFormItem: () =>  <DatePicker format={'YYYY/MM/DD'}></DatePicker>,
            // render: (value) => moment(value).isValid() ? moment(value).format('YYYY/MM/DD') : "-",
            valueType: 'date'
        },
        // { title: "电话", dataIndex: "Phone" },
        // { title: "邮箱", dataIndex: "Email" },
        // { title: "头像", dataIndex: "IDImage" },
        // { title: "脸部识别", dataIndex: "FaceOpen" },
        // { title: "学校名称", dataIndex: "SchoolName", },
        {
            title: "学院", dataIndex: "CollegeId",
            render: (value) => crtDataType === "school" ? originCollegeList?.find(item => item.Id === value)
                ?.CollegeName || "未知学院" : "-",
            renderFormItem: (value) => crtDataType === "school" ? <Select
                defaultValue={value || undefined}
                options={originCollegeList
                    .map(item => ({ value: item.Id, label: item.CollegeName, key: "college" + item.Id }))} /> : null,
        },
        {
            title: "专业", dataIndex: "MajorId",
            render: (value) => crtDataType === "school" ? originMajorList?.find(item => item.MajorId === value)
                ?.MajorName || "未知专业" : "-",
            renderFormItem: (value, { record }) => crtDataType === "school" ? <Select
                defaultValue={value || undefined}
                options={originMajorList
                    ?.filter((m) => m.CollegeId == record.CollegeId)
                    .map(item => ({ value: item.MajorId, label: item.MajorName, key: "major" + item.MajorId }))} /> : null,
        },
        {
            title: "班级", dataIndex: "ClassId",
            render: (value) => crtDataType === "school" ? originClassList?.find(item => item.Id === value)
                ?.ClassName || "未知班级" : "-",
            renderFormItem: (value, { record }) => crtDataType === "school" ? <Select
                defaultValue={value || undefined}
                options={originClassList
                    ?.filter((c) => c.MajorId == record.MajorId)
                    .map(item => ({ value: item.Id, label: item.ClassName, key: "cls" + item.Id }))} /> : null
        },
        {
            title: '导入状态',
            dataIndex: 'Status',
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
            width: '2.5rem',
            width: '2rem',
            render: (text, record, index, action) => [
                <Button type='link' key="editable"
                    onClick={() => {
                        action?.startEditable?.(record.id);
                    }}
                >
                    编辑
                </Button>,
                <Popconfirm
                    key={"operator_del"}
                    title="是否确认删除该项？"
                    onConfirm={() => {
                        setDataSource(() => dataSource.filter((item) => item.id !== record.id));
                    }}
                    // onCancel={() => { message.error("取消删除") }}
                    okText="删除"
                    cancelText="取消"
                >
                    <Button danger type='link' key="delete">删除</Button>
                </Popconfirm>

            ],
        },
    ]


    const standOptions = standList?.map(stand => ({
        value: stand.Id,
        label: stand.StandName,
    }))

    useEffect(() => {
        dispatch({ type: "organizationInfo/queryStandList" });
        // 此处会有链式请求classList->majorList->collegeList
        dispatch({ type: "organizationInfo/queryClassList" });
    }, [adminSchoolId])


    const confirmInfo = () => {
        console.log('confirm student data:', dataSource);
        let errorMessage = []
        dataSource
            .forEach((rowData, index) => {
                let msg = ""
                if (!rowData.TrueName || rowData.TrueName === "") {
                    msg += "姓名不能为空!"
                }
                if (!rowData.StudentAccount || rowData.StudentAccount === "") {
                    msg += "账号不能为空!"
                }
                if (!rowData.IDNumber || rowData.IDNumber === "") {
                    msg += "证件号不能为空!"
                }
                if (!rowData.ExamNumber || rowData.ExamNumber === "") {
                    msg += "准考证号不能为空!"
                }
                if (!crtDataType) {
                    msg += "上传考生类型错误!"
                }
                else if (crtDataType === "school"
                    && (parseInt(rowData.ClassId) < 1 || parseInt(rowData.MajorId) < 1 || parseInt(rowData.CollegeId) < 1)) {
                    msg += "在校生班级设置有问题！"
                }
                if (msg !== "" && msg.length > 0) {
                    errorMessage.push(`第${index + 1}行答案设置有问题:` + msg)
                }
            })
        if (errorMessage.length > 0) {
            setErrorMessage(<>{errorMessage.map(e =>
                <p style={{ color: 'red', marginLeft: ".2rem" }}>{e}</p>)}</>);
            return;
        }

        setErrorMessage(null);

        dispatch({
            type: "organizationInfo/comfirmStudentImport",
            payload: dataSource,
            callback: res => {
                if (res.code == 1) {
                    message.success('导入学生信息完成');
                    const tableData = res.data.map((student, index) =>
                        ({ id: "student" + index, ...student }))
                    // console.log('导入的题目数据', res, tableData);
                    setTimeout(() => setDataSource(tableData))
                    setConfirmHidden(true);
                }
                else if (res.code == 0) {
                    message.error('导入学生信息错误：', res.msg);
                    setuo
                }
            }
        })
    }
    const initSelectedHandle = (selectedRows, onCleanSelected) => {
        const [modalForm] = ProForm.useForm();
        const [majorList, setMajorList] = useState()
        const [classList, setClassList] = useState()

        const collegeChanged = (collegeId) => {
            setMajorList(originMajorList?.filter(item => item.CollegeId === collegeId))
        }
        const majorChanged = (majorId) => {
            setClassList(originClassList?.filter(item => item.MajorId === majorId))
        }

        const handleSubmit = values => {
            let tableDataSource = dataSource;
            selectedRows.forEach(row => {
                let targetData = tableDataSource?.find(data => data.id === row.id)
                if (targetData) {
                    if (values["CollegeId"]) {
                        targetData["CollegeId"] = values["CollegeId"]
                    }
                    if (values["MajorId"]) {
                        targetData["MajorId"] = values["MajorId"]
                    }
                    if (values["ClassId"]) {
                        targetData["ClassId"] = values["ClassId"]
                    }
                }
            });
            setDataSource([...tableDataSource]);
            setConfirmHidden(false);
            onCleanSelected();
            return true;
        }

        return <ModalForm
            form={modalForm}
            title="批量修改"
            trigger={<Button type='link'>批量处理</Button>}
            onFinish={handleSubmit}>
            <ProFormSelect required label="学院名称" name="CollegeId"
                options={originCollegeList?.map(item => ({ label: item.CollegeName, value: item.Id, key: item.Id }))}
                onChange={collegeChanged} />
            <ProFormSelect required label="专业名称" name="MajorId"
                options={majorList?.map(item => ({ label: item.MajorName, value: item.MajorId, key: item.MajorId }))}
                onChange={majorChanged}
            />
            <ProFormSelect required label="班级名称" name="ClassId"
                options={classList?.map(item => ({ label: item.ClassName, value: item.Id, key: item.Id }))}
            />
        </ModalForm>
    }

    return <>
        <Divider orientation="left">上传在校生数据：</Divider>
        <UploadStudentFile
            dispatch={dispatch}
            studentType={"school"}
            onErrorMessage={setErrorMessage}
            onDataSourceChanged={(data) => { setDataSource(data); setConfirmHidden(false); setCrtDataType("school") }}
        />
        <br />
        <EditableProTable
            rowKey="id"
            headerTitle="导入的学生信息"
            scroll={{
                x: "9.6rem",
            }}
            pagination={{
                defaultPageSize: 15,
                showQuickJumper: true,
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
                        {initSelectedHandle(selectedRows, onCleanSelected)}
                    </div>
                );
            }}
            editable={{
                // type: 'multiple',
                editableKeys,
                onSave: async (rowKey, data, row) => {
                    console.log(rowKey, data, row);
                    setConfirmHidden(false);
                    // await waitTime(2000);
                    // return Promise.resolve(true);
                },
                onChange: setEditableRowKeys
            }}
        />
        {errorMessage}
        <Button hidden={confirmHidden} style={{ marginLeft: ".2rem" }} type='primary' onClick={confirmInfo}>确认导入</Button>
    </>
}

export default connect(({ dispatch, organizationInfo, user }) => ({
    dispatch,
    standList: organizationInfo.standList,
    adminSchoolId: user.adminSchoolId,
    originClassList: organizationInfo.classList,
    originMajorList: organizationInfo.majorList,
    originCollegeList: organizationInfo.collegeList,

}))(StudentListImport)
