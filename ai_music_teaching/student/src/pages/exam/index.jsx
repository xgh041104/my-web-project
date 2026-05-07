import React, { useState } from 'react';
import { Empty, Button, Breadcrumb, Modal, Space, Radio, Divider, Row, Col, Spin, notification } from 'antd';
import { ProList, ProDescriptions, ProCard } from '@ant-design/pro-components';
import { connect } from 'dva';
import { history, Link } from 'umi';
import UnloginEmpty from '../unlogin';
import PaperDisplayCom from './_paperdisplay';
import dayjs from 'dayjs';
import ExamFaceDetection from './_examFaceDetection';
import MarkdownIt from 'markdown-it'; // 引入 markdown-it

dayjs.extend(require('dayjs/plugin/duration'));
const md = new MarkdownIt({
  html: true,         // 允许 HTML 标签
  linkify: true,      // 自动识别链接
  typographer: true,  // 智能标点
});

class TimerCom extends React.Component {
  //props: sourceTime offsetTime(ms)
  constructor(props) {
    super(props);
    const sTime = props.sourceTime.replace(/-/g, "/");
    this.state = {
      sDate: new Date(sTime),
      cDate: new Date(),
    };
    this.timerId = null;
  }

  componentDidMount() {
    this.timerId = setInterval(
      () => this.timerOut(),
      1000
    );
  }

  componentWillUnmount() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  timerOut() {
    const mNum = this.state.sDate.getTime() - this.state.cDate.getTime() - this.props.offsetTime;
    if (mNum <= 0) {
      this.props.onTimeOver?.();
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      return;
    }
    this.setState({
      cDate: new Date(),
    });
  }

  render() {
    const mNum = this.state.sDate.getTime() - this.state.cDate.getTime() - this.props.offsetTime;
    return <span >
      {dayjs.duration(mNum).format('DD天HH小时mm分ss秒')}
    </span>;
  }
}

