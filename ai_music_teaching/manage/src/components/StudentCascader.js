import React, { useMemo, useEffect } from 'react'
import { connect } from 'umi'
import { Cascader } from 'antd'

function initStudentOptions(studentList) {
  if (!studentList || studentList.length < 1) {
    return undefined;
  }

  const classMap = new Map();

  studentList.forEach(student => {
    if (student.StudentType !== 0) return; // 只保留在校生

    if (!classMap.has(student.ClassId)) {
      classMap.set(student.ClassId, {
        value: student.ClassId,
        label: student.ClassName,
        key: 'class' + student.ClassId,
        children: [],
      });
    }

    classMap.get(student.ClassId).children.push({
      value: student.Id,
      label: student.TrueName,
      key: 'student' + student.Id,
    });
  });

  return [...classMap.values()];
}




function StudentCascader(props) {
  const { onChange, value, dispatch, loading, studentList, ...cascaderProps } = props;
  // 使用useMemo防止每次render都重新计算
  const studentOptions = useMemo(() => {
    // const schoolStudentList = initSchoolStudentOption(studentList)
    const studentOptions = initStudentOptions(studentList);
    if (!studentOptions && !loading.effects["organizationInfo/queryStudentList"]) {
      dispatch({ type: "organizationInfo/queryStudentList" })
      return undefined
    }
    return studentOptions;
  }, [studentList])

  const cascaderValue = useMemo(() => {
    if (!studentList || !Array.isArray(studentList) || studentList.length < 1) {
      return undefined;
    }
    return value?.map(Id => {
      const student = studentList.find(s => s.Id === Id);
      if (student && student.StudentType === 0) {
        return [student.ClassId, student.Id];
      }
      return undefined;
    }).filter(Boolean);
  }, [value, studentList]);

  const handleOnChange = (values) => {
    const studentIds = [];

    values.forEach(path => {
      if (path.length === 2) {
        studentIds.push(path[1]);
      } else if (path.length === 1) {
        const targetClass = studentOptions?.find(cls => cls.value === path[0]);
        if (targetClass?.children?.length) {
          targetClass.children.forEach(student => {
            studentIds.push(student.value);
          });
        }
      }
    });
    console.log("studentIds", studentIds);

    onChange(studentIds);
  };


  return (
    <Cascader
      showSearch
      multiple
      onChange={handleOnChange}
      value={cascaderValue}
      options={studentOptions}
      allowClear={false}
      {...cascaderProps}
    />
  );

}

export default connect(({ dispatch, loading, organizationInfo }) =>
  ({ dispatch, loading, studentList: organizationInfo.studentList || [] }))(StudentCascader)
