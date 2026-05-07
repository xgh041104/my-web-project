import React from 'react';
import { Row, Col, Divider, Space } from 'antd';
import QuestionsCom from '../questions/_questions';

const questionType = ["单选题", "多选题", "判断题", "填空题"];

export default class PaperDisplayCom extends React.Component {
  //props: paperDetail
  constructor(props) {
    super(props);
  }

  createQuestions() {
    if (!this.props.paperDetail || Object.keys(this.props.paperDetail).length == 0) {
      return <></>;
    }

    let questionParts = this.props.paperDetail.TestPaperQuestionTypeOver
      .filter(item => item.QuestionIdNum != 0 && item.QuestionScore != 0)
      .map(item => ({ ...item, questions: [] }))
    this.props.paperDetail?.TestPaperQuestionViewFile?.forEach(question => {
      let part = questionParts.find(item => item.QuestionType == question.QuestionType);
      if (part) {
        part.questions.push(question)
      }
    });

    const questionsRender = (q, index) => {
      const answerArr = this.props.paperDetail.AnswerSheetarr?.filter((ele) => {
        if (ele.QuestionId == q.QuestionId) {
          return true;
        }
        return false;
      });
      console.log("get answerArr", answerArr);
      const answerItem = (answerArr.length == 1) ? (answerArr[0]) : (null);
      return <div key={'question' + String(q.QuestionId)}>
        <QuestionsCom
          detail={q}
          index={index}
          questionId={q.QuestionId}
          showAnswer={true}
          noCheckAnswer={true}
          showScore={true}
          extraAnswer={answerItem}
        />
        <br />
      </div>
    }

    const partRender = (part, partIndex) => {
      if (part.QuestionIdNum == 0 || part.QuestionScore == 0) {
        return <></>
      }
      return (<div key={"part" + partIndex}>
        <br />
        <Divider />
        <Row style={{ fontSize: '.20rem', fontWeight: 'bold', }}>
          <Space>
            <Col>第{partIndex + 1}部分-</Col>
            <Col>{questionType[part.QuestionType - 1]}</Col>
            <Col>题目数量:{part.QuestionIdNum} 道</Col>
            <Col>题型总分:{part.QuestionScore} 分</Col>
          </Space>
        </Row>
        <br />
        <>
          {part.questions.map(questionsRender)}
        </>
      </div>)
    }

    return questionParts.map(partRender)
  }

  render() {
    return <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
      {
        (this.props.paperDetail) && (
          <div>
            <h1 style={{ textAlign: 'center' }}>{this.props.paperDetail.ExamName}第{this.props.paperDetail.SessionNum}场考试</h1>
            <h1 style={{ textAlign: 'center' }}>{this.props.paperDetail.TestPaperName}</h1>
            <Row>
              <Space size={'large'} style={{ color: 'red', fontSize: '.2rem', fontWeight: 700, }}>
                <Col>考试得分：{this.props.paperDetail.Score || 0}</Col>
                <Col>参考时间：{this.props.paperDetail.StartExamTime}~{this.props.paperDetail.EndExamTime}</Col>
                {
                  (this.props.paperDetail.hasOwnProperty('ExamType') && this.props.paperDetail.ExamType == 2)
                  && (
                    <Col>补考完成</Col>
                  )
                }
              </Space>
            </Row>
            <Row>
              <Space>
                <Col>卷面满分:{this.props.paperDetail.FullMarks}分</Col>
                <Col>及格分数:{this.props.paperDetail.PassScore}分</Col>
                <Col>考试时长:{this.props.paperDetail.ExamDuration}分钟</Col>
              </Space>
              <Col span={10}></Col>
              <Col>出卷老师：{this.props.paperDetail.TeacherName}</Col>
            </Row>
            {this.createQuestions()}
          </div>
        )
      }
    </div>;
  }
}
