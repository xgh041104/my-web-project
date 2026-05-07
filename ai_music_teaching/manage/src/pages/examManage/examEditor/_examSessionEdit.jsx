import React, { useRef, useEffect, useState } from 'react'
import { Button, Row, Col, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ModalForm, ProFormDateTimeRangePicker, ProTable, ProFormItem, ProForm } from '@ant-design/pro-components'
import moment from 'moment';
import TestPaperSelect from './_testPaperSelect'
import createFilter from 'utils/tableFilter'


const AddModal = (openModal) =>
  <Button icon={<PlusOutlined />} type='primary' onClick={openModal}>新建</Button>

function ExamSessionEdit({ dispatch, examInfo }) {

  const tableRef = useRef(null)
  const [form] = ProForm.useForm();
  const [crtExamSession, setCrtExamSession] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSubmit = values => {
    console.log(values, moment(values.examTime[0]).format('YYYY-M-D H:m:s'));
    const dispatchData = {
      "ExamId": examInfo.Id,
      "StartTime": moment(values.examTime[0]).format('YYYY-M-D H:m:s'),
      "EndTime": moment(values.examTime[1]).format('YYYY-M-D H:m:s'),
      "TestPaperId": values.TestPaperId || 0
    }
    console.log(dispatchData, crtExamSession);
    if (!crtExamSession) {
      dispatch({ type: 'examManage/createExamSession', payload: dispatchData });
    }
    else {
      dispatch({
        type: 'examManage/modifyExamSession',
        payload: { ...dispatchData, Id: crtExamSession.Id }
      });
      setCrtExamSession(null);
    }
    setIsModalOpen(false);
    setCrtExamSession(null);
    return true;
  }

  const removeExamSession = Id => {
    dispatch({ type: "examManage/removeExamSession", payload: { Id, ExamId: examInfo.Id } })
  }

  const modifyExamSession = session => {
    // console.log("examTime start", moment(session.StartTime, 'YYYY-M-D H:m:s') || moment())
    setCrtExamSession(session);
    const startDateTime = moment(session.StartTime, 'YYYY-M-D H:m:s')
    const endDateTime = moment(session.EndTime, 'YYYY-M-D H:m:s')
    form.setFieldsValue({
      examTime: [startDateTime.isValid() ? startDateTime : moment(), endDateTime.isValid() ? endDateTime : moment()],
      TestPaperId: session.TestPaperId
    })
    setIsModalOpen(true);
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (!examInfo || !examInfo.ExamSessionArr) {
      return;
    }
    tableRef.current?.reload()
  }, [examInfo])


  return <>
    <ModalForm
      form={form}
      title={<span>{crtExamSession ? "修改" : "新增"}考试场次</span>}
      modalProps={{ destroyOnClose: true, onCancel: () => setIsModalOpen(false) }}
      open={isModalOpen}
      onFinish={handleSubmit}
      width={"70vw"}
      layout='horizontal'
    >
      <ProFormDateTimeRangePicker name="examTime" label="考试时间" rules={[{ type: 'array', required: true, message: "请选择试卷" }]} />
      {/* <ProFormSelect label="试卷" name="TestPaperName" /> */}
      <ProFormItem name="TestPaperId" label="试卷" rules={[{ type: 'number', required: true, message: "请选择试卷" }]}  >
        <TestPaperSelect />
      </ProFormItem>
    </ModalForm>
    <ProTable
      width='xs'
      actionRef={tableRef}
      rowKey={record => "testPaper" + record.Id}
      cardBordered
      pagination={{
        defaultPageSize: 10,
        showQuickJumper: true,
      }}
      columns={[
        {
          title: '考试场次ID',
          dataIndex: 'Id',
          sorter: (a, b) => a.Id - b.Id,
          search: false,
          align: 'center',
        },
        {
          title: '考试时间',
          dataIndex: 'StartTime',
          search: false,
          align: 'center',
        },
        {
          title: '结束时间',
          dataIndex: 'EndTime',
          search: false,
          align: 'center',
        },
        {
          title: '试卷名称',
          dataIndex: 'TestPaperName',
          search: false,
          align: 'center',
        },
        {
          key: "operation",
          title: '操作',
          search: false,
          width: '2.5rem',
          align: 'center',
          render: (text, record, _, action) => [
            <Button key='operator_edit' type='link' onClick={() => modifyExamSession(record)}>编辑</Button>,
            <Popconfirm
              key={"operator_del"}
              title="是否确认删除该项？"
              onConfirm={() => removeExamSession(record.Id)}
              // onCancel={() => { message.error("取消删除") }}
              okText="删除"
              cancelText="取消"
            >
              <Button danger type='link' >删除</Button>
            </Popconfirm>,

          ],
          search: false,
        },
      ]}
      toolBarRender={() => [
        AddModal(openModal),
      ]}
      // request={(params, sort, filter) => {
      // return tableFilter(params, sort, filter);
      // return Promise.resolve({
      //     data: () => {
      //         return examInfo?.ExamSessionArr || [];
      //     }
      // })
      // }}
      request={(params, sort, filter) => {
        return Promise.resolve({
          data: createFilter(examInfo?.ExamSessionArr || [], params),
          success: true
        })
      }}
    />
    {/* <Row>
            <Col offset={10} span={2}>
                <Button type="primary" >取消</Button>
            </Col>
            <Col span={2}>
                <Button type="primary" htmlType="submit">提交</Button>
            </Col>
        </Row> */}
  </>
}

export default ExamSessionEdit