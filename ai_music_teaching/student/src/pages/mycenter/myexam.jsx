import React from 'react';
import { Button, Spin, Modal, Space, Row, Col, message } from 'antd';
import { ProList, ProDescriptions } from '@ant-design/pro-components';
import { connect } from 'dva';
import PaperDisplayCom from '../exam/_paperdisplay'


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
    this.setState({
      cDate: new Date(),
    });
  }

  render() {
    const mNum = parseInt(this.state.sDate - this.state.cDate) - this.props.offsetTime;
    const s = parseInt(mNum / 1000);
    const m = parseInt(s / 60);
    const h = parseInt(m / 60);
    const d = parseInt(h / 24);
    return <span>
      {String(d)}天{String(d * 24 - h)}小时{String(h * 60 - m)}分{String(m * 60 - s)}秒
    </span>;
  }
}

@connect(({ dispatch, myCenter, user }) => ({ dispatch, myCenter }))
export default class MyExam extends React.Component {

  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.cameraVideoRef = React.createRef();
    this.state = {
      tabKey: 1,
      openDeviceModal: false,
      verifyInfo: null,
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
    if (!params || typeof (params) !== 'object' || Object.keys(params).length == 0) {
      console.log('查看考试完成详情参数出错');
      return;
    }
    this.props.dispatch({
      type: 'examCenter/queryExamFinishDetail', payload: params,
      callback: (detail) => {
        console.log('查看考试完成详情', detail);
        Modal.info({
          title: '考试答题数据详情预览窗口',
          content: <PaperDisplayCom paperDetail={detail} />,
          width: '60vw',
          closable: true,
        });
      }
    })
  }

  verifyCallback = (result, msg) => {
    if (result == 1) {
      this.setState({
        verifyInfo: {
          verifing: false,
          tip: "识别成功"
        },
        openDeviceModal: false,
      })
      message.success(msg);
    }
    else {
      message.error(msg);
      this.setState({
        verifyInfo: {
          verifing: false
        }
      })
      message.error("识别失败,请调整摄像头后重试", 8)
    }
  }

