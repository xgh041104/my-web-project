import { ModalForm, ProFormDateTimeRangePicker, ProFormSelect, ProTable } from '@ant-design/pro-components'
import React, { useState, useEffect, useRef } from 'react'
import moment from 'moment'
import { message, Button } from 'antd'
import { connect } from 'umi'

const AddModal = (handleSubmit, studentOptions) => {

    return <ModalForm
        title="新增补考"
        trigger={<Button type='primary'>新增补考</Button>}
        onFinish={handleSubmit}>
        <ProFormDateTimeRangePicker name="examTime" label="考试时间"
            rules={[{ type: 'array', required: true, message: "请选择试卷" }]} />
        <ProFormSelect name="StudentIdArr" label="选择补考学生" options={studentOptions} mode="multiple" required />
    </ModalForm>
}

function ResetExamManage({ dispatch, examResultDetail, resetExamList }) {

    const unknowExamSession = !examResultDetail || !Array.isArray(examResultDetail) || examResultDetail.length < 1
        || !(examResultDetail[0].ExamSessionId);
    if (unknowExamSession) {
        message.warning("未查询到考试场次信息!")
    }

    const examTableRef = useRef()
    const [studentOptions, setStudentOptions] = useState([])

    const handleSubmit = values => {
        console.log("已选择补考学生", values.StudentIdArr);
        if (unknowExamSession) {
            return false;
        }
        dispatch({
            type: "examManage/createResetExam", payload: {
                "OldExamSessionId": examResultDetail[0].ExamSessionId,
                "StudentIdArr": values.StudentIdArr,
                "OldExamId": examResultDetail[0].ExamId,
                "StartExamTime": moment(values.examTime[0]).format('YYYY-M-D H:m:s'),
                "EndExamTime": moment(values.examTime[1]).format('YYYY-M-D H:m:s'),
            }
        })
        return true;
    }

    const tableFilter = (params, sort, filter) => {
        return Promise.resolve({
            data: resetExamList?.filter((item) => {
                let result = true;
                Object.entries(params).forEach(([key, value]) => {
                    if (key == "current" || key == "pageSize") {
                        return;
                    }
                    const dataKey = key.replace("search", "")
                    if (item.hasOwnProperty(dataKey)) {
                        result = (result && item[dataKey].indexOf(value) != -1)
                    }
                })
                // console.log(`get ${JSON.stringify(params)} true name :`, item.TrueName, result);
                return result;
            }),
            // data:  () => {
            //     return resetExamList || [];
            // },
            success: true,
        })
    }

    useEffect(() => {
        examTableRef.current?.reload();
    }, [studentOptions])


    useEffect(() => {
        examTableRef.current?.reload();
        if (unknowExamSession) {
            return;
        }
        dispatch({
            type: "examManage/qeuryResetExamStudents",
            payload: { ExamSessionId: examResultDetail[0].ExamSessionId },
            callback: resetExamStudents =>
                setStudentOptions(
                    resetExamStudents?.map(s => ({
                        label: s.TrueName,
                        value: s.StudentId
                    }))
                )
        });
    }, [resetExamList])


    useEffect(() => {
        if (unknowExamSession) {
            return;
        }
        dispatch({
            type: "examManage/qeuryResetExamList", payload: {
                ExamSessionId: examResultDetail[0].ExamSessionId
            }
        })
    }, [examResultDetail])


    const columns = [
        {
            title: '学生ID',
            dataIndex: 'StudentId',
            sorter: (a, b) => a.StudentId - b.StudentId,
            search: false,
        },
        {
            title: '姓名',
            dataIndex: 'TrueName',
        },
        {
            title: '试卷',
            dataIndex: 'TestPaperName',
        },
        {
            title: '考试时间',
            dataIndex: 'StartExamTime',
            search:false,
        },
        {
            title: '考试状态',
            dataIndex: 'Status',
            search: false,
            render: value => value === 0 ? "未完成考试" : "已完成考试"
        }
    ]
    return <ProTable
        style={{ marginTop: '.3rem' }}
        rowKey={"Id"}
        actionRef={examTableRef}
        cardBordered
        pagination={{
            defaultPageSize: 10,
            showQuickJumper: true,
        }}
        columns={columns}
        toolBarRender={() => studentOptions && studentOptions.length > 0
            && AddModal(handleSubmit, studentOptions)

        }
        request={tableFilter}
    />

}

export default connect(({ dispatch, examManage }) => ({
    dispatch,
    examResultDetail: examManage.examResultDetail,
    resetExamList: examManage.resetExamList
}))(ResetExamManage)