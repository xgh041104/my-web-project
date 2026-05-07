import { Typography, Switch, Button, Popconfirm, Table } from 'antd'
import { ProTable } from '@ant-design/pro-components'
import React, { useRef, useEffect } from 'react'
import { connect, history } from 'umi'

const { Text } = Typography

function ExamReview({ dispatch, examReviewList, adminSchoolId }) {

  const examTableRef = useRef()

  const viewExamDetail = (Id) => {

    // history.push({ pathname: '/examManage/examEditor', state: { ExamId: Id } })
  }

  const approvalExam = (ExamId) => {
    dispatch({
      type: "examManage/approvalExam", payload: { ExamId }
    })
  }

  /* "Id": 1,
          "SchoolId": 1,
          "ExamName": "测试试卷35",
          "ExamDescribe": "灌灌灌灌灌",
          "ExamStatus": 1,
          "FaceVerify": 1,
          "State": 2,
          "ReviewFlag":1,
          "ExamSessionArr": [ */

  const tableFilter = (params, sort, filter) => {
    return Promise.resolve({
      data: () => {
        return examReviewList?.filter((item) => {
          let result = true;
          if (params.ExamName) {
            result = (result && item.ExamName.indexOf(params.ExamName) != -1);
          }
          if (params.ExamDescribe) {
            result = (result && item.ExamDescribe.indexOf(params.ExamDescribe) != -1);
          }
          if (params.ExamStudentArr) {
            result = (result && item.ExamStudentArr.some(s => s.TrueName.indexOf(params.ExamStudentArr) != -1));
          }
          if (adminSchoolId && adminSchoolId > 0) {
            result = (result && item.SchoolId === adminSchoolId)
          }
          return result;
        })
      },
      success: true,
    })
  }

  useEffect(() => {
    examTableRef.current?.reload();
  }, [examReviewList])

  useEffect(() => {
    dispatch({ type: "examManage/queryExamReviewList" })
  }, [adminSchoolId])
  const expandedRowRender = function (record, index, indent, expanded) {
    // console.log('update childtable', record);
    return <Table
      dataSource={[...record.ExamSessionArr]}// 避免删除时无法刷新掉已删除的项
      rowKey={'Id'}
      columns={[
        {
          title: '考试场次ID',
          dataIndex: 'Id',
          sorter: (a, b) => a.Id - b.Id,
          align: 'center',

        },
        {
          title: '试卷名称',
          dataIndex: 'TestPaperName',
          align: 'center',
        },
        {
          title: '开考时间',
          dataIndex: 'StartTime',
          align: 'center',
        },
        {
          title: '结束时间',
          dataIndex: 'EndTime',
          align: 'center',
        },
        {
          title: '答题限时',
          dataIndex: 'ExamDuration',
          align: 'center',
        },
        {
          key: "operation",
          title: '操作',
          align: 'center',
          render: (text, sessionRecord) =>
            record.ReviewFlag === 0 ?
              <Popconfirm
                key={"operator_approval"}
                title="是否批准此考试信息通过审核？"
                onConfirm={() => approvalExam(sessionRecord.ExamId)}
                // onCancel={() => { message.error("取消删除") }}
                okText="确认"
                cancelText="取消"
              >
                <Button danger type='link'>待审核</Button>
              </Popconfirm> : <Text style={{ background: "lightgreen" }}>已审核</Text>

          ,
        },

      ]}
      pagination={false}
    />
  }
  const columns = [
    {
      title: '考试ID',
      dataIndex: 'Id',
      sorter: (a, b) => a.Id - b.Id,
      search: false,
      align: 'center',
    },
    {
      title: '考试主题',
      dataIndex: 'ExamName',
      align: 'center',

    },
    {
      title: '考试说明',
      dataIndex: 'ExamDescribe',
      align: 'center',
      render: (dom) => <Text style={{ width: '2rem' }}
        ellipsis={{ tooltip: dom }}>
        {dom}
      </Text>
    },
    {
      title: '考试人员',
      dataIndex: 'ExamStudentArr',
      align: 'center',
      render: (students) => {
        const showNames = students?.map(s => s.TrueName).join('、');
        return <Text style={{ width: '2rem' }}
          ellipsis={{ tooltip: showNames }}>
          {showNames}
        </Text>
      }
    },
    {
      title: '考试状态',
      dataIndex: 'ExamStatus',
      align: 'center',
      search: false,
      render: (value) => (<Switch disabled checkedChildren="开启" unCheckedChildren="关闭" checked={value || 0} />),
    },
    // {
    //   title: '人脸识别验证',
    //   dataIndex: 'FaceVerify',
    //   align: 'center',
    //   search: false,
    //   render: (value) => <Switch disabled checkedChildren="开启" unCheckedChildren="关闭" checked={value || 0} />
    // },
    // {
    //     key: "operation",
    //     title: '操作',
    //     render: (text, record, index, action) => [
    //         // <Button key='operator_edit' type='link' onClick={() => viewExamDetail(record.Id)}>查看</Button>,
    //     ],
    //     search: false,
    // },
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
    expandable={{
      defaultExpandedRowKeys: ["0"],
      expandedRowRender
    }}
    columns={columns}
    request={tableFilter}
  />
}

export default connect(({ dispatch, examManage, user }) => ({
  dispatch,
  examReviewList: examManage.examReviewList,
  adminSchoolId: user.adminSchoolId
}))(ExamReview)
