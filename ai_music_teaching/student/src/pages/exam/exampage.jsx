//进入考试的页面，全屏显示
import React, { useState, useEffect } from 'react';
import { Divider, Space, Row, Col, Button, message, Modal, Result } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { QuestionCircleOutlined, FastForwardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import QuestionsCom from '../questions/_questions';
import { connect } from 'dva';
import { history } from 'umi';
import { QuillEditor } from 'components/quilleditor'
import image2blob from 'utils/image2blob'

function sleep(ms) {
  return new Promise(resolve => { setTimeout(resolve, ms) });
}
@connect(({ dispatch, examCenter }) => ({ dispatch, examCenter }))
export default class ExamPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // checkAnswer: false,
      currentIndex: 0, //当前打开或者选中的题目序号，默认为0
      answersObject: {},  //题号为key，答案为value
      isCorrectObject: {}, //题号为key，正确与否为value
    };
    const date = new Date();
    this.startExamTime = date.toLocaleString();
    this.cameraVideoRef = React.createRef();
    this.getImageTimes = 0;
    this.questionRef = React.createRef();
    this.getImageTimerId = null;
  }

  createListButtons = (typeDetail) => {
    let counter = 0;
    const typeNames = ["单选题", "多选题", "判断题", "填空题"];
    return (
      typeDetail.filter(item => item.QuestionIdNum != 0).map((typeItem, typeIndex) => {
        let buttons = [];
        const counts = typeItem.QuestionIdNum;
        for (let i = 0; i < counts; i++) {
          buttons.push(
            <Button
              key={'button' + counter}
              type={(counter <= this.state.currentIndex) ? ('primary') : ('')}
              loading={(counter == this.state.currentIndex) ? true : false}
              disabled={(counter > this.state.currentIndex) ? true : false}
              icon={(counter < this.state.currentIndex) ? (<CheckCircleOutlined />) : ('')}
            >
              {counter + 1}.
            </Button>
          );
          counter++;
        }
        return (<div key={"ti-xing" + typeIndex}>
          <Row style={{ fontWeight: 600 }}>
            <Col>第{typeIndex + 1}部分：</Col>
            <Col>{typeNames[typeItem.QuestionType - 1]}</Col>
            <Col>（共{typeItem.QuestionIdNum}题）</Col>
            <Col>（总分{typeItem.QuestionScore}分）</Col>
          </Row>
          <Row>
            {
              buttons
            }
          </Row>
          <p />
        </div>
        );
      })
    );
  }

  //从questionsCom中接收的Id、正确与否、及答案
  receiveQuestionAnswer = (questionId, isCorrect, answer) => {
    let answersObj = this.state.answersObject;
    let correctObj = this.state.isCorrectObject;

    const answerStr = JSON.stringify(answer);

    //如果记录字段中不存在答案，或者目前答案与记录答案不一致，则修改记录值
    if (answersObj[String(questionId)] != answerStr && correctObj[String(questionId)] != isCorrect) {
      answersObj[String(questionId)] = answerStr;
      correctObj[String(questionId)] = isCorrect;

      this.setState({
        answersObject: answersObj,
        isCorrectObject: correctObj,
        // checkAnswer: false,
      });
      // console.log('答案：', this.state);
    }
  }

  //构造一个通用方法，用于统计分数和答案的详情，返回数据主要用于上传或存储；实操题分数额外计算
  calcScoreAndAnswers = () => {
    let scoreCounter = 0;
    let answersArray = [];
    // eslint-disable-next-line array-callback-return
    this.props.examCenter.examDetail.TestPaperQuestionViewFile?.map((item, index) => {
      const questionId = item.QuestionId;
      if (this.state.answersObject.hasOwnProperty(questionId)) {
        let score;
        if (item.QuestionType == 4 || item.QuestionType == 2) {//多选填空
          const answerStep = JSON.parse(this.state.answersObject[questionId]);
          score = (this.state.answersObject[questionId]) ? (item.QuestionScore * answerStep.score) : (0);
        }
        if (item.QuestionType == 5) {
          const answerStep = JSON.parse(this.state.answersObject[questionId]);
          score = (this.state.answersObject[questionId]) ? (parseInt(item.QuestionScore * answerStep.score / 100)) : (0);
        }
        else if (item.QuestionType == 8 || item.QuestionType == 9) {
          const answerStep = JSON.parse(this.state.answersObject[questionId]);
          score = (this.state.answersObject[questionId]) ? (item.QuestionScore * answerStep.score) : (0);
          console.log(this.state.isCorrectObject[questionId]);
        }
        else {
          score = (this.state.isCorrectObject[questionId]) ? (item.QuestionScore) : (0);
        }
        answersArray.push({
          QuestionId: questionId,
          AnswerScore: score,
          AnswerSteps: this.state.answersObject[questionId],
          IsTrue: (this.state.isCorrectObject[questionId]) ? (1) : (0),
        });
        scoreCounter += score;
      }

    });
    return {
      Score: scoreCounter,
      AnswerSheetArr: answersArray,
    };
  }

  nextQuestion = () => {
    // 下一题按钮点击触发事件
    const currentQId = this.props.examCenter.examDetail.TestPaperQuestionViewFile[this.state.currentIndex].QuestionId;
    if (!this.state.answersObject.hasOwnProperty(currentQId)) {
      message.error('当前题目未作答或未提交答案，请先作答或提交答案后进入下一题！')
      return;
    }

    const index = this.state.currentIndex;
    if (index >= this.props.examCenter.examDetail.QuestionSum - 1) {
      message.info('已是最后一题，答题完成请提交！');
      return;
    }
    this.setState({
      currentIndex: index + 1,
      // checkAnswer: false,
    });
  }

  submitAnswer = async () => {
    await this.questionRef?.current?.checkAnswer();
    const currentQId = this.props.examCenter.examDetail.TestPaperQuestionViewFile[this.state.currentIndex].QuestionId;
    if (this.state.answersObject.hasOwnProperty(currentQId)) {
      message.error("当前题目已提交，不能重复提交答案")
      return;
    }
    // 未提交过，则可以提交答案
    // this.setState({
    //     checkAnswer: true,
    // });

    // 不显示答案只提示已提交

    if (!this.questionRef.current) {
      console.log("当前题目实例有误！");
      return;
    }

    const questionResult = this.questionRef.current.getAnswerResult();
    if (!questionResult) {
      message.error("当前题目未作答无法提交");
      return;
    }
    console.log(questionResult);
    this.receiveQuestionAnswer(questionResult.questionId, questionResult.result, questionResult.answerTemp)
    message.success("完成答案提交", 5);
  }

  //TODO:交卷
  submitPaperInfo = () => {
    const finishSum = Object.keys(this.state.answersObject).length;
    Modal.confirm({
      title: '交卷',
      content: (<div>
        <span>是否确定交卷？交卷后数据将提交！</span>
        <Row>
          <Col>当前已答题：{finishSum}题，</Col>
          <Col>还剩题目：{this.props.examCenter.examDetail.QuestionSum - finishSum}</Col>
        </Row>
      </div>),
      onOk: () => {
        //执行交卷并提交函数
        const endExamTime = new Date().toLocaleString();
        const scores = this.calcScoreAndAnswers();

        if (this.props.examCenter.captureEnable) {
          let imageObj = null
          if (this.cameraVideoRef.current) {
            imageObj = this.cameraVideoRef.current.getCurrentImageBase64();
          }
          if (imageObj) {
            const [imageBlob, imageType] = image2blob(imageObj);  // 获取处理好的 和文件类型
            this.props.dispatch({
              type: "examCenter/uploadExamImage",
              payload: {
                "fileData": [imageBlob],
                "ExamId": this.props.examCenter.examDetail.ExamId,
                "ExamSessionId": this.props.examCenter.examDetail.ExamSessionId,
                "StudentId": this.props.examCenter.examDetail.StudentId,
              }
            });
          }
          else {
            console.warn("考试照片提取失败!")
          }
        }

        const data = {
          StudentId: this.props.examCenter.examDetail.StudentId,
          ExamId: this.props.examCenter.examDetail.ExamId,
          ExamSessionId: this.props.examCenter.examDetail.ExamSessionId,
          TestPaperId: this.props.examCenter.examDetail.TestPaperId,
          StartExamTime: this.startExamTime,
          IsReTest: this.props.examCenter.examDetail.IsReTest ? 1 : 0,
          ...scores,
        };
        this.props.dispatch({
          type: 'examCenter/uploadPaperScore', payload: data, callback: () => {
            history.push({ pathname: '/exam' });
          }
        });

      },
    });
  }

  //退出考试
  exitExam = () => {
    const finishSum = Object.keys(this.state.answersObject).length;
    Modal.confirm({
      title: '退出考试',
      content: (<div>
        <span>是否确定退出考试？退出后所有答题数据将会丢失</span>
        <Row>
          <Col>当前已答题：{finishSum}题，</Col>
          <Col>还剩题目：{this.props.examCenter.examDetail.QuestionSum - finishSum}</Col>
        </Row>
      </div>),
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        clearInterval(this.getImageTimes);
        //执行退出,
        //TODO：考虑数据需不需要保存，下次打开恢复？
        const scores = this.calcScoreAndAnswers();
        const data = {
          StudentId: this.props.examCenter.examDetail.StudentId,
          ExamId: this.props.examCenter.examDetail.ExamId,
          ExamSessionId: this.props.examCenter.examDetail.ExamSessionId,
          TestPaperId: this.props.examCenter.examDetail.TestPaperId,
          StartExamTime: this.startExamTime,
          ...scores,
        };
        history.push({ pathname: '/exam' });
      },
    });
  }

  async uploadExamImage() {
    if (this.getImageTimes > 2) {
      return Promise.reject("获取图片已达到上限！");
    }
    if (!this.cameraVideoRef.current) {
      await sleep(500);
      return await this.uploadExamImage();
    }
    const imageObj = this.cameraVideoRef.current.getCurrentImageBase64();
    if (!imageObj) {
      await sleep(500);
      return await this.uploadExamImage();
    }
    const [imageBlob, imageType] = image2blob(imageObj);  // 获取处理好的 和文件类型
    //   formData.append('file', imageBlob, `${Date.now()}.${imageType}`); // 添加到表单，传入文件名
    const imagePayload = {
      "fileData": [imageBlob],
      "ExamId": this.props.examCenter.examDetail.ExamId,
      "ExamSessionId": this.props.examCenter.examDetail.ExamSessionId,
      "StudentId": this.props.examCenter.examDetail.StudentId,
    }
    // console.log('进入考试截图:', this.cameraVideoRef.current, imagePayload);

    let that = this;
    this.props.dispatch({
      type: "examCenter/uploadExamImage",
      payload: imagePayload,
      callback: () => {
        that.getImageTimes += 1;
      }
    });
    return true;
  }

  componentDidMount() {
    let that = this;
    const timerId = setTimeout(async () => {
      if (!that.props.examCenter.captureEnable) {
        clearTimeout(timerId);
        return;
      }
      // 初始进入考试时先截上传一张图片
      // console.log('考试截图开始, 先搞一张图');
      that.uploadExamImage();
      // let that = this;
      that.getImageTimerId = setInterval(async () => {
        // console.log('考试截图定时器');
        that.uploadExamImage().finally(() => {
          if (that.getImageTimes === 3) {
            // console.log("关闭截图定时器");
            clearInterval(that.getImageTimerId);
          }
        })

      }, 1000 * 30)
      clearTimeout(timerId);
    }, 1000 * 3);

  }

  componentWillUnmount() {
    clearInterval(this.getImageTimerId);
    this.getImageTimes = 0;
  }

  componentDidUpdate() {


  }



  render() {
    if (Object.keys(this.props.examCenter.examDetail) == 0) {
      return <div>未查询到考试数据</div>
    }
    return <div>
      {this.props.examCenter.crtNotice && <ExamNotice {...this.props.examCenter.crtNotice} />}
      <ProCard
        title={<>
          <h2>{this.props.examCenter.examDetail.ExamName + " - 第" + String(this.props.examCenter.examDetail.SessionNum) + "场"}</h2>
          <Row style={{ color: 'gray' }}><Space size={'large'}>
            <Col>
              总分：{this.props.examCenter.examDetail.FullMarks}分（及格{this.props.examCenter.examDetail.PassScore}分）
            </Col>
            {
              (this.props.examCenter.examDetail.CourseName != "") && (<>
                <Col>
                  专业：{this.props.examCenter.examDetail.MajorName}
                </Col>
                <Col>
                  课程：{this.props.examCenter.examDetail.CourseName}
                </Col>
              </>)
            }
            <Col>
              距离考试结束：{this.props.examCenter.examDetail.ExamDuration}分钟
            </Col>
            <Col>
              <span style={{ fontWeight: 600, }}>已完成{this.state.currentIndex + 1}题/共{this.props.examCenter.examDetail.QuestionSum}题</span>
            </Col>
          </Space></Row>
        </>}
        extra={(
          <div>
            <Space size={'large'}>
              <Button type='primary' onClick={() => { this.submitPaperInfo() }}>交卷</Button>
              <Button type='primary' onClick={() => { this.exitExam() }} danger>退出考试</Button>
            </Space>
          </div>
        )}
        style={{ background: 'transparent' }}
      >
        <ProCard
          style={{ minHeight: '65vh' }}
          colSpan={'30%'}
          bordered
          title={<Row><Space size={'large'}>
            <Col><h3>题目列表</h3></Col>
            <Col style={{ color: 'gray' }}>{"(题目总数:" + String(this.props.examCenter.examDetail.QuestionSum) + "道题)"}</Col>
          </Space></Row>}
        >
          <div style={{ maxHeight: '55vh', overflow: 'auto' }}>
            {this.createListButtons(this.props.examCenter.examDetail.TestPaperQuestionTypeOver)}
          </div>
        </ProCard>
        <Divider type='vertical' style={{ height: 'auto', }} />
        <ProCard
          title=''
          actions={<div style={{ alignItems: 'end', justifyContent: 'end', margin: 'auto .1rem .1rem auto' }}>
            <Space size={'large'}>
              <Button key={'submitAnswer'} type='primary' icon={<QuestionCircleOutlined />}
                onClick={() => { this.submitAnswer() }}
              >提交答案</Button>
              <Button key={'nextQuestion'} danger icon={<FastForwardOutlined />}
                onClick={() => { this.nextQuestion() }}
              >下一题</Button>
            </Space>
          </div>
          }
          style={{ height: '68vh' }}
          styles={{
            body: { overflow: 'auto' },
          }}
          bordered
        >
          <QuestionsCom
            ref={this.questionRef}
            detail={this.props.examCenter.examDetail.TestPaperQuestionViewFile[this.state.currentIndex]}
            questionId={this.props.examCenter.examDetail.TestPaperQuestionViewFile[this.state.currentIndex].QuestionId}
            index={this.state.currentIndex}
            state={"exam"}
          // showAnswer={this.state.checkAnswer}
          // showScore={true}
          // returnResult={this.receiveQuestionAnswer}
          // onResultChange={this.receiveQuestionAnswer}
          />
        </ProCard >
      </ProCard >
    </div >
  }
}


