import React, { useRef, useEffect } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Rate, Popconfirm, Typography, Modal, Table, Select, DatePicker } from 'antd';
import moment from 'moment';
import { history, connect } from 'umi';
import usePageState from '@/hooks/usePageState';


const { Text } = Typography;

const { RangePicker } = DatePicker;

// //1：单选、2：多选、3：判断、4：填空、5：实操
// const AddModal = () =>
//     <Button icon={<PlusOutlined />} type='primary'
//         onClick={() => history.push('/questionManage/questionEditor')} >新建</Button>

function RecordListView({ questionRecord, title }) {
  const tableRef = useRef();

  useEffect(() => {
    tableRef.current?.reload();
  }, [questionRecord])

  return <ProTable
    actionRef={tableRef}
    headerTitle={<span>{title}</span>}
    rowKey={record => record.StudentId}
    cardBordered
    pagination={{
      defaultPageSize: 10,
      showQuickJumper: true,
    }}

    columns={[
      {
        title: '学生ID',
        dataIndex: 'StudentId',
        sorter: (a, b) => a.StudentId - b.StudentId,
        search: false,
        align: 'center',
      },
      {
        title: '姓名',
        dataIndex: 'TrueName',
        align: 'center',
      },
      {
        title: '练习次数',
        dataIndex: 'StudentNum',
        sorter: (a, b) => a.StudentNum - b.StudentNum,
        search: false,
        align: 'center',
      },
      {
        title: '最近一次',
        dataIndex: 'MaxTime',
        align: 'center',
        // renderFormItem: () => <Select options={[
        //     { label: "最近一天", value: 1 },
        //     { label: "最近一个星期", value: 2 },
        //     { label: "最近一个月", value: 3 }]} />,
        renderFormItem: () => <RangePicker showTime />
      }
    ]}
    toolBarRender={() => [
      // AddModal(dispatch),
    ]}
    request={(params, sort, filter) => {
      return Promise.resolve({
        data: () => {
          // return questionList;
          return questionRecord?.filter((item) => {
            let result = true;
            // 筛选实操题
            if (params.TrueName) {
              result = (result && item.TrueName.indexOf(params.TrueName) != -1);
            }
            if (params.MaxTime) {
              result = (result && moment(params.MaxTime[0]).isBefore(item.MaxTime)
                && moment(params.MaxTime[1]).isAfter(item.MaxTime))
            }
            return result;
          });
        },
        success: true,
      })
    }}
  />
}

