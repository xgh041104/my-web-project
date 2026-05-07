import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Divider, Radio, Rate, Popconfirm, Modal, Table, Space, message, Typography } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@umijs/max';
import UnloginEmpty from '../unlogin';
import QuestionsCom from '../questions/_questions';
import dayjs from 'dayjs';
import { questionTypes } from '../../utils/dict';

const { Text } = Typography;

// 练习弹窗函数式组件
export function PracticeModal({ title, isOpen, dataArray, closeModal, updateDetail, questionDetail, commitQuestionResult, PlanId }) {
  const dispatch = useDispatch();
  const userInfo = useSelector(state => state.user.userInfo);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [errorQuestions, setErrorQuestions] = useState([]); // 错题的Id
  const [errorAnswers, setErrorAnswers] = useState([]); // 错题的答案
  const questionRef = useRef();
  const checkAnswerFlag = useRef(false);

  // 结束练习，关闭窗口，处理练习数据
  const endPractice = useCallback(() => {
    closeModal();
    if (checkAnswerFlag.current) {
      const errorNum = errorQuestions.length;
      if (errorNum > 0) {
        Modal.confirm({
          title: '错题集确认',
          icon: <ExclamationCircleOutlined />,
          content: '共有错题' + String(errorNum) + '道，是否要将错题归档到错题集？',
          okText: '归档',
          cancelText: '不归档',
          onOk: () => {
            const data = errorQuestions?.map((item, index) => {
              return {
                QuestionId: item,
                StudentId: userInfo.userId,
                AnswerSteps: errorAnswers[index],
              }
            });
            dispatch({ type: 'trainingCenter/addErrorQuestion', payload: data });
            setErrorQuestions([]);
            setErrorAnswers([]);
          },
          onCancel: () => {
            setErrorQuestions([]);
            setErrorAnswers([]);
          }
        });
      } else {
        Modal.success({
          content: '恭喜你，练习无错题！',
        });
      }
    } else {
      // 未检查答案, 如果已作出答案,也提交练习记录
      const result = questionRef.current.getAnswerResult();
      if (!result || !result.answerTemp) {
        message.error('没有作答，不记录此题练习')
      } else {
        questionResult(result.questionId, result.result, result.answerTemp);
      }
    }
    setCurrentIndex(0);
    setShowAnswer(false);
    checkAnswerFlag.current = false;
  }, [closeModal, errorQuestions, errorAnswers, userInfo, dispatch]);

  // 点击下一题按钮，刷新题目显示
  const nextTo = useCallback(() => {
    if (!checkAnswerFlag.current) {
      // 未检查答案, 如果已作出答案,也提交练习记录
      const result = questionRef.current.getAnswerResult();
      if (!result || !result.answerTemp) {
        message.error('没有作答，不记录此题练习')
      } else {
        questionResult(result.questionId, result.result, result.answerTemp);
      }
    }
    if (dataArray?.length > currentIndex + 1) {
      updateDetail(dataArray[currentIndex + 1].QuestionId, PlanId);
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      message.success('题目已练习到最后一个！');
    }
  }, [currentIndex, dataArray, updateDetail, PlanId]);

  // 题目组件内比对答案后，返回题目ID出来做记录，用于错题集归档的功能
  const questionResult = useCallback((QuestionId, isCorrect, answer) => {
    if (PlanId && PlanId > 0) {
      commitQuestionResult?.({
        QuestionId,
        StudentId: userInfo.userId,
        CreateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        AnswerSteps: answer?.steps || "",
        TrueAnswer: (typeof answer === 'object' ? JSON.stringify(answer) : answer),
        TrainScore: answer?.score || (isCorrect ? 100 : 0),
        PlanId: PlanId
      })
    } else {
      // 提交答题记录
      dispatch({
        type: "trainingCenter/addPracticeRecord", payload: {
          QuestionId,
          PracticeStep: answer && answer.steps || "",
          PracticeAnswer: (typeof answer === 'object' ? JSON.stringify(answer) : answer),
          PracticeScore: answer && (questionDetail.QuestionType == 5 ? (answer.score || 0) : (answer.result ? 1 : 0)) || 0,
        }
      });
    }
    if (!isCorrect && !errorQuestions.includes(QuestionId)) {
      message.error("答错一题，已记录！");
      setErrorQuestions(prev => [...prev, QuestionId]);
      setErrorAnswers(prev => [...prev, JSON.stringify(answer)]);
    }
  }, [PlanId, commitQuestionResult, userInfo, dispatch, questionDetail, errorQuestions]);

  // footerCom 逻辑
  let data = {};
  const dataSum = dataArray?.length || 0;
  let footerCom = [
    <Button key='check' type='primary' onClick={() => {
      checkAnswerFlag.current = true;
      questionRef?.current?.checkAnswer();
    }}>检查答案</Button>,
    <Button key='ok' type='danger' onClick={endPractice}>结束练习</Button>,
  ];
  if (dataSum > 0 && currentIndex >= 0 && currentIndex < dataSum) {
    data = dataArray[currentIndex];
  }
  if (dataSum > 1) {
    footerCom = [
      <Button key='check' type='primary' onClick={() => {
        checkAnswerFlag.current = true;
        questionRef?.current?.checkAnswer();
      }}>检查答案</Button>,
      <Button key='next' type='primary' onClick={nextTo} disabled={currentIndex === dataSum - 1}>下一题</Button>,
      <Button key='ok' type='danger' onClick={endPractice}>结束练习</Button>,
    ];
  }

  return (
    <Modal
      title={title || ("练习窗口")}
      open={isOpen}
      maskClosable={false} closable={false}
      footer={footerCom}
      destroyOnHidden
      width={"100vw"}
      style={{ top: 0, left: 0, height: "100vh" }}
      styles={{ body: { overflow: "auto", height: "calc(100vh - 108px)" } }}
    >
      <QuestionsCom ref={questionRef} detail={questionDetail} setShowAnswer={setShowAnswer} questionId={data?.QuestionId} index={currentIndex} showAnswer={showAnswer} returnResult={questionResult} />
    </Modal>
  );
}

