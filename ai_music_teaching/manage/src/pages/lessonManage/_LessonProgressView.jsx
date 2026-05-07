import { Modal, Table, Progress } from 'antd'
import React, { forwardRef, useState, useImperativeHandle } from 'react'
import { connect } from 'umi'

function LessonProgressView({ lessonProgressData }) {

    const columns = [
        {
            title: '记录ID',
            dataIndex: 'Id',
            sorter: (a, b) => a.Id - b.Id
        },
        {
            title: '学生ID',
            dataIndex: 'StudentId',

        },
        {
            title: '姓名',
            dataIndex: 'TrueName'
        },
        {
            title: '最近学习章节',
            dataIndex: 'ChapterOrder',
            render:(order)=><span>第{order+1}章</span>
        },
        {
            title: '章节学习进度',
            dataIndex: 'LearningRate',
            render:(rate) => <Progress percent={rate} />

        },
        {
            title: '章节数量',
            dataIndex: 'ChapterNum'
        },
        {
            title: '课程学习进度',
            dataIndex: 'progress',
            render(_, record) {
                let a = 100 / record.ChapterSum;
                let b = parseInt(a * record.LearningRate / 100);
                let totalProgress = parseInt(b + a * (record.ChapterOrder));
                return <Progress percent={totalProgress} />
            }
        }
    ]

    return <Table
        dataSource={lessonProgressData}// 避免删除时无法刷新掉已删除的项
        rowKey={'Id'}
        columns={columns}
        pagination={false}
    />
}

export default LessonProgressView