function ExamNotice({ Title, CourseCode, CourseName, SchoolName, Context }) {

  const [modalOpen, setModalOpen] = useState(true);
  const [readTime, setReadTime] = useState(6);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (readTime === 0) {
        clearInterval(intervalId);
        return;
      }
      setReadTime(preReadTime => preReadTime - 1);
    }, 1000)

    return () => {
      clearInterval(intervalId);
    }
  }, [])

  return <Modal open={modalOpen} maskClosable={false}
    onCancel={() => { setModalOpen(false); }}
    width={'60vw'}
    footer={[
      <Button disabled={readTime > 0} key={'recheck'} type='primary'
        onClick={() => {
          setModalOpen(false);
        }}
      >我知道了{readTime > 0 ? "(" + readTime + "s)" : ""}</Button>,
    ]}
  >
    <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '.25rem' }}>{Title}</h2>
    <p style={{ display: 'flex', justifyContent: 'center', fontSize: '15px' }}>
      <span >课程代码：{CourseCode}</span>
      <span style={{ width: "1rem" }}></span>
      <span>课程名称：{CourseName}</span>
    </p>
    <style>
      {`.ql-hidden {
                    /* 不删除ql-hidden会在显示预览时有大片空白 */
                    display: none;
            }`}
    </style>
    <QuillEditor
      readOnly theme="bubble" value={Context}
      style={{
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none",
        pointerEvents: "none"
      }}
    />
    <br />
    {/* <p style={{ textAlign: "right" }}>{SchoolName}</p> */}
  </Modal>
}
