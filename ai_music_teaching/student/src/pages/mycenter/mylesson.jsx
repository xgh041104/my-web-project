import React from 'react';
import { ProList, ProDescriptions } from '@ant-design/pro-components';
import { Tag, Image, Button } from 'antd';
import { filePrefix } from 'urlList';
import { connect } from 'dva';
import { history } from 'umi';

@connect(({ dispatch, myCenter, user }) => ({ dispatch, myCenter, user }))
export default class MyLesson extends React.Component {
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
        })
    }

    resumeDataList() {
        this.dataList = {
            data0: [], //未开始
            data1: [], //正在学
            data2: [], //已完成
            data3: [], //已过期
        };
        this.props.myCenter.myLesson?.forEach((item) => {
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
            if (!item.TotalProgress) {
                let a = 100 / item.ChapterSum;
                let b = parseInt(a * item.LearningRate / 100);
                item.TotalProgress = b + a * (item.ChapterOrder);
            }
            return ({
                title: "  课程名：" + item.CourseName,
                extra: (
                    <Image width={200} src={(item.FilePath) ? (filePrefix() + item.FilePath) : ('')} />
                ),
                content: (
                    <ProDescriptions
                    // column={2}
                    >
                        <ProDescriptions.Item label="主讲教师" valueType='text'>{item.TeacherName}</ProDescriptions.Item>
                        <ProDescriptions.Item label="所属专业" valueType='text'>{item.MajorName}</ProDescriptions.Item>
                        <ProDescriptions.Item label="章节总数" valueType='text'>{item.ChapterSum}</ProDescriptions.Item>
                        <ProDescriptions.Item label="学生总数" valueType='text'>{item.StudentSum}</ProDescriptions.Item>
                        <ProDescriptions.Item label="课程限时" valueType='text'>{item.CourseStartTime + " ~ " + item.CourseEndTime}</ProDescriptions.Item>
                        <ProDescriptions.Item label="学习进度" valueType='progress'>{Math.round(item.TotalProgress)}</ProDescriptions.Item>
                    </ProDescriptions>
                ),
                teacherId: item.TeacherId,
                majorId: item.MajorId,
                courseId: item.CourseId,
            });
        });

        return (
            <ProList actionRef={this.listRef}
                rowKey='CourseId'
                pagination={{
                    defaultPageSize: 5,
                }}
                search={{}}
                itemLayout='vertical'
                cardBordered
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
                toolbar={{
                    menu: {
                        activeKey: this.state.tabKey,
                        items: [
                            {
                                key: 'data0',
                                label: (<span>未开始的课程</span>),
                            },
                            {
                                key: 'data1',
                                label: (<span>学习中的课程</span>),
                            },
                            {
                                key: 'data2',
                                label: (<span>已完成的课程</span>),
                            },
                            {
                                key: 'data3',
                                label: (<span>已过期的课程</span>),
                            },
                        ],
                        onChange: (key) => this.switchDataTab(key),
                    },
                }}
            />
        );
    }
}