import { Card, Steps, Button, Row, Col, List, Space, Image, Progress, Empty, Typography, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { questionTypes } from 'utils/dict';
import { connect, history } from 'umi';
import './index.css';
const { Text } = Typography;


function PlanCard({ dispatch, planInfo, studentId, planDetailList, onStartPractice, onStartExam, loading }) {
    const { PlanId } = planInfo;

    function startStudy(CourseId) {
        history.push({ pathname: '/lesson/lessondetail', state: { CourseId, fromPathname: "/homePage" } });
    }

    useEffect(() => {
        const planDetail = planDetailList.find((p) => p.PlanId === PlanId);
        if (!planDetailList || Object.keys(planDetailList).length === 0 || !planDetail) {
            dispatch({ type: "homePageSpace/fetchPlanCourse", payload: { PlanId, StudentId: studentId } });
            dispatch({ type: "homePageSpace/fetchPlanPractice", payload: { PlanId, StudentId: studentId } });
            dispatch({ type: "homePageSpace/fetchPlanExam", payload: { PlanId, StudentId: studentId } });
        }
    }, [planInfo])

    const { planCourseInfo, planPractice, planExam } = planDetailList.find((p) => p.PlanId === PlanId) || {}

    function averageScore(list, scoreFieldMap) {
        if (!list || !list.length || list.length === 0) {
            return [0, 0];
        }
        let totalScore = 0;
        let progress = 0;
        list.forEach(item => {
            const score = scoreFieldMap(item);
            if (score >= 0) {
                totalScore += score;
                progress += 1;
            }
        })
        return [totalScore / list.length, Math.round(progress * 100 / list.length)];
    }
    function calculateScore() {
        let lessonProgress = 0;
        // 课程进度
        if (planCourseInfo && planCourseInfo.ChapterSum) {
            let a = 100 / planCourseInfo.ChapterSum;
            let b = a * (planCourseInfo.LearningRate) / 100;
            lessonProgress = b + a * (planCourseInfo.ChapterOrder);
        }
        // 练习进度
        const [practiceScore, practiceProgress] = averageScore(planPractice, element => element.TrainScore);
        // 考试进度
        const [examScore, examProgress] = averageScore(planExam, element => element.Score)
        return [lessonProgress * planInfo.CourseRatio / 100
            + practiceScore * planInfo.TrainRatio / 100
            + examScore * planInfo.ExamRatio / 100, lessonProgress, practiceProgress, examProgress];
    }
    const [pass, lessonProgress, practiceProgress, examProgress] = calculateScore();

    const steps = [
        {
            title: "课程学习",
            status: lessonProgress > 60 ? "finish" : (lessonProgress === 0 ? "wait" : "process"),
            description: planCourseInfo?.CourseName ?
                <div>
                    <Row>
                        <Col span={20}><span className='planText'>{planCourseInfo.CourseName}</span></Col>
                        <Col span={4}><a onClick={() => startStudy(planCourseInfo.CourseId)}>开始学习</a></Col>
                    </Row>
                    <Space><span>学习进度：</span><Progress style={{ width: '2.4rem' }} percent={lessonProgress.toFixed(1)} /></Space>
                </div>
                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />

        },
        {
            title: "模拟训练",
            status: practiceProgress === 100 ? "finish" : (practiceProgress === 0 ? "wait" : "process"),
            description: <List
                rowKey={'PlanTrainId'}
                loading={loading.effects["homePageSpace/fetchPlanPractice"]}
                dataSource={planPractice}
                renderItem={item => <List.Item
                    actions={[<a key={item.PlanTrainId} onClick={() => onStartPractice(item.QuestionId, item.PlanId)}>开始练习</a>]}
                    extra={<Tag color={item.TrainScore === -1 ? "#f50" : "#87d068"}> {item.TrainScore === -1 ? "未训练" : "已训练"}</Tag>}
                >
                    {/* <Text >{item.QuestionName}</Text>    */}
                    < Text className='planText'
                        ellipsis={{ tooltip: item.QuestionName }}>
                        {(questionTypes[item.QuestionType] || (item.QuestionType + "题型")) + "：" + item.QuestionName}
                    </Text >
                </List.Item >} />
        },
        {
            title: '考试',
            status: examProgress === 100 ? "finish" : (examProgress === 0 ? "wait" : "process"),
            description: <List
                rowKey={'ExamSessionId'}
                dataSource={planExam}
                loading={loading.effects["homePageSpace/fetchPlanExam"]}
                renderItem={item => <List.Item
                    actions={[<a key={item.ExamSessionId} onClick={() =>
                        onStartExam(
                            {
                                ExamId: item.ExamId,
                                ExamSessionId: item.ExamSessionId,
                                StartTime: item.SessionStartExamTime,  //用于在考试页面显示时间
                                EndTime: item.SessionEndExamTime,//用于在考试页面显示时间
                                QuestionSum: item.QuestionNum, //用于考试页面显示题目使用
                            },
                            item.PlanId
                        )

                    }>
                        开始考试
                    </a>]}
                    extra={<Tag color={item.Score === -1 ? "#f50" : "#87d068"}> {item.Score === -1 ? "未考试" : "已考试"}</Tag>}
                >
                    <span className='planText'>{item.ExamName + "-第" + item.SessionNum + "场考试"}</span>
                </List.Item>} />

        },
    ];
    return <Card style={{ width: '5rem', minHeight: '50vh' }}>
        <Row>
            <Col span={18}><span className='planTitle'>{planInfo.PlanName}</span></Col >
            <Col span={6}><span className='planTitle' style={{ color: pass > 60 ? 'green' : 'red' }}>
                {pass > 60 ? '合格' : '未合格'}
            </span></Col>
        </Row>
        <br />
        <Steps
            direction='vertical'
            size="small"
            items={steps}
        />
    </Card >
}


// export default PlanCard;
export default connect(({ homePageSpace, loading }) => ({
    planDetailList: homePageSpace.planDetailList,
    loading
}))(PlanCard)
