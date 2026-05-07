import React, { useState } from 'react';
import { Button, Tabs, Cascader, Form, Image, Modal } from 'antd';
import { connect } from 'dva';
import { history } from 'umi';
import { ProForm, ProFormSelect, ProFormGroup, ProFormText, ProFormTextArea, ProFormDateRangePicker, ProFormSwitch, ProFormUploadButton } from '@ant-design/pro-components';
import { filePrefix } from 'urlList';

function arrayContaine(srcArr, dArr) {  //比对srcArr二维数组里是否含有dArr一维数组，判断简单粗暴，只适合这里的关系判断
    for (let i = 0; i < srcArr.length; i++) {
        let item = srcArr[i];
        if (item.length != dArr.length) {
            continue;
        }
        if (item.length == 1) {
            if (item[0] == dArr[0]) {
                return true;
            }
        } else {
            if (item[0] == dArr[0] && item[1] == dArr[1]) {
                return true;
            }
        }
    }
    return false;
}

const InfoCom = ({ dispatch, lessonManage }) => {
    const [lessonInfoForm] = Form.useForm();
    const collegeEnum = {};
    const majorEnum = {};
    lessonManage.collegeList.forEach((item) => {
        collegeEnum[item.Id] = item.CollegeName;
    });
    lessonManage.majorList.forEach((item) => {
        majorEnum[item.MajorId] = item.MajorName;
    });
    const detail = lessonManage.lessonDetail;



    const confirmStartLesson = (value) => {
        if (value) {
            Modal.confirm({
                title: '确认要启动课程吗?',
                content: <p>课程开启后无法编辑课程章节,也无法关闭课程,只能删除后重新创建课程！</p>,
                onOk: () => {
                    lessonInfoForm.setFieldValue('status', true);
                },
                onCancel: () => {
                    lessonInfoForm.setFieldValue('status', false);
                },
            });
        }
    }


    return detail && <ProForm
        form={lessonInfoForm}
        onFinish={(values) => {
            const formData = {
                CourseName: values.lessonName,
                CourseCode: values.CourseCode,
                CollegeId: Number(values.collegeName || 0),
                MajorId: Number(values.majorName || 0),
                CourseStartTime: values.dateRange[0],
                CourseEndTime: values.dateRange[1],
                Status: values.status ? 1 : 0, //open close :true false
                Id: detail.Id,
                Digest: values.digest,
            }
            dispatch({ type: 'lessonManage/editLessonInfo', payload: formData });
        }}
        initialValues={{
            lessonName: detail.CourseName,
            CourseCode: detail.CourseCode,
            collegeName: detail.CollegeId ? String(detail.CollegeId) : undefined,
            majorName: detail.MajorId ? String(detail.MajorId) : undefined,
            dateRange: [
                detail.CourseStartTime,
                detail.CourseEndTime,
            ],
            digest: detail.Digest,
            status: detail.Status ? true : false,
        }}
    >
        <ProFormText
            width="md" name="lessonName" label="课程名称" placeholder="请输入课程名" rules={[{ required: true, message: '未填写' }]}
        />
        <ProFormText
            width="md" name="CourseCode" label="课程代码" placeholder="请输入课程代码"
        />
        <ProFormGroup>
            <ProFormSelect
                width="md" name="collegeName" label="所属学院" valueEnum={collegeEnum}
                onChange={(value) => {
                    dispatch({ type: 'lessonManage/queryMajorByCollegeId', payload: value });
                }}
            />
            <ProFormSelect
                width="md" name="majorName" label="所属专业" valueEnum={majorEnum}
            />
        </ProFormGroup>
        <ProFormGroup>
            <ProFormDateRangePicker
                name="dateRange" label="日期区间"
            />
            <ProFormSwitch
                name="status" label="是否开启" checkedChildren="开启" unCheckedChildren="关闭"
                fieldProps={{ onChange: confirmStartLesson }}
            />
        </ProFormGroup>
        <ProFormTextArea
            name='digest' label='简介' placeholder='请输入简介内容'
        />
    </ProForm>
}