@connect(({ dispatch, examCenter, user }) => ({ dispatch, examCenter, userInfo: user.userInfo }))
export default class ExamCenter extends React.Component {

  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.detectRef = React.createRef();
    this.state = {
      tabKey: 1,
      isAiAnalyzing: false,
    };
  }

  componentDidUpdate() {
    this.listRef.current?.reload();
  }

  switchDataTab(key) {
    this.setState({
      tabKey: key,
    });
  }

  //查看考试完成详情数据，与预览试卷类似
  viewExamDetail = (params) => {
    console.log('viewExamDetail', params);
    if (!params || typeof (params) !== 'object' || Object.keys(params).length == 0) {
      console.log('查看考试完成详情参数出错');
      return;
    }
    this.props.dispatch({
      type: 'examCenter/queryExamFinishDetail', payload: params,
      callback: (detail) => {
        console.log('detail', detail);
        Modal.info({
          title: '考试答题数据详情预览窗口',
          content: <PaperDisplayCom paperDetail={detail} />,
          width: '60vw',
          closable: true,
        });
      }
    })
  }

  // todo: 添加ai学情分析请求
  viewIntelligence = (params) => {
    this.setState({ isAiAnalyzing: true });
    let content = '';
    let answer = '';
    if (!params || typeof (params) !== 'object' || Object.keys(params).length == 0) {
      console.log('查看考试完成详情参数出错');
      this.setState({ isAiAnalyzing: false });
      return;
    }
    this.props.dispatch({
      type: 'examCenter/queryExamFinishDetail', payload: params,
      callback: (detail) => {
        console.log('detail', detail);
        const temp1 = detail.TestPaperQuestionViewFile;
        const temp2 = detail.AnswerSheetarr;
        temp1.map((item, index) => {
          content += index + 1 + '.' + item.QuestionName;
        });
        temp2.map(item => {
          answer += item.IsTrue + ' ';
        });
        notification.open({
          message: detail.ExamName + '--学情分析',
          description: '正在分析，请稍后...',
          key: 'ai-summary',
          duration: 0,
          closeIcon: false,
        });
        this.props.dispatch({
          type: 'examCenter/aiSummary',
          payload: {
            model: 'x1',
            user: 'user_123456',
            messages: [{
              role: 'user',
              content: `  你是一名音乐教学分析助手，,基于我提供的两段内容（冒号后的内容）,第一段数据是试卷的题目,
                      第二段是对应第一段题目的试题得分情况0代表答错,1代表答对
                      针对学生的答卷简单分析其知识点的掌握情况，明确指出哪些知识点掌握得较好，哪些知识点存在不足或错误，以及错误的具体表现。
                      根据知识点的掌握情况,给出具有针对性的学习方向和方法建议,
                      帮助学生更好地弥补薄弱环节,提升音乐知识水平：第一段`+ content + `第二段` + answer,
            }],
            stream: false,
            tools: [{
              type: "web_search",
              web_search: {
                enable: true,
                search_mode: "normal"
                // search_mode: "deep"
              }
            }]
          },
          callback: (result) => {
            notification.destroy('ai-summary');
            this.setState({ isAiAnalyzing: false });
            console.log('result', result);
            Modal.info({
              title: detail.ExamName + '--学情分析',
              content: <div dangerouslySetInnerHTML={{ __html: md.render(result.choices[0].message.content) }} />,
              width: '60vw',
              closable: true,
            });
          }
        })
      }
    })
  }

  render() {

    const { isAiAnalyzing } = this.state;
    if (!this.props.userInfo || !this.props.userInfo.isLogin) {
      return <UnloginEmpty />
    }

    const descriptionStyle = { column: { xs: 1, sm: 1, md: 1, lg: 1, xl: 3 }, style: { whiteSpace: "nowrap" } }
    const data = this.props.examCenter.examList;
    const majorEnum = {};
    const courseEnum = {};
    const dataSource = data?.map((item) => {
      if (!majorEnum[item.MajorName]) {
        majorEnum[item.MajorName] = item.MajorName;
      }
      if (!courseEnum[item.CourseName]) {
        courseEnum[item.CourseName] = item.CourseName;
      }

      let descContent = null;
      let extraContent = null;
      if (item.ExamZT == 0) { //已过期
        descContent = <ProDescriptions key={'d' + item.Id} {...descriptionStyle} >
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="时间区间" valueType='text'>
            <div>
              <span>开考：{item.SessionStartExamTime}</span><br /> <span>停考：{item.SessionEndExamTime}</span>
            </div>
          </ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end', marginRight: '.2rem' }} key={'e' + item.Id}>
          <Button>考试时间已过，不可参加考试</Button>
          <span>考试结束时间：{item.SessionEndExamTime}</span>
        </Space>;
      } else if (item.ExamZT == 1) { //已完成
        descContent = <ProDescriptions key={'d' + item.Id} {...descriptionStyle}>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="考试得分" valueType='text'><span style={{ color: 'red', fontWeight: 800 }}>{item.Score || 0}</span></ProDescriptions.Item>
          <ProDescriptions.Item label="参考时间" valueType='text'><div>
            <span style={{ color: 'red', fontWeight: 800 }}>开始：{item.StartExamTime}</span><br />
            <span style={{ color: 'red', fontWeight: 800 }}>交卷：{item.EndExamTime}</span>
          </div></ProDescriptions.Item>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="及格分数" valueType='text'>{item.PassScore}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="时间区间" valueType='text'><div>
            <span>开考：{item.SessionStartExamTime}</span><br /> <span>停考：{item.SessionEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        //已完成的可以查看考试详情，答案、成绩等
        extraContent = <Space direction='vertical' style={{ alignItems: 'end', marginRight: '.2rem' }} key={'e' + item.Id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type='primary' style={{ marginRight: 10 }}
              onClick={() => {
                this.viewExamDetail({
                  ExamId: item.ExamId,
                  ExamSessionId: item.ExamSessionId,
                });
              }}
            >查看考试详情</Button>
            <Button type='primary' onClick={() => {
              // todo：添加ai学情分析
              this.viewIntelligence({
                ExamId: item.ExamId,
                ExamSessionId: item.ExamSessionId,
              });
            }}>AI学情分析</Button>
          </div>
          <span>考试结束时间：{item.SessionEndExamTime}</span>
        </Space>;
      } else if (item.ExamZT == 2) { //未参加考试，考试时间已到
        descContent = <ProDescriptions key={'d' + item.Id} {...descriptionStyle}>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="时间区间" valueType='text'><div>
            <span>开考：{item.SessionStartExamTime}</span><br /> <span>停考：{item.SessionEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end', marginRight: '.2rem' }} key={'e' + item.Id}>
          <Button type='primary' danger
            onClick={() => {
              const examState = {
                ExamId: item.ExamId,
                ExamSessionId: item.ExamSessionId,
                StartTime: item.SessionStartExamTime,  //用于在考试页面显示时间
                EndTime: item.SessionEndExamTime,//用于在考试页面显示时间
                QuestionSum: item.QuestionNum, //用于考试页面显示题目使用
                IsReTest: item.ExamZT === 4
              }

              this.detectRef.current.shouldEnterExam(examState)
            }}
          >开始考试</Button>
          <span style={{ color: 'red', fontWeight: 800 }}>考试结束倒计时：<TimerCom sourceTime={item.SessionEndExamTime} offsetTime={this.props.examCenter.offsetTime} onTimeOver={() => history.go(0)} /></span>
        </Space >;
      } else if (item.ExamZT == 3) { //考试未开始
        descContent = <ProDescriptions key={'d' + item.Id} {...descriptionStyle}>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="时间区间" valueType='text'><div>
            <span>开考：{item.SessionStartExamTime}</span><br /> <span>停考：{item.SessionEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end', marginRight: '.2rem' }} key={'e' + item.Id}>
          <Button >等待开考</Button>
          <span>距离考试开始时间：<TimerCom sourceTime={item.SessionStartExamTime} offsetTime={this.props.examCenter.offsetTime} onTimeOver={() => history.go(0)} /></span>
        </Space>;
      } else if (item.ExamZT == 4) { //未补考
        descContent = <ProDescriptions key={'d' + item.Id} {...descriptionStyle}>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="补考时间" valueType='text'><div>
            <span>开考：{item.ResetStartExamTime}</span><br /> <span>停考：{item.ResetEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end', marginRight: '.2rem' }} key={'e' + item.Id}>
          <Button type='primary' danger
            onClick={() => {
              // console.log("将进入考试，考试类型：", item.ExamZT);
              const examState = {
                ExamId: item.ExamId,
                ExamSessionId: item.ExamSessionId,
                StartTime: item.ResetStartExamTime,  //用于在考试页面显示时间
                EndTime: item.ResetEndExamTime,//用于在考试页面显示时间
                QuestionSum: item.QuestionNum, //用于考试页面显示题目使用
                IsReTest: item.ExamZT === 4
              }
              this.detectRef.current.shouldEnterExam(examState)
            }}
          >开始补考</Button>
          <span style={{ color: 'red', fontWeight: 800 }}>补考结束倒计时：<TimerCom sourceTime={item.ResetEndExamTime} offsetTime={this.props.examCenter.offsetTime} onTimeOver={() => history.go(0)} /></span>
        </Space>;
      } else {
        descContent = <span>数据出错，请返回刷新！</span>
      }

      return ({
        title: (<Row><Space size={'large'}>
          <Col></Col>
          <Col><h2>{item.ExamName + "-第" + item.SessionNum + "场考试"}</h2></Col>
        </Space></Row>),
        content: (descContent),
        extra: (extraContent),
        majorId: item.MajorId, //用作筛选
        courseId: item.CourseId,//用作筛选
        name: item.ExamName + "-第" + item.SessionNum + "场考试",//用作筛选
        id: item.Id,//用作key
        type: item.ExamZT, //用作筛选
        endTime: item.SessionEndExamTime,
        startTime: item.SessionStartExamTime,
      });
    });

    const nowrapText = { whiteSpace: "nowrap", textAlign: 'center' }
    return <div style={{ left: 0, right: 0, margin: "auto", width: "100%" }}>
      {/* <Spin spinning={isAiAnalyzing} tip="正在分析..." fullscreen /> */}
      <ExamFaceDetection
        ref={this.detectRef}
        dispatch={this.props.dispatch}
        noFaceVerify={this.props.noFaceVerify}
      />
      <ProCard style={{ background: 'transparent' }}>
        <ProCard colSpan={'15%'} style={{ background: 'transparent' }}>
          <h2 style={nowrapText}>考试分类</h2>
          <Radio.Group defaultValue={this.state.tabKey} buttonStyle='solid' size='large'
            onChange={(e) => this.switchDataTab(e.target.value)}
            style={{
              textAlign: 'center',
            }}
          >
            <Radio.Button style={nowrapText} value={1} defaultChecked>待考中的考试</Radio.Button>
            {/* <Radio.Button style={nowrapText} value={2}>需补考的考试</Radio.Button> */}
            <Radio.Button style={nowrapText} value={3}>已完成的考试</Radio.Button>
            <Radio.Button style={nowrapText} value={4}>已过期的考试</Radio.Button>
          </Radio.Group>
        </ProCard>
        <Divider type='vertical' style={{ height: 'auto' }} />
        <ProCard style={{ minHeight: '70%', background: 'transparent' }}>
          <ProList
            style={{ margin: ".15rem auto" }}
            actionRef={this.listRef}
            defaultData={dataSource}
            cardBordered
            rowKey={'Id'}
            pagination={{ defaultPageSize: 4, }}
            search={{}}
            itemLayout='vertical'
            metas={{
              title: { search: false },
              description: { search: false },
              actions: {
                search: false,
              },
              extra: {
                search: false,
              },
              content: { search: false },
              name: {
                title: '考试名',
                dataIndex: 'name',
              },
              courseId: {
                title: '关联课程',
                valueType: 'select',
                valueEnum: courseEnum,
              },
              majorId: {
                title: '关联专业',
                valueType: 'select',
                valueEnum: majorEnum,
              },
            }}
            request={(params, sort, filter) => {
              return Promise.resolve({
                data: () => {
                  return dataSource?.filter((item) => {
                    let result = true;
                    if (params.name) {
                      result = (result && item.name.indexOf(params.name) != -1)
                    }
                    if (params.courseId) {
                      result = (result && item.courseId == params.courseId)
                    }
                    if (params.majorId) {
                      result = (result && item.majorId == params.majorId)
                    }
                    //上述是判断筛选条件，下面是判断是否与左侧的类型选择符合
                    if (this.state.tabKey == 1) {
                      result = (result && (item.type == 2 || item.type == 3));
                    } else if (this.state.tabKey == 2) {
                      result = (result && (item.type == 4));
                    } else if (this.state.tabKey == 3) {
                      result = (result && (item.type == 1));
                    } else if (this.state.tabKey == 4) {
                      result = (result && (item.type == 0));
                    }
                    return result;
                  });
                },
                success: true
              });
            }}
          />
        </ProCard>
      </ProCard>
    </div >

  }
}
