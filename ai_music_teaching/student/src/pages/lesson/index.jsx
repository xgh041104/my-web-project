import React from 'react';
import { ProList, ProDescriptions, ProCard } from '@ant-design/pro-components';
import { Image, Button, Breadcrumb, Radio, Divider } from 'antd';
import { connect } from 'dva';
import { history, Link } from 'umi';
import UnloginEmpty from '../unlogin';
import { filePrefix } from 'urlList';


@connect(({ dispatch, lessonCenter, user }) => ({ dispatch, lessonCenter, userInfo: user.userInfo }))
export default class LessonCenter extends React.Component {
  dataList = {
    data0: [], //未开始
    data1: [], //正在学
    data2: [], //已完成
    data3: [], //已过期
  };

  constructor(props) {
    super(props);
    this.state = ({
      tabKey: 'data1',
    });
    this.listRef = React.createRef();
  }

  componentDidUpdate() {
    this.listRef.current?.reload();
  }

  switchDataTab(key) {
    this.setState({
      tabKey: key,
    });
  }

  resumeDataList() {
    this.dataList = {
      data0: [], //未开始
      data1: [], //正在学
      data2: [], //已完成
      data3: [], //已过期
    };
    this.props.lessonCenter.lessonList?.forEach((item) => {
      if (item.IsCurrentStudy == 0) {
        this.dataList.data0.push(item);
      } else if (item.IsCurrentStudy == 1) {
        this.dataList.data1.push(item);
      } else if (item.IsCurrentStudy == 2) {
        this.dataList.data2.push(item);
      } else if (item.IsCurrentStudy == 3) {
        this.dataList.data3.push(item);
      }
    });
  }

  render() {
    this.resumeDataList();
    const teacherEnum = {};
    const majorEnum = {};
    const dataSource = this.dataList[this.state.tabKey]?.map((item) => {
      if (!teacherEnum[item.TeacherId]) {
        teacherEnum[item.TeacherId] = item.TeacherName;
      }
      if (!majorEnum[item.MajorId]) {
        majorEnum[item.MajorId] = item.MajorName;
      }

      let a = 100 / item.ChapterSum;
      let b = parseInt(a * item.LearningRate / 100);
      let totalProgress = Math.round(b + a * (item.ChapterOrder));

      // const discriptionStyle = { column: { xs: 1, sm: 1, md: 1, lg: 2 xl: 3, xxl: 3 }, style: { whiteSpace: "nowrap" } }


      return ({
        title: "  课程名：" + item.CourseName,
        extra: (
          <Image width={200} src={(item.FilePath) ? (filePrefix() + item.FilePath) : ('')} />
        ),
        content: (
          <ProDescriptions
            column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2, xxl: 3 }} style={{ whiteSpace: "nowrap" }}
          // column={2}
          >
            <ProDescriptions.Item label="主讲教师" valueType='text'>{item.TeacherName}</ProDescriptions.Item>
            <ProDescriptions.Item label="所属专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
            <ProDescriptions.Item label="章节总数" valueType='text'>{item.ChapterSum}</ProDescriptions.Item>
            <ProDescriptions.Item label="学生总数" valueType='text'>{item.StudentSum}</ProDescriptions.Item>
            <ProDescriptions.Item span={2} label="课程限时" valueType='text'>{item.CourseStartTime + " ~ " + item.CourseEndTime}</ProDescriptions.Item>
            <ProDescriptions.Item label="学习进度" valueType='progress'>{totalProgress}</ProDescriptions.Item>
          </ProDescriptions>
        ),
        teacherId: item.TeacherId,
        majorId: item.MajorId,
        courseId: item.CourseId,
      });
    });
    // console.log('lessonCenter:', this.dataList[this.state.tabKey]);

    const nowrapText = { whiteSpace: 'nowrap' }
    return (!this.props.userInfo.isLogin) ? (<UnloginEmpty />) : (
      <div style={{ left: 0, right: 0, margin: "auto", width: "80%" }}>
        {/*<Breadcrumb>
                     <Breadcrumb.Item>
                        <Link to='/homePage'>首页</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <a >课程中心</a>
                    </Breadcrumb.Item>
                </Breadcrumb>*/}
        <ProCard style={{ background: 'transparent' }}>
          <ProCard colSpan='15%' style={{ background: 'transparent' }}>
            <h2 style={nowrapText}>课程分类</h2>
            <Radio.Group defaultValue='data1' buttonStyle='solid' size='large'
              onChange={(e) => this.switchDataTab(e.target.value)}
            >
              <Radio.Button style={nowrapText} value='data0'>未开始课程</Radio.Button>
              <Radio.Button style={nowrapText} value='data1'>正在学课程</Radio.Button>
              <Radio.Button style={nowrapText} value='data2'>已完成课程</Radio.Button>
              <Radio.Button style={nowrapText} value='data3'>已过期课程</Radio.Button>
            </Radio.Group>
          </ProCard>
          <Divider type='vertical' style={{ height: 'auto' }} />
          <ProCard style={{ background: 'transparent' }}>
            <ProList actionRef={this.listRef}
              rowKey='CourseId'
              pagination={{
                defaultPageSize: 5,
              }}
              search={{}}
              itemLayout='vertical'
              // cardBordered
              metas={{
                title: { title: "课程名", dataIndex: 'title' },
                description: { search: false },
                actions: {
                  search: false,
                  render: (text, record, index) => {
                    return (
                      <Button type='primary' onClick={() => history.push({ pathname: '/lesson/lessondetail', state: { CourseId: record.courseId } })}>查看详情</Button>
                    );
                  },
                },
                extra: { search: false },
                content: { search: false },

                //下面两个是自定义属性，专用来做筛选不显示
                teacherId: {
                  title: '主讲教师',
                  valueType: 'select',
                  valueEnum: teacherEnum,
                },
                majorId: {
                  title: '所属专业',
                  valueType: 'select',
                  valueEnum: majorEnum,
                },
              }}
              request={(params, sort, filter) => {
                return Promise.resolve({
                  data: () => {
                    return dataSource?.filter((item) => {
                      let result = true;
                      if (params.title) {
                        result = (result && item.title.indexOf(params.title) != -1)
                      }
                      if (params.teacherId) {
                        result = (result && item.teacherId == params.teacherId)
                      }
                      if (params.majorId) {
                        result = (result && item.majorId == params.majorId)
                      }
                      return result;
                    });
                  },
                  success: true,
                });
              }}
            />
          </ProCard>
        </ProCard>

      </div>
    )
  }
}