  render() {
    const data = this.props.myCenter.MyExam;
    const majorEnum = {};
    const courseEnum = {};
    const dataSource = data?.map((item) => {
      if (!majorEnum[item.MajorId]) {
        majorEnum[item.MajorId] = item.MajorName;
      }
      if (!courseEnum[item.CourseId]) {
        courseEnum[item.CourseId] = item.CourseName;
      }

      let descrContent = null;
      let extraContent = null;
      if (item.ExamZT == 0) { //已过期
        descrContent = <ProDescriptions key={'d' + item.Id}>
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
        extraContent = <Space direction='vertical' style={{ alignItems: 'end' }} key={'e' + item.Id}>
          <Button>考试时间已过，不可参加考试</Button>
          <span>考试结束时间：{item.SessionEndExamTime}</span>
        </Space>;
      } else if (item.ExamZT == 1) { //已完成
        descrContent = <ProDescriptions key={'d' + item.Id}>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="考试得分" valueType='text'><span style={{ color: 'red', fontWeight: 800 }}>{item.Score >= item.PassScore ? '合格' : '不合格'}</span></ProDescriptions.Item>
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
        extraContent = <Space direction='vertical' style={{ alignItems: 'end' }} key={'e' + item.Id}>
          <div>
            {item.PassScore > item.Score && <>
              {this.props.examEnable &&
                <Button type='primary' danger style={{ marginRight: '10px' }}
                  onClick={() => {
                    const examState = {
                      ExamId: item.ExamId,
                      ExamSessionId: item.ExamSessionId,
                      StartTime: item.ResetStartExamTime,  //用于在考试页面显示时间
                      EndTime: item.ResetEndExamTime,//用于在考试页面显示时间
                      QuestionSum: item.QuestionNum, //用于考试页面显示题目使用
                      IsReTest: item.ExamZT === 4
                    }
                    this.shouldEnterExam()
                  }}
                >开始考试</Button>
              }</>
            }
            <Button type='primary'
              onClick={() => {
                this.viewExamDetail({
                  ExamId: item.ExamId,
                  ExamSessionId: item.ExamSessionId,
                });
              }}
            >查看考试详情</Button>
          </div>
          <span>考试结束时间：{item.SessionEndExamTime}</span>
        </Space>;
      } else if (item.ExamZT == 2) { //未参加考试，考试时间已到
        descrContent = <ProDescriptions key={'d' + item.Id}>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="时间区间" valueType='text'><div>
            <span>开考：{item.SessionStartExamTime}</span><br /> <span>停考：{item.SessionEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end' }} key={'e' + item.Id}>
          {this.props.examEnable && <Button type='primary' danger
            onClick={() => {
              const examState = {
                ExamId: item.ExamId,
                ExamSessionId: item.ExamSessionId,
                StartTime: item.SessionStartExamTime,  //用于在考试页面显示时间
                EndTime: item.SessionEndExamTime,//用于在考试页面显示时间
                QuestionSum: item.QuestionNum, //用于考试页面显示题目使用
                IsReTest: item.ExamZT === 4
              }
              this.setState({
                openDeviceModal: true
              })
              this.shouldEnterExam()
            }}
          >开始考试</Button>}
          <span style={{ color: 'red', fontWeight: 800 }}>考试结束倒计时：<TimerCom sourceTime={item.SessionEndExamTime} offsetTime={this.props.myCenter.offsetTime} /></span>
        </Space>;
      } else if (item.ExamZT == 3) { //考试未开始
        descrContent = <ProDescriptions key={'d' + item.Id}>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="时间区间" valueType='text'><div>
            <span>开考：{item.SessionStartExamTime}</span><br /> <span>停考：{item.SessionEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end' }} key={'e' + item.Id}>
          <Button >等待开考</Button>
          <span>距离考试开始时间：<TimerCom sourceTime={item.SessionStartExamTime} offsetTime={this.props.myCenter.offsetTime} /></span>
        </Space>;
      } else if (item.ExamZT == 4) { //未补考
        descrContent = <ProDescriptions key={'d' + item.Id}>
          <ProDescriptions.Item label="考试限时" valueType='text'>{item.ExamDuration}分钟</ProDescriptions.Item>
          <ProDescriptions.Item label="试卷总分" valueType='text'>{item.FullMarks}分</ProDescriptions.Item>
          <ProDescriptions.Item label="题目总数" valueType='text'>{item.QuestionNum}题</ProDescriptions.Item>
          <ProDescriptions.Item label="关联专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
          <ProDescriptions.Item label="关联课程" valueType='text'>{item.CourseName}</ProDescriptions.Item>
          <ProDescriptions.Item label="补考时间" valueType='text'><div>
            <span>开考：{item.ResetStartExamTime}</span><br /> <span>停考：{item.ResetEndExamTime}</span>
          </div></ProDescriptions.Item>
        </ProDescriptions>;
        extraContent = <Space direction='vertical' style={{ alignItems: 'end' }} key={'e' + item.Id}>
          {this.props.examEnable && <Button type='primary' danger
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
              this.setState({
                currentExamState: examState,
                openDeviceModal: true,
              })
              this.shouldEnterExam()
            }}
          >开始补考</Button>}
          <span style={{ color: 'red', fontWeight: 800 }}>补考结束倒计时：<TimerCom sourceTime={item.ResetEndExamTime} offsetTime={this.props.myCenter.offsetTime} /></span>
        </Space>;
      } else {
        descrContent = <span>数据出错，请返回刷新！</span>
      }

      return ({
        title: (<Row><Space size={'large'}>
          <Col></Col>
          <Col><h2>{item.ExamName + "-第" + item.SessionNum + "场考试"}</h2></Col>
        </Space></Row>),
        content: (descrContent),
        extra: (extraContent),
        majorId: item.MajorId, //用作筛选
        courseId: item.CourseId,//用作筛选
        name: item.ExamName + "-第" + item.SessionNum + "场考试",//用作筛选
        id: item.Id,//用作key
        type: item.ExamZT, //用作筛选
        endTime: item.SessionEndExamTime,
        startTime: item.SessionStartExamTime,
      });
    }) || [];

    return (
      <div style={{ left: 0, right: 0, margin: "auto", width: "80%" }}>
        <Modal
          title="考试验证" maskClosable={false}
          open={this.state.openDeviceModal}
          onCancel={() => {
            if (this.state.verifyInfo.verifing) {
              message.error("正在验证,无法退出");
              return;
            }
            this.setState({ openDeviceModal: false })
          }}
          footer={[]}
        >
        </Modal>
        <ProList style={{ margin: ".15rem auto" }}
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
          toolbar={{
            menu: {
              activeKey: this.state.tabKey,
              items: [
                {
                  key: 1,
                  label: (<span>待考中的考试</span>),
                },
                // {
                //     key: 2,
                //     label: (<span>需补考的考试</span>),
                // },
                {
                  key: 3,
                  label: (<span>已完成的考试</span>),
                },
                {
                  key: 4,
                  label: (<span>已过期的考试</span>),
                },
              ],
              onChange: (key) => this.switchDataTab(key),
            },
          }}
        />
      </div>
    );
  }
}
