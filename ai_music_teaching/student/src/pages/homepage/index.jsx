import { List, Empty } from 'antd';
import { connect } from 'umi';
import React, { useState, useRef } from 'react';
import PlanCard from './_PlanCard';
import UnloginEmpty from '../unlogin';
import { PracticeModal } from '../training';
import './index.css';

function PlanPage({ userInfo, planList, questionDetail, dispatch }) {

  const [openPractice, setOpenPractice] = useState(false)
  const [crtPlanId, setPlanId] = useState(0);
  const detectRef = useRef();

  const dataSource = planList;

  function handleStartPractice(questionId, planId) {
    if (!planId) {
      console.warn("未知计划ID");
      return;
    }
    setPlanId(planId);
    setOpenPractice(true);
    dispatch({ type: "trainingCenter/queryQuestionDetail", payload: questionId });
  }

  function handleStartExam(examState) {
    detectRef.current.shouldEnterExam(examState)
  }
  function handlePracticeResult(questionInfo) {
    dispatch({ type: 'homePageSpace/addPlanPracticeRecord', payload: { planId: questionInfo.PlanId, studentId: questionInfo.StudentId, practiceList: [questionInfo] } })
  }

  if (!userInfo || !userInfo.isLogin) {
    return <UnloginEmpty />
  }
  return <div className="planPage">
    <PracticeModal
      title={"学习计划-练习"}
      isOpen={openPractice}
      closeModal={() => setOpenPractice(false)}
      dataArray={[questionDetail]}
      updateDetail={handleStartPractice}
      questionDetail={questionDetail}
      PlanId={crtPlanId}
      commitQuestionResult={handlePracticeResult}
    />
    <h1>学习考试计划列表</h1>
    {
      dataSource && dataSource.length > 0 ?
        <List
          style={{ width: `${5 * dataSource.length}rem`, marginLeft: '.2rem' }}
          rowKey="PlanId"
          grid={{ gutter: 50, column: dataSource.length }}
          dataSource={dataSource || []}
          renderItem={(item, index) => (
            <List.Item >
              <PlanCard
                key={item.PlanId + "p" + userInfo.userId + "lan" + index}
                planInfo={item}
                studentId={userInfo.userId}
                onStartPractice={handleStartPractice}
                onStartExam={handleStartExam}
              />
            </List.Item>
          )} />
        :
        // <div style={{ width: "200px", color: 'gray' }} >
        <Empty ></Empty>
      // </div>
    }
  </div>
}

export default connect(({ homePageSpace, user, trainingCenter }) => ({
  userInfo: user.userInfo,
  planList: homePageSpace.planList,
  planDetailList: homePageSpace.planDetailList,
  questionDetail: trainingCenter.questionDetail
}))(PlanPage)
