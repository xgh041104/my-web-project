import React, { useRef, useEffect, useState } from 'react'
import { ProTable } from '@ant-design/pro-components'
import { Button, Modal, Radio } from 'antd'
import { connect } from 'umi'
import createFilter from 'utils/tableFilter'

function TestPaperSelect({ value, onChange, testPaperList, dispatch }) {
  const tableRef = useRef();

  const [selectedId, setSelectedId] = useState(value || null);

  useEffect(() => {
    if (!value
      || typeof (value) !== "number"
      || value === selectedId) {
      return;
    }
    setSelectedId(value);
  }, [value])

  useEffect(() => {
    if (!testPaperList || testPaperList.length < 1) {
      dispatch({ type: "testPaper/QueryTestPaperList" })
    }
    tableRef.current?.reload();
  }, [testPaperList])

  const handleChecked = (testPaperId, checked) => {
    if (checked) {
      setSelectedId(testPaperId);
      onChange(testPaperId);
    }
  }

  const targetTestPaper = testPaperList?.find(paper => paper.Id === selectedId) || null;

  return <>
    <p>当前已选择试卷:
      <span style={{ fontSize: ".16rem", fontWeight: 600, marginLeft: ".1rem" }}>{targetTestPaper ? targetTestPaper.TestPaperName : ""}</span>
    </p>
    <ProTable
      actionRef={tableRef}
      headerTitle="试卷列表"
      rowKey={record => "testPaper" + record.Id}
      cardBordered
      pagination={{
        defaultPageSize: 10,
        showQuickJumper: true,
      }}
      columns={[
        {
          title: '试卷ID',
          dataIndex: 'Id',
          sorter: (a, b) => a.Id - b.Id,
          search: false,
          align: 'center',
        },
        {
          title: '试卷名称',
          dataIndex: 'TestPaperName',
          align: 'center',
        },
        {
          title: '试卷时长',
          dataIndex: 'ExamDuration',
          search: false,
          align: 'center',
        },
        {
          title: '试卷总分',
          dataIndex: 'FullMarks',
          search: false,
          align: 'center',
        },
        {
          title: '及格分数',
          dataIndex: 'PassScore',
          search: false,
          align: 'center',
        },
        {
          key: "operation",
          title: '选择',
          align: 'center',
          render: (text, record, _, action) => [
            <Radio key='operator_check' checked={record.Id === selectedId} type='link' onChange={(e) => handleChecked(record.Id, e.target.checked)}></Radio>
          ],
          search: false,
        },
      ]}
      request={(params, sort, filter) => {
        return Promise.resolve({
          data: createFilter(testPaperList, params),
          success: true
        })
      }}
    />
  </>
}

export default connect(({ testPaper, dispatch }) => ({
  testPaperList: testPaper.testPaperList,
  dispatch
}))(TestPaperSelect)