// 训练中心主页面函数式组件
export default function TrainingCenter() {
  const dispatch = useDispatch();
  const trainingCenter = useSelector(state => state.trainingCenter);
  const userInfo = useSelector(state => state.user.userInfo);
  const [tabKey, setTabKey] = useState(0);
  const [selectQuestions, setSelectQuestions] = useState([]);
  const [openPractice, setOpenPractice] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState('练习窗口');
  const tableRef = useRef();

  const switchDataTab = (key) => {
    setTabKey(key);
    setSelectQuestions([]);
  };

  const closePracticeModal = () => {
    setOpenPractice(false);
  };

  const updateQuestionDetail = (questionId) => {
    dispatch({ type: "trainingCenter/queryQuestionDetail", payload: questionId });
  };

  useEffect(() => {
    tableRef.current?.reload && tableRef.current.reload();
  });

  // columns
  let columns = [
    {
      title: '题目ID',
      dataIndex: 'QuestionId',
      sorter: (a, b) => a.QuestionId - b.QuestionId,
      search: false,
      align: 'center'
    },
    {
      title: '题干',
      dataIndex: 'QuestionName',
      render: (dom) => <Text style={{ width: '2rem' }} ellipsis={{ tooltip: dom }}>{dom}</Text>
    },
    {
      title: '题目描述',
      dataIndex: 'QuestionDescribe',
      render: (dom) => <Text style={{ width: '2rem' }} ellipsis={{ tooltip: dom }}>{dom}</Text>
    },
    {
      title: '题目类型',
      dataIndex: 'QuestionType',
      valueEnum: questionTypes
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
      title: '难度等级',
      dataIndex: 'Digree',
      render: (value) => <Rate disabled defaultValue={value} />,
      sorter: (a, b) => a.Digree - b.Digree,
      search: false,
      align: 'center',
    },
  ];
  if (!tabKey) {
    columns.push({
      key: "operation",
      title: '操作',
      render: (text, record) => [
        <Popconfirm
          key={"practice"}
          title="确认开始练习？"
          onConfirm={() => {
            updateQuestionDetail(record.QuestionId);
            setSelectQuestions([record]);
            setOpenPractice(true);
            setPracticeTitle('单题练习窗口');
          }}
          okText="练习"
          cancelText="取消"
        >
          <Button danger type='link'>练习</Button>
        </Popconfirm>,
      ],
      search: false,
    })
  }

  const nowrapText = { whiteSpace: "nowrap" }
  if (!userInfo.isLogin) return (<UnloginEmpty />);

  return (
    <div style={{ left: 0, right: 0, margin: "auto", width: "80%" }}>
      <PracticeModal
        title={practiceTitle}
        isOpen={openPractice}
        dataArray={selectQuestions}
        closeModal={closePracticeModal}
        updateDetail={updateQuestionDetail}
        questionDetail={trainingCenter.questionDetail}
      />
      <ProCard style={{ background: 'transparent' }}>
        <ProCard colSpan='15%' style={{ background: 'transparent' }}>
          <h2 style={nowrapText}>训练模式</h2>
          <Radio.Group defaultValue={0} buttonStyle='solid' size='large'
            onChange={(e) => switchDataTab(e.target.value)}
          >
            <Radio.Button style={nowrapText} value={0}>单题练习模式</Radio.Button>
            <Radio.Button style={nowrapText} value={1}>批量练习模式</Radio.Button>
          </Radio.Group>
        </ProCard>
        <Divider type='vertical' style={{ height: 'auto' }} />
        <ProCard style={{ background: 'transparent' }}>
          <ProTable
            actionRef={tableRef}
            headerTitle="题库列表"
            rowKey={(record) => record.QuestionId}
            cardBordered
            pagination={{
              defaultPageSize: 6,
              showQuickJumper: true,
            }}
            columns={columns}
            request={async (params) => {
              const filteredData = trainingCenter.questionList.filter((item) => {
                return Object.keys(params).every((key) => {
                  if (!params[key]) return true;
                  const value = params[key];
                  if (typeof value === 'string') {
                    return item[key]?.toString().includes(value);
                  }
                  return true;
                });
              });

              return {
                data: filteredData,
                success: true,
              };
            }}
            {...(tabKey
              ? {
                rowSelection: {
                  selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
                },
                tableAlertRender: ({ selectedRowKeys, selectedRows, onCleanSelected }) => (
                  <Space size={24}>
                    <span>
                      已选 {selectedRowKeys.length} 项
                      <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                        取消选择
                      </a>
                    </span>
                  </Space>
                ),
                tableAlertOptionRender: (values) => (
                  <Space size={16}>
                    <Button
                      type="primary"
                      onClick={() => {
                        updateQuestionDetail(values.selectedRows[0].QuestionId);
                        setOpenPractice(true);
                        setSelectQuestions(values.selectedRows);
                        setPracticeTitle('单题练习窗口');
                      }}
                    >
                      开始练习
                    </Button>
                  </Space>
                ),
              }
              : {})}
          />
        </ProCard>
      </ProCard>
    </div>
  )
}
