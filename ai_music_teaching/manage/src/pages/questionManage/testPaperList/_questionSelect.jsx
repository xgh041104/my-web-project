import { ProTable } from '@ant-design/pro-components'
import { Button, Input, Modal, Checkbox, Space, Table, Typography, Rate, Popconfirm, Form } from 'antd'
import React, { useState, useEffect } from 'react'
import { connect } from 'umi'
// import tableFilter from 'utils/tableFilter'
import QuestionsCom from '../_questiondisplay';
import { questionTypeEnum } from 'components/Questions';

const { Text } = Typography;

const EditCell = ({ onFinish, value }) => {
  const [inputValue, setInputValue] = useState();

  useEffect(() => {
    if (!value || value === "") {
      return;
    }
    setInputValue(value)
  }, [value])

  const handleFinished = () => {
    onFinish(inputValue);
  }
  const handleChange = e => {
    setInputValue(e.target.value)
  }
  return <Input value={inputValue} onChange={handleChange} onPressEnter={handleFinished} onBlur={handleFinished} />
}

function QuestionSelect({ value, onChange, fullScore, questionList, dispatch }) {
  const [questionData, setQuestionData] = useState([
    {
      "QuestionType": 1,
      "FullMarksRatio": 0,
      "QuestionArr": []
    },
    {
      "QuestionType": 2,
      "FullMarksRatio": 0,
      "QuestionArr": []
    },
    {
      "QuestionType": 3,
      "FullMarksRatio": 0,
      "QuestionArr": []
    },
    {
      "QuestionType": 4,
      "FullMarksRatio": 0,
      "QuestionArr": []
    },
    // {
    //     "QuestionType": 5,
    //     "FullMarksRatio": 0,
    //     "QuestionArr": []
    // },
    // {
    //     "QuestionType": 6,
    //     "FullMarksRatio": 0,
    //     "QuestionArr": []
    // },
    // {
    //     "QuestionType": 7,
    //     "FullMarksRatio": 0,
    //     "QuestionArr": []
    // },
    // {
    //     "QuestionType": 8,
    //     "FullMarksRatio": 0,
    //     "QuestionArr": []
    // },
    // {
    //     "QuestionType": 9,
    //     "FullMarksRatio": 0,
    //     "QuestionArr": []
    // },
    // {
    //     "QuestionType": 10,
    //     "FullMarksRatio": 0,
    //     "QuestionArr": []
    // },
  ])
  const [selectOpen, setSelectOpen] = useState(false);
  // 选中的题
  // {
  //     "QuestionType": number,
  //     "QuestionId": number,
  //     "Score": number,
  //     "QuestionName": string
  // }[]
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const handleModalCancel = () => {
    setSelectedQuestions([]);
    setSelectOpen(false);
  }

  useEffect(() => {
    if (!value || value.length < 1 || JSON.stringify(value) === JSON.stringify(questionData)) {
      return;
    }
    setQuestionData(value);
  }, [value])

  const removeSelectQuestion = (QuestionId) => {
    let newQuestionData = questionData.map(qts => {
      const qId = qts.QuestionArr.findIndex(q => q.QuestionId === QuestionId)
      if (qId === -1) {
        return qts;
      }
      let newQts = qts;
      const minusScore = parseFloat(qts.QuestionArr[qId].Score) || 0;
      newQts.QuestionArr.splice(qId, 1);
      newQts.FullMarksRatio -= minusScore;
      return newQts;
    })
    setQuestionData([...newQuestionData]);
    onChange?.(newQuestionData);
  }

  const onQuestionScoreChange = (QuestionType, QuestionId, score) => {
    if (QuestionType < 1 || QuestionType > questionData.length) {
      return;
    }
    let newQuestionData = questionData;
    let newQuestionArr = newQuestionData[QuestionType - 1].QuestionArr;
    let targetQuestion = newQuestionArr.find(q => q.QuestionId === QuestionId);
    if (targetQuestion) {
      targetQuestion["Score"] = parseFloat(score) || 0;
      let typeScore = 0;
      newQuestionData[QuestionType - 1].QuestionArr.forEach(q => {
        typeScore += (parseFloat(q.Score) || 0)
      })
      newQuestionData[QuestionType - 1].FullMarksRatio = typeScore;

      setQuestionData([...newQuestionData]);
      onChange(newQuestionData);
    }
    else {
      console.error('未找到要修改分数的目标题目');
    }
  }

  const onQuestionTypeScoreChange = (QuestionType, score) => {
    let newQuestionData = questionData; // 记录选择后的当前题型的题数
    const typeFullScore = parseFloat(score) || 0 // 题型总分
    newQuestionData[QuestionType - 1].FullMarksRatio = typeFullScore; // 设置题型总分
    // 按题目数量平均分
    const average = Math.floor(typeFullScore / newQuestionData[QuestionType - 1].QuestionArr.length)
    // 计算平均分后的余分
    const remainder = typeFullScore % newQuestionData[QuestionType - 1].QuestionArr.length
    newQuestionData[QuestionType - 1].QuestionArr =
      newQuestionData[QuestionType - 1].QuestionArr.map((q, index) => ({
        ...q,
        // 设置题目分数,最后一个题目分数加上余分
        Score: average + (index === newQuestionData[QuestionType - 1].QuestionArr.length - 1 ? remainder : 0)
      }))
    setQuestionData([...newQuestionData]);
    onChange(newQuestionData);
  }

  const questionCheck = (isChecked, question, index) => {
    let newSelectedQuestions = selectedQuestions;
    newSelectedQuestions[index.toString()] = isChecked ? question : null;
    setSelectedQuestions({ ...newSelectedQuestions })
  }
  const viewQuestion = (question) => {
    Modal.info({
      title: '题目预览',
      content: <QuestionsCom showAnswer={true} noCheckAnswer={true} detail={question} questionId={question.QuestionId} index={question.QuestionId} />,
      width: '60vw',
      closable: true,
    });
  }

  const selectConfirm = () => {
    // 计算每个题型的平均分
    let newQuestionData = questionData;// 获取当前题目列表

    // 将选中的题目添加到题型列表中
    for (const [key, question] of Object.entries(selectedQuestions)) {
      if (!question) {
        continue;
      }
      // 获取题型列表
      let targetQuestionArr = newQuestionData[question.QuestionType - 1].QuestionArr;
      targetQuestionArr.push({
        QuestionId: question.QuestionId, QuestionName: question.QuestionName, Score: 0
      });
    }

    let average = 0;
    let remainder = 0;
    let lastQtsIndex = 0;
    // 过滤掉没有题目的题型,将总分平均到每个有题目的题型上
    if (fullScore && newQuestionData.length != 0) {
      const questionTypeCount = newQuestionData.filter((q, index) => {
        if (q.QuestionArr.length > 0) {
          lastQtsIndex = index
          return true;
        }
        return false;
      }).length;
      const fullScoreInt = parseInt(fullScore) || 0
      if (fullScoreInt !== 0) {
        average = Math.floor(fullScoreInt / questionTypeCount)
        remainder = fullScoreInt % questionTypeCount;
      }
    }

    // 将题型总分平均到题型里的每个题目
    newQuestionData = newQuestionData.map((qts, index) => {
      if (average === 0 || qts.QuestionArr.length === 0) {
        return qts;
      }
      let newQts = qts;
      //  设置题型总分, 将最后一个有题目的题型的总分加上余分
      newQts.FullMarksRatio = average + (index === lastQtsIndex ? remainder : 0);
      const questionAverage = Math.floor(newQts.FullMarksRatio / newQts.QuestionArr.length)
      const questionRemainder = newQts.FullMarksRatio % newQts.QuestionArr.length
      newQts.QuestionArr = newQts.QuestionArr.map((q, qID) => ({
        ...q, Score: questionAverage + (qID === newQts.QuestionArr.length - 1 ? questionRemainder : 0)
      }))
      return newQts;
    })



    setSelectedQuestions([]);
    setQuestionData([...newQuestionData]);
    onChange([...newQuestionData]);
    setSelectOpen(false);
  }

  const selectAll = () => {
    const onRadioChange = (isChecked) => {
      //TODO:选择当前页题目
    }
    return <Checkbox onChange={e => onRadioChange(e.target.checked)}>选择当前页题目</Checkbox>
  }

  useEffect(() => {
    if (!questionList || typeof (questionList) !== "list" || questionList.length < 1) {
      dispatch({ type: "questionManage/queryQuestionList", payload: 1 })// 查询可考试题目列表
    }
  }, [])

  const expandedRowRender = function (record, index, indent, expanded) {
    // console.log('update childtable', record);        
    return <Table
      dataSource={[...record.QuestionArr]}// 避免删除时无法刷新掉已删除的项
      rowKey={row => `childTable${record.QuestionType}_${row.QuestionId}`}
      columns={[
        {
          title: '题目ID',
          dataIndex: 'QuestionId',
          sorter: (a, b) => a.QuestionId - b.QuestionId
        },
        {
          title: '题干',
          dataIndex: 'QuestionName',
          render: (dom) => <Text style={{ width: '2rem' }}
            ellipsis={{ tooltip: dom }}>
            {dom}
          </Text>
        },
        // {
        //     title: '难度等级',
        //     dataIndex: 'Digree',
        //     render: (value) => <Rate disabled defaultValue={value} />
        // },
        {
          title: '单题分数(分)',
          dataIndex: 'Score',
          render: (preValue, childRecord) => (
            <EditCell
              value={preValue.toFixed(1)}
              onFinish={value => onQuestionScoreChange(record.QuestionType, childRecord.QuestionId, value)}
            />
          )

        },
        {
          key: "operation",
          title: '操作',
          render: (text, record) => <>
            <Popconfirm
              key={"operator_del"}
              title="是否确认删除该项？"
              onConfirm={() => removeSelectQuestion(record.QuestionId)}
              // onCancel={() => { message.error("取消删除") }}
              okText="删除"
              cancelText="取消"
            >
              <Button danger type='link'>删除</Button>
            </Popconfirm>
          </>
          ,
        },
      ]}
      pagination={false}
      style={{ width: '60vw' }}
    />
  }

  return <>
    <Modal
      width={'12rem'}
      open={selectOpen}
      onCancel={handleModalCancel}
      onOk={selectConfirm}
      destroyOnClose
    >
      <ProTable
        style={{ marginTop: '.3rem' }}
        // headerTitle={}
        rowKey={record => record.QuestionId}
        cardBordered
        pagination={{
          defaultPageSize: 6,
          showQuickJumper: true,
        }}
        columns={[
          {
            title: '题目ID',
            dataIndex: 'QuestionId',
            sorter: (a, b) => a.QuestionId - b.QuestionId,
            search: false,
          },
          {
            title: '题干',
            dataIndex: 'QuestionName',
            render: (dom) => <Text style={{ width: '2rem' }}
              ellipsis={{ tooltip: dom }}>
              {dom}
            </Text>
          },
          {
            title: '难度等级',
            dataIndex: 'Digree',
            search: false,
            render: (value) => <Rate disabled defaultValue={value} />
          },
          {
            title: '题目类型',
            dataIndex: 'QuestionType',
            // render: (value) => ["单选题", "多选题", "判断题", "填空题", "实操题"][value - 1]
            valueEnum: questionTypeEnum
          },
          {
            title: '所属课程',
            dataIndex: 'CourseName',
          },
          {
            title: '所属专业',
            dataIndex: 'MajorName',
          },
          {
            title: '所属学院',
            dataIndex: 'CollegeName',
          },
          {
            key: "operation",
            // dataIndex: 'checked',
            title: '操作',
            render: (text, record, index, action) => record.QuestionType <= 5 ? [
              <Button key='operation_view' type='link' onClick={() => viewQuestion(record)}>查看题目详情</Button>
            ] : [],
            search: false,
          },
        ]}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
        }}
        tableAlertRender={({
          selectedRowKeys,
          selectedRows,
          onCleanSelected,
        }) => {
          setSelectedQuestions(selectedRows);

          return (
            <div>
              <span>
                已选 {selectedRowKeys.length} 项
              </span>
            </div>
          );
        }}
        toolBarRender={() => [
          // selectAll()
        ]}
        request={(params, sort, filter) => {
          return Promise.resolve({
            data: () => {
              const unselectedQuestions = questionList.filter(q => {
                return questionData[q.QuestionType - 1]?.QuestionArr ?
                  questionData[q.QuestionType - 1].QuestionArr.every(checkQuestion =>
                    q.QuestionId !== checkQuestion.QuestionId) : true
              });
              return unselectedQuestions.filter((item) => {
                let result = true;
                Object.entries(params).forEach(([key, value]) => {
                  if (key == "current" || key == "pageSize") {
                    return;
                  }
                  if (item.hasOwnProperty(key)) {
                    const dataValue = item[key];
                    if (typeof dataValue === "string") {
                      result = (result && dataValue.indexOf(value) != -1)
                    }
                    else if (typeof dataValue === "number") {
                      result = (result && dataValue == value)

                    }

                  }
                })
                // console.log(`get ${JSON.stringify(params)} true name :`, item.TrueName, result);
                return result;
              })
            },
            success: true,
          })
        }}
      />
    </Modal >
    <Table
      style={{ width: "70vw" }}
      title={() => <Button type='primary' onClick={() => setSelectOpen(true)} >选择题目</Button>}
      columns={[
        {
          title: '题目类型',
          dataIndex: 'QuestionType',
          // enum: questionTypeEnum,
          render: (value) => questionTypeEnum[value]
        },
        {
          title: '题目数量',
          dataIndex: 'QuestionArr',
          render: value => {
            // console.log('显示题目数量', value?.length || 0);
            return <p>{value?.length || 0}</p>
          }
        },
        {
          title: '题型总分(分)',
          dataIndex: 'FullMarksRatio',
          // render: value => value.toFixed(1),
          render: (preValue, record) => {
            return <EditCell value={preValue.toFixed(1)}
              // 每次编辑题型总分后重新平均分配题型内题目分数
              onFinish={value => onQuestionTypeScoreChange(record.QuestionType, value)} />
          }
        }
      ]}
      rowKey={row => row.QuestionType}
      dataSource={questionData}
      pagination={false}
      expandable={{
        expandedRowRender
      }}
    />
  </>
}

export default connect(({ questionManage, dispatch }) => ({
  questionList: questionManage.questionList,
  dispatch
}))(QuestionSelect)