function PracticeRecordList({ dispatch, questionList, adminSchoolId }) {

  const tableRef = useRef();
  const pageState = usePageState("questionManage", "pageNumber");

  useEffect(() => {
    tableRef.current?.reload();
  }, [questionList])

  useEffect(() => {
    dispatch({ type: "questionManage/queryQuestionList", payload: 0 })
  }, [adminSchoolId])


  const removeQuestion = (QuestionId) => {
    dispatch({ type: "questionManage/removeQuestion", payload: { QuestionId } })
  }

  const modifyQuestion = (QuestionId) => {
    history.push({ pathname: "/questionManage/questionEditor", state: { QuestionId } })
  }

  // const viewQuestion = (QuestionId) => {
  //     dispatch({
  //         type: "questionManage/queryQuestion", payload: { QuestionId }, callback: (detail) => {
  //             Modal.info({
  //                 title: '单题预览',
  //                 content: (
  //                     <QuestionsCom detail={detail} index={0} questionId={QuestionId} showAnswer={true} noCheckAnswer={true} />
  //                 ),
  //                 width: '60vw',
  //             });
  //         }
  //     });
  // }
  const viewRecord = (question) => {
    dispatch({
      type: "questionManage/queryQuestionRecord", payload: { QuestionId: question.QuestionId }, callback: (detail) => {
        Modal.info({
          title: '记录详情',
          content: <RecordListView questionRecord={detail} title={question.QuestionId + "、" + question.QuestionName} />,
          width: '70vw',
        });
      }
    });
  }

  return (
    <ProTable
      actionRef={tableRef}
      headerTitle="题库列表"
      rowKey={record => record.QuestionId}
      cardBordered
      pagination={{
        ...pageState,
        defaultPageSize: 10,
        showQuickJumper: true,
      }}
      columns={[
        {
          title: '题目ID',
          dataIndex: 'QuestionId',
          align: 'center',
          sorter: (a, b) => a.QuestionId - b.QuestionId,
          search: false,
        },
        {
          title: '题干',
          dataIndex: 'QuestionName',
          align: 'center',
          render: (dom) => <Text style={{ width: '2rem' }}
            ellipsis={{ tooltip: dom }}>
            {dom}
          </Text>
        },
        // {
        //     //1：单选、2：多选、3：判断、4：填空、5：实操
        //     title: '题目限制',
        //     dataIndex: 'QuestionCategory',
        //     filters: true,
        //     onFilter: true,
        //     // render: (value) => ["单选题", "多选题", "判断题", "填空题", "实操题"][value - 1]
        //     valueEnum: {
        //         0: "通用题",
        //         1: "只可训练题",
        //         2: "只可考试题",
        //     }
        // },
        // {
        //     //1：单选、2：多选、3：判断、4：填空、5：实操
        //     title: '题目类型',
        //     dataIndex: 'QuestionType',
        //     filters: true,
        //     onFilter: true,
        //     // render: (value) => ["单选题", "多选题", "判断题", "填空题", "实操题"][value - 1]
        //     valueEnum: {
        //         1: "单选题",
        //         2: "多选题",
        //         3: "判断题",
        //         4: "填空题",
        //         5: "实操题",
        //     }
        // },
        {
          title: '所属课程',
          dataIndex: 'CourseName',
          align: 'center',
        },
        {
          title: '所属专业',
          dataIndex: 'MajorName',
          align: 'center',
        },
        {
          title: '所属学院',
          dataIndex: 'CollegeName',
          align: 'center',
        },
        {
          title: '难度等级',
          dataIndex: 'Digree',
          align: 'center',
          render: (value) => <Rate disabled defaultValue={value} />,
          sorter: (a, b) => a.Digree - b.Digree,
          search: false
        },
        {
          key: "operation",
          title: '操作',
          width: '2.5rem',
          render: (text, record, _, action) => [
            <Button key='operator_view' type='link' onClick={() => {
              viewRecord(record);
            }}>查看详情</Button>,
            // <Popconfirm
            //     key={"operator_del"}
            //     title="是否确认删除该项？"
            //     onConfirm={() => removeQuestion(record.QuestionId)}
            //     // onCancel={() => { message.error("取消删除") }}
            //     okText="删除"
            //     cancelText="取消"
            // >
            //     <Button danger type='link'>删除</Button>
            // </Popconfirm>,
          ],
          search: false,
          align: 'center',
        },
      ]}
      toolBarRender={() => [
        // AddModal(dispatch),
      ]}
      request={(params, sort, filter) => {
        return Promise.resolve({
          data: () => {
            // return questionList;
            return questionList?.filter((item) => {
              // 筛选实操题
              let result = item.QuestionType == 5;
              if (params.QuestionName) {
                result = (result && item.QuestionName.indexOf(params.QuestionName) != -1);
              }
              if (params.QuestionCategory) {
                result = (result && item.QuestionCategory == params.QuestionCategory);
              }

              if (params.CourseName) {
                result = (result && item.CourseName.indexOf(params.CourseName) != -1);
              }
              if (params.MajorName) {
                result = (result && item.MajorName.indexOf(params.MajorName) != -1);
              }
              if (params.CollegeName) {
                result = (result && item.CollegeName.indexOf(params.CollegeName) != -1);
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
  )
}

export default connect(({ dispatch, questionManage, user }) => ({
  dispatch,
  questionList: questionManage.questionList,
  adminSchoolId: user.adminSchoolId
}))(PracticeRecordList)
