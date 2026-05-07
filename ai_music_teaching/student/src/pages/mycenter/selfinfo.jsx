import React from 'react';
import { ProDescriptions } from '@ant-design/pro-components';
import { connect } from 'dva';

//目前的学生信息字段，以做比对
// "data": {
//     "Id": 1,
//     "StudentType": 1,
//     "StudentAccount": "dbq",
//     "StudentPwd": "",
//     "StandId": 1,
//     "ExamName": "学校考试",
//     "SchoolId": 1,
//     "CollegeId": 1,
//     "MajorId": 1,
//     "ClassId": 2,
//     "TrueName": "段丙铨",
//     "IDNumber": "5121212",
//     "ExamNumber": "12122",
//     "Birthday": "19980329",
//     "Phone": "133",
//     "Email": "222@163.com",
//     "IDImage": "1",
//     "SchoolName": "清华大学",
//     "CollegeName": "美术学院",
//     "MajorName": "计算机科学与技术",
//     "ClassName": "宝石2班",
//     "StandName": "武汉国土1"
//     "Sex": "0"
// }

@connect(({ dispatch, myCenter }) => ({ dispatch, myCenter }))
export default class SelfInfoPage extends React.Component {

    render() {
        return (
            <ProDescriptions
                title="个人信息"
                // bordered='true'
                dataSource={{ ...this.props.myCenter.studentInfo }}
                columns={[
                    { title: '账号', key: 'StudentAccount', dataIndex: 'StudentAccount', valueType: '' },
                    { title: '类型', key: 'StudentType', dataIndex: 'StudentType',     valueEnum: {
                        0: {
                            text: '在校生',
                        },
                        1: {
                            text: '考试用户',
                        },
                        2: {
                            text: '未知',
                        },
                    },},
                    { title: '姓名', key: 'TrueName', dataIndex: 'TrueName', valueType: '' },
                    { title: '身份证号', key: 'IDNumber', dataIndex: 'IDNumber', valueType: '' },
                    { title: '学号/准考证号', key: 'ExamNumber', dataIndex: 'ExamNumber', valueType: '' },
                    {
                        title: '性别', key: 'Sex', dataIndex: 'Sex',
                        valueEnum: {
                            0: {
                                text: '女',
                            },
                            1: {
                                text: '男',
                            },
                            2: {
                                text: '未知',
                            },
                        },
                    },
                    { title: '学校', key: 'SchoolName', dataIndex: 'SchoolName', valueType: '' },
                    { title: '学院', key: 'CollegeName', dataIndex: 'CollegeName', valueType: '' },
                    { title: '专业', key: 'MajorName', dataIndex: 'MajorName', valueType: '' },
                    { title: '班级', key: 'ClassName', dataIndex: 'ClassName', valueType: '' },
                    { title: '所属站点', key: 'StandName', dataIndex: 'StandName', valueType: '' },
                    {},
                    { title: '出生日期', key: 'Birthday', dataIndex: 'Birthday', valueType: '' },
                    { title: '联系电话', key: 'Phone', dataIndex: 'Phone', valueType: '' },
                    { title: '邮箱地址', key: 'Email', dataIndex: 'Email', valueType: '' },
                    // {title:'性别',key:'Sex',dataIndex:'Sex',valueType:''},
                ]}
            >

            </ProDescriptions>
        )
    }
}
