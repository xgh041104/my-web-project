import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { Typography, Switch, Button, Popconfirm, Table, Tooltip, Modal, Upload, message } from 'antd'
import { ProTable } from '@ant-design/pro-components'
import React, { useRef, useEffect, useState } from 'react'
import { connect, history } from 'umi'
import usePageState from '@/hooks/usePageState';

const { Text } = Typography

const AddModal = () =>
  <Button icon={<PlusOutlined />} type='primary'
    onClick={() => history.push('/examManage/examEditor')} >新建</Button>

export const ImportExamModal = (dispatch, queryApi, uploadApi) => {
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const callback = res => {
    if (res.code == 1) {
      // message.success('学生信息原始数据解析成功');
      console.log('获取原始表格数据', res);
      // 重新请求考试列表数据
      // dispatch({ type: "examManage/queryExamList" });
      dispatch({ type: queryApi });
      setModalOpen(false);
      setUploadFile(null);
      message.success("成功导入考生信息！");
    }
    else if (res.code == 0) {
      // message.error('学生信息原始数据解析失败');
      setErrorMessage("学生信息原始数据解析失败：" + res.msg)

    }
    setUploading(false);
  }

  const handleUpload = () => {
    setUploading(true);
    dispatch({
      // type: "examManage/importExamStudents",
      type: uploadApi,
      payload: {
        fileData: [uploadFile],
      },
      callback
    })
  };
  const uploadProps = {
    onRemove: () => {
      setUploadFile(null);
      setErrorMessage(null);
    },
    beforeUpload: (file) => {
      setUploadFile(file);
      setErrorMessage(null);
      return false;
    },
    maxCount: 1,
    accept: ".xls, .xlsx, .csv, .xml"
  };

  return <div>
    <Modal title="批量导入考生" open={modalOpen}
      onCancel={() => setModalOpen(false)}
      footer={[]}
    >
      <Upload {...uploadProps} >
        <Button icon={<UploadOutlined />}>选择学生数据表格</Button>
      </Upload>
      <br />
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={!uploadFile}
        loading={uploading}
      >
        {uploading ? '上传中' : '开始上传'}
      </Button>
      <br />
      <span style={{ color: 'red' }}>{errorMessage}</span>
    </Modal>
    <Button type='primary' onClick={() => setModalOpen(true)}>批量导入考生</Button>
  </div>

}


