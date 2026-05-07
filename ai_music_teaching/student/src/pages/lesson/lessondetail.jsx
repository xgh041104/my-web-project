import React from 'react';
import { Breadcrumb, Button, Divider, Image, List, Tag, Space, Typography, Row, Col } from 'antd';
import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { PlaySquareOutlined, FileImageOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { history,Link} from 'umi';
import { connect } from 'dva';
import { filePrefix } from 'urlList';

const { Title, Text } = Typography;

@connect(({ dispatch, lessonCenter }) => ({ dispatch, lessonCenter }))
export default class LessonDetail extends React.Component {

    startStudy() {
        let chapterIndex;
        const data = this.props.lessonCenter.lessonDetail;
        if (data.LearningRate < 100) {
            chapterIndex = data.ChapterOrder;
        } else {
            chapterIndex = data.ChapterOrder + 1;
        }

        if (chapterIndex < 0 || chapterIndex > data.ChapterSum) {
            console.log('进入学习，章节序号判断出错');
            return;
        }

        let chapterId = -1;
        data.ChapterList.forEach((item) => {
            if (item.ChapterOrder == chapterIndex) {
                chapterId = item.Id;
            }
        });

        if (chapterId < 0) {
            console.log('进入学习，章节Id获取出错');
            return;
        }

        history.push({ pathname: '/lesson/studypage', state: { ChapterId: chapterId } });
    }

    startButton(type) {
        if (type == 0) {
            return <Button type='primary' disabled>课程未开始</Button>
        } else if (type == 1) {
            return <Button type='primary' onClick={() => { this.startStudy() }}>开始学习</Button>
        } else if (type == 2) {
            return <Button type='primary' disabled>课程已完成</Button>
        } else if (type == 3) {
            return <Button type='primary' disabled>课程已过期</Button>
        }
    }

    render() {
        const data = this.props.lessonCenter.lessonDetail;
        // console.log('lessonDetail: ', data);

        let a = 100 / data.ChapterSum;
        let b = a * (data.LearningRate) / 100;
        data.TotalProgress = Math.round(b + a * (data.ChapterOrder));

        return <div style={{ left: 0, right: 0, margin: "0 auto .15rem", width: "80vw" }}>
            {/* <Breadcrumb>
                <Breadcrumb.Item>
                    <Link to='/homePage'>首页</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to='/lesson'>课程中心</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <a>课程详情</a>
                </Breadcrumb.Item>
            </Breadcrumb> */}
            <ProCard split='horizontal' >
                <ProCard >
                    <ProCard colSpan='30%'  >
                        <div >
                            <Image width='20vw' src={(data.FilePath) ? (filePrefix() + data.FilePath) : ('')}></Image>
                        </div>
                    </ProCard>
                    <Divider type='vertical' style={{ height: 'auto' }} />
                    <ProCard
                        title={<h1 style={{ fontWeight: 800 }}>{"课程名： " + data.CourseName}</h1>}
                        extra={
                            <Space>
                                {this.startButton(data.IsCurrentStudy)}
                                <Button onClick={() => { history.push({ pathname: '/lesson' }) }}>返回课程中心</Button>
                            </Space>
                        }
                    >
                        <ProDescriptions
                            column={2}
                            style={{ marginTop: '3vh', }}
                        >
                            <ProDescriptions.Item label="主讲教师" valueType='text'>{data.TeacherName}</ProDescriptions.Item>
                            <ProDescriptions.Item label="所属专业" valueType='text'>{data.MajorName}</ProDescriptions.Item>
                            <ProDescriptions.Item label="学生总数" valueType='text'>{data.StudentSum}</ProDescriptions.Item>
                            <ProDescriptions.Item label="课程限时" valueType='text'>{data.CourseStartTime + " ~ " + data.CourseEndTime}</ProDescriptions.Item>
                            <ProDescriptions.Item label="学习进度" valueType='progress'>{data.TotalProgress}</ProDescriptions.Item>
                        </ProDescriptions>
                    </ProCard>
                </ProCard>
                <ProCard >
                    <ProCard title={<h2 style={{ fontWeight: 400 }}>章节列表</h2>} colSpan='70%'>
                        <List
                            dataSource={data.ChapterList ? (data.ChapterList) : []}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <a key={'finishKey'}>
                                            {
                                                (item.ChapterOrder < data.ChapterOrder || (item.ChapterOrder == data.ChapterOrder && data.LearningRate == 100)) ? (
                                                    <span style={{ color: 'gray' }}><CheckOutlined /> 已学完</span>
                                                ) : (
                                                    <span><LoadingOutlined /> 待学习</span>
                                                )
                                            }
                                        </a>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<Space size={'large'}><h3>第{String(item.ChapterOrder + 1)}章节</h3><h3>{item.ChapterName}</h3></Space>}
                                    />
                                    <div>
                                        {(Number(item.ChapterType)) ? (
                                            <span><PlaySquareOutlined /> 视频课</span>
                                        ) : (
                                            <span><FileImageOutlined /> 图文课</span>
                                        )}
                                    </div>
                                </List.Item>
                            )}
                        />
                    </ProCard>
                    <Divider type='vertical' style={{ height: 'auto' }} />
                    <ProCard title={<h2 style={{ fontWeight: 400 }}>课程简介</h2>}>
                        <Text>{data.Digest}</Text>
                    </ProCard>
                </ProCard>
            </ProCard>
        </div>
    }
}