const peopleCom = (dispatch, lessonManage) => {
    const editRelation = {
        Id: lessonManage.lessonDetail.Id,
        AddClass: [],
        AddStudent: [],
        RemoveClass: [],
        RemoveStudent: [],
    };
    const initRelation = []; //示例：[[1],[2,1],[2,3]]，1班全部，2班1/3号学生
    const peopleData = lessonManage.classStudentList?.map((item) => {
        return {
            label: item.ClassName,
            value: item.Id,
            children: item.Students?.map((ele) => {
                return {
                    label: ele.TrueName,
                    value: ele.Id,
                };
            }),
        };
    });

    lessonManage.courseRelation?.ClassArr?.forEach((item) => {
        initRelation.push([item,]);
    });
    lessonManage.courseRelation?.StudentArr?.forEach((i) => {
        initRelation.push(i);
    });

    return <ProForm
        onFinish={(values) => {
            const value = values.people;
            initRelation?.forEach((item) => { //循环初始化关系，判断是否有被删除的
                if (!arrayContaine(value, item)) {
                    if (item.length == 1) { //班级
                        if (editRelation.RemoveClass.indexOf(item[0]) == -1)
                            editRelation.RemoveClass.push(item[0]);
                    } else if (item.length == 2) { //单学生
                        if (editRelation.RemoveStudent.indexOf(item[1]) == -1)
                            editRelation.RemoveStudent.push(item[1]);
                    }
                } else {
                    if (item.length == 1) {
                        editRelation.RemoveClass = editRelation.RemoveClass.filter(i => i != item[0]);
                    } else if (item.length == 2) {
                        editRelation.RemoveStudent = editRelation.RemoveStudent.filter(i => i != item[1]);
                    }
                }
            });
            value?.forEach((ele) => { //循环实时值，判断是否要添加的
                if (!arrayContaine(initRelation, ele)) {
                    if (ele.length == 1) {
                        if (editRelation.AddClass.indexOf(ele[0]) == -1)
                            editRelation.AddClass.push(ele[0]);
                    } else if (ele.length == 2) {
                        if (editRelation.AddStudent.indexOf(ele[1]) == -1)
                            editRelation.AddStudent.push(ele[1]);
                    }
                } else {
                    if (ele.length == 1) {
                        editRelation.AddClass = editRelation.AddClass.filter(i => i != ele[0]);
                    } else if (ele.length == 2) {
                        editRelation.AddStudent = editRelation.AddStudent.filter(i => i != ele[1]);
                    }
                }
            });
            console.log("relation: ", initRelation, values, editRelation);
            dispatch({ type: 'lessonManage/editCourseRelation', payload: editRelation });
        }}
        onReset={() => {

        }}
        initialValues={{
            people: initRelation,
        }}
    >
        <Form.Item
            label='人员选择下拉框'
            name='people'
        >
            <Cascader
                style={{
                    width: '100%',
                }}
                options={peopleData}
                multiple
                maxTagCount="responsive"
                onChange={(value) => {
                }}
            />
        </Form.Item>
    </ProForm>
}

const pictureCom = (dispatch, lessonManage) => {
    const randomId = Math.random();
    const imgSrc = (lessonManage.lessonDetail.FilePath)
        ? (filePrefix() + lessonManage.lessonDetail.FilePath + "?random" + randomId)
        : ('');
    return <ProForm
        onFinish={(values) => {
            if (!values.image) {
                return;
            }
            const formData = {
                CourseId: lessonManage.lessonDetail.Id,
                fileData: values.image.map((item) => {
                    return item.originFileObj;
                }),
            }
            dispatch({ type: 'lessonManage/teacherAddLessonImage', payload: formData });
        }}
        onReset={() => {

        }}
        initialValues={{
            img: "",
        }}
    >
        <Form.Item label="原课程封面" name='img'>
            <Image width='200px' src={imgSrc} />
        </Form.Item>
        <ProFormUploadButton
            width='md' name="image" label="替换课程封面" max={1}
            onChange={(file, fileList) => {

            }}
        />
    </ProForm>
}

@connect(({ dispatch, lessonManage }) => ({ dispatch, lessonManage }))
export default class EditLesson extends React.Component {

    render() {
        return (
            <div>
                <Tabs
                    defaultActiveKey='1' items={[
                        {
                            key: '1',
                            label: '基本信息',
                            children: <InfoCom dispatch={this.props.dispatch} lessonManage={this.props.lessonManage} />,
                        },
                        {
                            key: '2',
                            label: '人员列表',
                            children: (
                                peopleCom(this.props.dispatch, this.props.lessonManage)
                            ),
                        },
                        {
                            key: '3',
                            label: '课程封面',
                            children: (
                                pictureCom(this.props.dispatch, this.props.lessonManage)
                            )
                        }
                    ]}
                    tabBarExtraContent={
                        <Button type='primary' onClick={() => {
                            history.push({ pathname: "/lessonManage/lessonList" })
                        }}>返回课程列表</Button>
                    }
                >
                </Tabs>
            </div >
        );
    }
}