function ExamList({ dispatch, examList, adminSchoolId }) {

  const examTableRef = useRef()
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [crtExam, setCrtExam] = useState(null);
  const pageState = usePageState("examManage");

  const removeExamSession = (Id, ExamId) => {
    dispatch({
      type: "examManage/removeExamSession", payload: { Id, ExamId }
    })
  }

  const openRemoveModal = (exam) => {
    setCrtExam(exam);
    setRemoveModalOpen(true);
  }

  const handleCopyRequest = () => {
    dispatch({ type: "examManage/copyNewExam", payload: crtExam.Id })
    console.log("handle copy request");
    setRemoveModalOpen(false);
  }
  const handleRemoveRequest = () => {
    dispatch({ type: "examManage/removeExam", payload: crtExam.Id })
    console.log("handle remove request");
    setRemoveModalOpen(false);
  }

  const handleCancel = () => {
    setRemoveModalOpen(false);
  }

  const modifyExam = (Id) => {
    history.push({ pathname: '/examManage/examEditor', state: { ExamId: Id } })
  }

  const tableFilter = (params, sort, filter) => {
    return Promise.resolve({
      data: () => {
        return examList?.filter((item) => {
          let result = true;
          if (params.ExamName) {
            result = (result && item.ExamName.indexOf(params.ExamName) != -1);
          }
          if (params.ExamDescribe) {
            result = (result && item.ExamDescribe.indexOf(params.ExamDescribe) != -1);
          }
          if (params.ExamStudentArr) {
            result = (result && item.ExamStudentArr.some(s => s.TrueName.indexOf(params.ExamStudentArr) != -1));
          }
          if (adminSchoolId && adminSchoolId > 0) {
            result = (result && item.SchoolId === adminSchoolId)
          }
          return result;
        })
      },
      success: true,
    })
  }

  useEffect(() => {
    examTableRef.current?.reload();
  }, [examList])

  useEffect(() => {
    dispatch({ type: "examManage/queryExamList" })
  }, [adminSchoolId])



  const expandedRowRender = function (record, index, indent, expanded) {
    // console.log('update childtable', record);
    return <Table
      dataSource={[...record.ExamSessionArr]}// 避免删除时无法刷新掉已删除的项
      rowKey={'Id'}
      columns={[
        {
          title: '考试场次ID',
          dataIndex: 'Id',
          sorter: (a, b) => a.Id - b.Id,
          align: 'center',

        },
        {
          title: '试卷名称',
          dataIndex: 'TestPaperName',
          align: 'center',
        },
        {
          title: '开考时间',
          dataIndex: 'StartTime',
          align: 'center',
        },
        {
          title: '结束时间',
          dataIndex: 'EndTime',
          align: 'center',
        },
        {
          title: '答题限时',
          dataIndex: 'ExamDuration',
          align: 'center',
        },
        {
          key: "operation",
          title: '操作',
          width: '2.5rem',
          align: 'center',
          render: (text, record) => <>
            <Popconfirm
              key={"operator_del"}
              title="是否确认删除该项？"
              onConfirm={() => removeExamSession(record.Id, record.ExamId)}
              // onCancel={() => { message.error("取消删除") }}
              okText="删除"
              cancelText="取消"
            >
              <Button danger type='link'>删除</Button>
            </Popconfirm>
          </>
          ,
        },
      ]}
      pagination={false}
    />
  }
  const columns = [
    {
      title: '考试ID',
      dataIndex: 'Id',
      sorter: (a, b) => a.Id - b.Id,
      search: false,
      align: 'center',
    },
    {
      title: '考试主题',
      dataIndex: 'ExamName',
      align: 'center',
      render: (dom, rowData) => <Tooltip title={rowData.ExamDescribe}>
        <span>{dom}</span>
      </Tooltip>
    },
    // {
    //     title: '考试说明',
    //     dataIndex: 'ExamDescribe',
    //     render: (dom) => <Text style={{ width: '2rem' }}
    //         ellipsis={{ tooltip: dom }}>
    //         {dom}
    //     </Text>
    // },
    {
      title: '考试人员',
      dataIndex: 'ExamStudentArr',
      width: '2.5rem',
      render: (students) => {
        if (!students || !students.length || !Array.isArray(students)) {
          return <span>-</span>
        }
        const showNames = students.map(s => s.TrueName).join('、');
        return <Text style={{ width: '2rem' }}          ellipsis={{ tooltip: showNames }}>
          {showNames}
        </Text>
      }
    },
    {
      title: '考试状态',
      dataIndex: 'ExamStatus',
      search: false,
      align: 'center',
      render: (value) => (<Switch disabled checkedChildren="开启" unCheckedChildren="关闭" checked={value || 0} />),
    },
    // {
    //   title: '人脸识别验证',
    //   dataIndex: 'FaceVerify',
    //   search: false,
    //   align: 'center',
    //   render: (value) => <Switch disabled checkedChildren="开启" unCheckedChildren="关闭" checked={value || 0} />
    // },
    {
      key: "operation",
      title: '操作',
      width: '2.5rem',
      align: 'center',
      render: (text, record, index, action) => [
        // <Popconfirm
        //     key={"operator_del"}
        //     title="作废后是否复制考试信息？"
        //     onConfirm={() => removeExam(record.Id)}
        //     // onCancel={() => { message.error("取消删除") }}
        //     okText="直接删除"
        //     cancelText="复制"
        // >
        //     <Button danger type='link'>作废</Button>
        // </Popconfirm>,

        <Button key='operator_edit' type='link' onClick={() => modifyExam(record.Id)}>编辑</Button>,
        <Button key="operator_del" danger type='link' onClick={() => openRemoveModal(record)}>废除</Button>,

      ],
      search: false,
    },
  ]
  return <>
    <Modal
      open={removeModalOpen}
      title="作废考试"
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="copy" type="primary" onClick={handleCopyRequest}>
          复制
        </Button>,
        <Button key="del" type='danger' onClick={handleRemoveRequest}>
          删除
        </Button>,
      ]}
    >
      当前<span style={{ color: 'rgb(24,114,255)', fontWeight: 700, fontSize: '18px' }}>{crtExam && crtExam.ExamName || "考试"}</span>作废后是否需要复制此考试信息生成新的考试？
    </Modal>
    <ProTable
      style={{ marginTop: '.3rem' }}
      rowKey={"Id"}
      actionRef={examTableRef}
      cardBordered
      pagination={{
        ...pageState,
        defaultPageSize: 10,
        showQuickJumper: true,
      }}
      expandable={{
        defaultExpandedRowKeys: ["0"],
        expandedRowRender
      }}
      columns={columns}
      toolBarRender={() => [
        ImportExamModal(dispatch, "examManage/queryExamList", "examManage/importExamStudents"),
        AddModal(dispatch),

      ]}
      request={tableFilter}
    />
  </>
}

export default connect(({ dispatch, examManage, user }) => ({
  dispatch,
  examList: examManage.examList,
  adminSchoolId: user.adminSchoolId
}))(ExamList)
