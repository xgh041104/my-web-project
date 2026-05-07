import { Select } from 'antd'
import React, { useMemo, useState, useEffect } from 'react'
import { connect } from 'umi'
import './SchoolSelect.css'

function SchoolSelect({ dispatch, schoolList, defaultSchoolId }) {


    const schoolSelected = (value) => {
        dispatch({ type: "user/adminChangeSchool", payload: value });
    }

    useEffect(() => {
        dispatch({
            type: "schoolInfo/querySchoolList"
        })
    }, [])

    const SchoolOptions = schoolList.map(s => ({
        key: s.Id,
        label: s.SchoolName,
        value: s.Id
    }));

    return defaultSchoolId ? <Select
        className='admin-school-select'
        style={{ minWidth: "1.5rem", color: 'white' }}
        bordered={false}
        defaultValue={defaultSchoolId}
        options={SchoolOptions}
        onSelect={schoolSelected} /> : <></>
}

export default connect(({ dispatch, schoolInfo, user }) => ({ dispatch, schoolList: schoolInfo.schoolList, defaultSchoolId: user.adminSchoolId }))(SchoolSelect) 