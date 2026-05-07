import React, { } from 'react'
import ResultDetail from './_ResultDetail'
import ExamStatistic from './_ExamStatistic'
import ResetExamManage from './_ResetExamManage'


import { Tabs, Row, Col, Button } from 'antd'
import { connect, history } from 'umi'



function ExamResultDetail({ dispatch, examResultDetail }) {

  const back2ExamResultList = () => {
    history.push("/examManage/examResultList");
  }

  return <>
    <Row align={'baseline'}>
      <Col >
        <h2>考试成绩</h2>
      </Col>
      <Col offset={1}>
        <Button type='primary' onClick={back2ExamResultList}>返回考试成绩列表</Button>
      </Col>
    </Row>
    <Tabs
      // onChange={handleChange}
      items={[{
        label: `成绩详情`,
        key: "ExamTopic",
        children: <ResultDetail examResultDetail={examResultDetail} dispatch={dispatch} />,
      },
      {
        label: `成绩统计`,
        key: "ExamSession",
        children: <ExamStatistic examResultDetail={examResultDetail} />
      },
        // {
        //   label: `补考管理`,
        //   key: "ExamStudent",
        //   children: <ResetExamManage />,
        // }
      ]}
    />
  </>
}

export default connect(({ dispatch, examManage }) => ({ dispatch, examResultDetail: examManage.examResultDetail }))(ExamResultDetail)