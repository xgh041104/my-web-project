import React, { useMemo } from 'react'
import { connect } from 'umi'
import { Cascader } from 'antd'


function initSchoolInfoOption(lessonList) {
    //TODO:可将此处dispatch改为查找学院列表然后再在Cascader内部做动态查找
    if (!lessonList || lessonList.length < 1) {
        return undefined;
    }
    console.log("init schoolInfo");
    let schoolInfoOption = []
    lessonList.forEach(lesson => {
        // 查找专业结点
        let targetCollegeList = schoolInfoOption.find(item => item.value === lesson.CollegeId);
        if (!targetCollegeList) {
            // 添加新课程叶子结点
            schoolInfoOption.push({
                value: lesson.CollegeId,
                label: lesson.CollegeName,
                key: "college" + lesson.CollegeId,
                children: [
                    {
                        value: lesson.MajorId, label: lesson.MajorName, key: "major" + lesson.MajorId, children: [
                            { value: lesson.Id, label: lesson.CourseName, key: "course" + lesson.Id }
                        ]
                    }
                ]
            })
        }
        else {
            // 查找学院结点
            let targetMajor = targetCollegeList.children.find(item => item.value === lesson.MajorId)
            if (!targetMajor) {
                targetCollegeList.children.push({
                    value: lesson.MajorId, label: lesson.MajorName, key: "major" + lesson.MajorId, children: [
                        { value: lesson.Id, label: lesson.CourseName, key: "course" + lesson.Id }
                    ]
                })
            }
            else {
                // 没有相同Id的课程
                targetMajor.children.push({ value: lesson.Id, label: lesson.CourseName, key: "course" + lesson.Id })
            }
        }
    })
    console.log(schoolInfoOption);
    return schoolInfoOption;
}



let queryLessonList = null;

function CourseCascader(props) {
    const { onChange, value, dispatch, loading, lessonList, ...cascaderProps } = props;
    // 使用useMemo防止每次render都重新计算
    const schoolInfoOption = useMemo(() => {
        const info = initSchoolInfoOption(lessonList);
        if (!info&&!loading.effects["lessonManage/queryLessonList"]) {
            dispatch({ type: 'lessonManage/queryLessonList' });
        }
        queryLessonList = lessonList;
        return info;
    }, [lessonList])

    return <Cascader onChange={onChange} value={value} options={schoolInfoOption} allowClear={false} {...cascaderProps} />
}

export function getCourseName(courseId){
    return queryLessonList?.find(course=>course.Id ===courseId )?.CourseName||null
}

export default connect(({ dispatch, loading, lessonManage }) =>
    ({ dispatch,loading, lessonList: lessonManage.lessonList || [] }))(CourseCascader)