import React, { useRef, useEffect, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Rate, Popconfirm, Typography, Modal } from 'antd';
import { history, connect } from 'umi';
import QuestionsCom from './_questiondisplay';
import usePageState from '@/hooks/usePageState.ts';  //自定义hooks
import { questionTypeEnum } from 'components/Questions';

const { Text } = Typography;

const AddModal = () =>
  <Button icon={<PlusOutlined />} type='primary'
    onClick={() => history.push('/questionManage/questionEditor')} >新建</Button>


function QuestionList({ dispatch, questionList, adminSchoolId }) {

  const tableRef = useRef();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const pageState = usePageState("questionManage");

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

  const viewQuestion = (QuestionId) => {
    dispatch({
      type: "questionManage/queryQuestion", payload: { QuestionId }, callback: (detail) => {
        Modal.info({
          title: '单题预览',
          content: (
            <QuestionsCom dispatch={dispatch} detail={detail} index={0} questionId={QuestionId} showAnswer={true} noCheckAnswer={true} />
          ),
          width: '60vw',
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
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
      }}
      columns={[
        {
          title: '题目ID',
          dataIndex: 'QuestionId',
          sorter: (a, b) => a.QuestionId - b.QuestionId,
          search: false,
          align: 'center',
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
        {
          title: '题目描述',
          dataIndex: 'QuestionDescribe',
          align: 'center',
          render: (dom) => <Text style={{ width: '2rem' }}
            ellipsis={{ tooltip: dom }}>
            {dom}
          </Text>
        },
        {
          //1：单选、2：多选、3：判断、4：填空、5：实操
          title: '题目限制',
          dataIndex: 'QuestionCategory',
          filters: true,
          onFilter: true,
          align: 'center',
          // render: (value) => ["单选题", "多选题", "判断题", "填空题", "实操题"][value - 1]
          valueEnum: {
            0: "通用题",
            1: "只可训练题",
            2: "只可考试题",
          }
        },
        {
          //1：单选、2：多选、3：判断、4：填空、5：实操
          title: '题目类型',
          dataIndex: 'QuestionType',
          filters: true,
          onFilter: true,
          align: 'center',
          // render: (value) => ["单选题", "多选题", "判断题", "填空题", "实操题"][value - 1]
          valueEnum: questionTypeEnum
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
          align: 'center',
          render: (text, record, _, action) => record.QuestionType <= 5 ? [
            // TODO:将这些操作统一封装到自定义table里面
            <Button key='operator_edit' type='link'
              onClick={() => modifyQuestion(record.QuestionId)}>编辑</Button>,
            <Button key='operator_view' type='link' onClick={() => {
              viewQuestion(record.QuestionId);
            }}>预览</Button>,
            <Popconfirm
              key={"operator_del"}
              title="是否确认删除该项？"
              onConfirm={() => removeQuestion(record.QuestionId)}
              // onCancel={() => { message.error("取消删除") }}
              okText="删除"
              cancelText="取消"
            >
              <Button danger type='link'>删除</Button>
            </Popconfirm>,
          ] : [],
          search: false,
          align: 'center',
        },
      ]}
      toolBarRender={() => [
        <Button
          key="batchDelete"
          danger
          disabled={selectedRowKeys.length === 0}
          onClick={() => {
            Modal.confirm({
              title: '确认批量删除?',
              content: `确认删除选中的 ${selectedRowKeys.length} 项吗？`,
              onOk: () => {
                dispatch({ type: "questionManage/removeQuestion", payload: { QuestionIds: selectedRowKeys } });
                setSelectedRowKeys([]);
              }
            });
          }}
        >
          批量删除
        </Button>,
        AddModal(),
      ]}
      request={(params, sort, filter) => {
        return Promise.resolve({
          data: () => {
            // return questionList;
            return questionList?.filter((item) => {
              let result = true;
              if (params.QuestionName) {
                result = (result && item.QuestionName.indexOf(params.QuestionName) != -1);
              }
              if (params.QuestionCategory) {
                result = (result && item.QuestionCategory == params.QuestionCategory);
              }
              if (params.QuestionType) {
                result = (result && item.QuestionType == params.QuestionType);
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
  adminSchoolId: user.adminSchoolId,

}))(QuestionList)
