import React, { useRef, useEffect } from 'react'
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Popconfirm, Button, Modal } from 'antd'
import { connect, history } from 'umi'
import PaperDisplayCom from './_paperdisplay';
import usePageState from '@/hooks/usePageState';

const AddModal = () =>
  <Button icon={<PlusOutlined />} type='primary'
    onClick={() => history.push('/questionManage/testPaperList/testPaperEditor')} >新建</Button>


function TestPaperList({ dispatch, testPaperList, adminSchoolId }) {
  const tableRef = useRef();
  const pageState = usePageState("questionManage");

  useEffect(() => {
    tableRef.current?.reload();
  }, [testPaperList])

  useEffect(() => {
    dispatch({ type: "testPaper/QueryTestPaperList" })
  }, [adminSchoolId])


  const removeTestPaper = (paperId) => {
    dispatch({ type: "testPaper/removeTestPaper", payload: { Id: paperId } })
  }
  const modifyQuestion = (paperId) => {
    // dispatch({type:"testPaper/QueryTestPaper", payload:{Id:paperId}})
    history.push({ pathname: "/questionManage/testPaperList/testPaperEditor", state: { paperId } })
  }

  const viewPaper = (paperId) => {
    dispatch({
      type: "testPaper/queryTestPaperDetail", payload: { Id: paperId }, callback: (detail) => {
        Modal.info({
          title: '试卷预览窗口',
          content: <PaperDisplayCom paperDetail={detail} />,
          width: '60vw',
          closable: true,
        });
      },
    });
  }

  return <ProTable
    actionRef={tableRef}
    headerTitle="试卷列表"
    rowKey={record => "testPaper" + record.Id}
    cardBordered
    pagination={{
      ...pageState,
      defaultPageSize: 10,
      showQuickJumper: true,
    }}
    columns={[
      {
        title: '试卷ID',
        dataIndex: 'Id',
        sorter: (a, b) => a.Id - b.Id,
        search: false,
        align: 'center',
      },
      {
        title: '试卷名称',
        dataIndex: 'TestPaperName',
        align: 'center',
      },
      {
        title: '试卷时长(分钟)',
        dataIndex: 'ExamDuration',
        search: false,
        sorter: (a, b) => a.Id - b.Id,
        align: 'center',
      },
      {
        title: '试卷总分(分)',
        dataIndex: 'FullMarks',
        search: false,
        sorter: (a, b) => a.Id - b.Id,
        align: 'center',
      },
      {
        title: '及格分数(分)',
        dataIndex: 'PassScore',
        search: false,
        sorter: (a, b) => a.Id - b.Id,
        align: 'center',
      },
      {
        title: '试卷类型',
        dataIndex: 'TestPaperType',
        align: 'center',
        // render: (value) => ["公共试卷", "专业试卷"][value - 1]
        valueEnum: {
          1: "公共试卷",
          2: "专业试卷",
        },
      },
      // {
      //   title: '所属课程',
      //   dataIndex: 'CourseName',
      //   align: 'center',
      // },
      // {
      //   title: '所属专业',
      //   dataIndex: 'MajorName',
      //   align: 'center',
      // },
      // {
      //   title: '所属学院',
      //   dataIndex: 'CollegeName',
      //   align: 'center',
      // },
      {
        key: "operation",
        title: '操作',
        width: '2.5rem',
        render: (text, record, _, action) => [
          <Button key='operator_edit' type='link' onClick={() => modifyQuestion(record.Id)}>编辑</Button>,
          <Button key='operator_view' type='link' onClick={() => {
            viewPaper(record.Id);
          }}>预览</Button>,
          <Popconfirm
            key={"operator_del"}
            title="是否确认删除该项？"
            onConfirm={() => removeTestPaper(record.Id)}
            // onCancel={() => { message.error("取消删除") }}
            okText="删除"
            cancelText="取消"
          >
            <Button danger type='link'>删除</Button>
          </Popconfirm>,
        ],
        search: false,
        align: 'center',
      },
    ]}
    toolBarRender={() => [
      AddModal(dispatch),
    ]}
    request={(params, sort, filter) => {
      return Promise.resolve({
        data: () => {
          return testPaperList?.filter((item) => {
            let result = true;
            if (params.TestPaperName) {
              result = (result && item.TestPaperName.indexOf(params.TestPaperName) != -1);
            }
            if (params.MajorName) {
              result = (result && item.MajorName.indexOf(params.MajorName) != -1);
            }
            if (params.CollegeName) {
              result = (result && item.CollegeName.indexOf(params.CollegeName) != -1);
            }
            if (params.CourseName) {
              result = (result && item.CourseName.indexOf(params.CourseName) != -1);
            }
            if (params.TestPaperType) {
              result = (result && item.TestPaperType == params.TestPaperType);
            }
            if (adminSchoolId && adminSchoolId > 0) {
              result = (result && item.SchoolId == adminSchoolId)
            }
            return result;
          });
        },
        success: true,
      })
    }}
  />

}

export default connect(({ testPaper, dispatch, user }) => ({
  dispatch,
  testPaperList: testPaper.testPaperList,
  adminSchoolId: user.adminSchoolId
}))(TestPaperList)