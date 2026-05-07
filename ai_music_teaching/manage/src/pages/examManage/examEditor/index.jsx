import React, { } from 'react';
import ExamTopicEdit from './_examTopicEdit';
import ExamSessionEdit from './_examSessionEdit';
import ExamStudentEdit from 'components/StudentSelectForm';
import ExamNoticeEdit from './_examNoticeEdit';

import { Tabs, Row, Col, Button } from 'antd'
import { connect, history } from 'umi'


function ExamEditor({ dispatch, examInfo }) {

  const isCreate = !examInfo || !examInfo.Id;

  const back2ExamList = () => {
    history.push("/examManage/examList");
  }

  const handleStudentsChange = (values) => {

    // console.log("get submit values", values);
    let AddStudentIdArr = [], RemoveStudentIdArr = [], dispatchType = "examManage/createExamStudent"

    const isStudentCreate = !examInfo||!examInfo.ExamStudentArr;
    const studentSource = examInfo?.ExamStudentArr||[];

    if (isStudentCreate || !Array.isArray(studentSource) || studentSource.length < 1) {
        AddStudentIdArr = values.studentIds;
    }
    else {
        dispatchType = "examManage/modifyExamStudent"
        AddStudentIdArr = values.studentIds.filter(newId => studentSource.every(s => newId !== s.StudentId))
        RemoveStudentIdArr = studentSource.filter(s => values.studentIds?.every(newId => newId !== s.StudentId)).map(s=>s.StudentId)
    }

    dispatch({
        type: dispatchType,
        payload: {
            ExamId: examInfo.Id,
            AddStudentIdArr,
            RemoveStudentIdArr
        }
    })
}

  return <>
    <Row align={'baseline'}>
      <Col >
        <h2><span>{isCreate ? "新增" : "编辑"}</span>考试信息</h2>
      </Col>
      <Col offset={1}>
        <Button type='primary' onClick={back2ExamList}>返回考试列表</Button>
      </Col>
    </Row>
    <Tabs
      // onChange={handleChange}
      items={[{
        label: `考试信息`,
        key: "ExamTopic",
        children: <ExamTopicEdit dispatch={dispatch} examInfo={examInfo} />,
      },
      {
        label: `考场信息`,
        key: "ExamSession",
        disabled: isCreate,
        children: <ExamSessionEdit dispatch={dispatch} examInfo={examInfo} />
      },
      {
        label: `考生信息`,
        key: "ExamStudent",
        disabled: isCreate,
        children: <ExamStudentEdit studentSource={examInfo.ExamStudentArr} onStudentsChange={handleStudentsChange} />,
      },
      {
        label: `考试通知`,
        key: "ExamNotice",
        disabled: isCreate,
        children: <ExamNoticeEdit examInfo={examInfo} />,
      }
      ]}
    />
  </>
}

export default connect(({ dispatch, examManage }) => ({ dispatch, examInfo: examManage.crtExamInfo }))(ExamEditor)