import React, { Component } from 'react'
import { Radio, Modal, Button, Input, Form, Select, message, Row, Col, DatePicker, Popconfirm } from 'antd'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons'
import moment from "moment";

@connect(({ organizationInfo, user }) => ({
  studentList: organizationInfo.studentList,
  classList: organizationInfo.classList,
  majorList: organizationInfo.majorList,
  collegeList: organizationInfo.collegeList,
  adminSchoolId: user.adminSchoolId
}))
export default class StudentList extends Component {
  static propTypes = {
    // classList: PropTypes.array,
    studentList: PropTypes.array,
    crtMajorId: PropTypes.number,
  }

  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      RMModalOpen: false,
      resetModalOpen: false,
      crtStudentInfo: null,
      majorList: [],
      classList: [],
      isModified: false
    }
    this.modalForm = React.createRef();
    this.tableRef = React.createRef();
    this.removeStudent = this.removeStudent.bind(this);
    this.RMModalClose = this.RMModalClose.bind(this);
    this.resetStudentPassword = this.resetStudentPassword.bind(this);
    this.resetModalClose = this.resetModalClose.bind(this);
    // this.handleOk = this.handleOk.bind(this);
    this.showCreateModal = this.showCreateModal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.setState({ majorList: this.props.majorList?.filter(item => item.CollegeId === 1) })
    this.setState({ classList: this.props.classList?.filter(item => item.MajorId === 1) })
  }

  removeStudent() {
    this.props.dispatch({ type: "organizationInfo/removeStudent", payload: this.state.crtStudentInfo.Id })
    this.RMModalClose();
  }
  openRMModal(studentInfo) {
    this.setState({ crtStudentInfo: studentInfo, RMModalOpen: true });
  }
  RMModalClose() {
    this.setState({ crtStudentInfo: null, RMModalOpen: false })
  }

  resetStudentPassword() {
    this.props.dispatch({ type: "organizationInfo/resetStudentPassword", payload: this.state.crtStudentInfo.Id })
    this.resetModalClose();
  }
  openResetModal(studentInfo) {
    this.setState({ crtStudentInfo: studentInfo, resetModalOpen: true });
  }
  resetModalClose() {
    this.setState({ crtStudentInfo: null, resetModalOpen: false })
  }

  // handleOk = () => {
  // 上述写法会给每个类的实例增加一个handleOk函数:
  //    console.log(class1.handleOk === class2.handleOk) // false
  // 下面写法给类原型增加一个函数
  handleOk = (values) => {
    // console.log('handle ok');
    // const values = this.modalForm.current.getFieldsValue();
    const Birthday = values.Birthday != "" && moment(values.Birthday).isValid() && moment(values.Birthday).format("YYYYMMDD") || ""

    if (!this.state.crtStudentInfo) {
      this.props.dispatch({
        type: "organizationInfo/createStudent", payload: {
          ...values,
          Birthday,
          // 当前时间戳
          IDNumber: Date.now(),
          SchoolId: 4,
          MajorId: 1,
          CollegeId: 1,
          FaceOpen: 0,
        }
      })
    }
    else {
      this.props.dispatch({
        type: "organizationInfo/modifyStudent", payload: {
          "Id": this.state.crtStudentInfo.Id,
          ...values,
          Birthday
        }
      })
    }

    this.setState({ isModalOpen: false, crtStudentInfo: null })
  }

  showCreateModal() {
    // setIsModalOpen(true);
    this.modalForm.current?.resetFields();
    this.setState({ isModalOpen: true, isModified: true, crtStudentInfo: null });
  }
  showModifyModal(fileds, isModified) {
    console.log("fileds obj:", fileds);
    const birthdayValue = (moment(fileds.Birthday, "YYYY/MM/DD").isValid() ? moment(fileds.Birthday, "YYYY/MM/DD") : undefined)
    this.setState({ majorList: this.props.majorList, classList: this.props.classList, isModalOpen: true, crtStudentInfo: fileds, isModified }, () => {
      this.modalForm.current?.setFieldsValue({
        ...fileds,
        Birthday: birthdayValue
      })
    });
  }
  handleCancel() {
    this.setState({ isModalOpen: false });
  };

  componentDidUpdate() {

    this.tableRef.current?.reload();
  }

  batchRemove(selectedStudents, cancel) {
    this.props.dispatch({
      type: "organizationInfo/batchRemoveStudent",
      payload: selectedStudents.map(item => item.Id).join(","),
      callback: (result) => {
        if (result.code == 1) {
          message.success("批量删除学生成功", 3);
          cancel();
          return;
        }
        message.error({
          content: <div>
            <h3>批量删除学生失败</h3>
            <p>{result.msg}</p>
            <p style={{ textAlign: "left" }}>操作失败名单:<br />{result.data.map(v => v.TrueName).join(", ")}</p>
          </div>
        })

      }
    })
  }

  columns = [
    {
      title: '编号',
      dataIndex: 'Id',
      sorter: (a, b) => a.Id - b.Id,
      search: false,
      align: 'center',
    },
    { title: "姓名", dataIndex: "TrueName", key: "searchTrueName", align: 'center', },
    { title: "账号", dataIndex: "StudentAccount" },
    // { title: "证件号", dataIndex: "IDNumber", key: "searchIDNumber", align: 'center', },
    { title: "学号", dataIndex: "ExamNumber", key: "searchExamNumber", align: 'center', },
    // { title: "学校名称", dataIndex: "SchoolName", search: false, filters: true, onFilter: true, align: 'center', },
    // { title: "学院名称", dataIndex: "CollegeName", search: false, filters: true, onFilter: true, align: 'center', },
    // { title: "专业名称", dataIndex: "MajorName", search: false, filters: true, onFilter: true, align: 'center', },
    { title: "班级名称", dataIndex: "ClassName", search: false, filters: true, onFilter: true, align: 'center', },
    {
      title: '操作',
      key: "operator",
      width: '2.5rem',
      align: 'center',
      search: false,
      render: (_, rowData) => (<>
        <Button type='link' onClick={this.showModifyModal.bind(this, rowData, false)}>
          详细信息
        </Button>
        <Button type='link' onClick={this.showModifyModal.bind(this, rowData, true)}>
          编辑
        </Button>
        <Button type='link' onClick={this.openResetModal.bind(this, rowData, true)}>
          重置密码
        </Button>
        <Button type='link' danger onClick={this.openRMModal.bind(this, rowData)}>
          删除
        </Button>
      </>
      )
    }
  ]

  render() {
    const message = "请输入有效的${label}" // 还可以显示type变量
    let schoolEnum = {};
    let collegeEnum = {};
    let majorEnum = {};
    let classEnum = {};
    let standEnum = {};
    this.props.studentList?.forEach((item) => {
      if (!schoolEnum[item.SchoolName]) {
        schoolEnum[item.SchoolName] = item.SchoolName;
      }
      if (!collegeEnum[item.CollegeName]) {
        collegeEnum[item.CollegeName] = item.CollegeName;
      }
      if (!majorEnum[item.MajorName]) {
        majorEnum[item.MajorName] = item.MajorName;
      }
      if (!majorEnum[item.ClassName]) {
        majorEnum[item.ClassName] = item.ClassName;
      }
      if (!standEnum[item.StandName]) {
        standEnum[item.StandName] = item.StandName;
      }
    });



    // this.columns[5].valueEnum = schoolEnum;
    // this.columns[6].valueEnum = collegeEnum;
    // this.columns[7].valueEnum = majorEnum;
    // this.columns[8].valueEnum = classEnum;
    // this.columns[9].valueEnum = standEnum;

    const isCreateMode = this.state.isModified && !this.state.crtStudentInfo;
    const formItemProps = {
      rules: [{ required: this.state.isModified }],
      hasFeedback: this.state.isModified
    }
    const highlightText = { fontWeight: 'bold', color: 'rgb(64,169,255)' }
    return <>
      <Modal
        title="删除学生"
        open={this.state.RMModalOpen}
        onOk={this.removeStudent}
        onCancel={this.RMModalClose}
      >
        <p>
          确定删除
          <span style={{ fontWeight: 'bold', color: 'rgb(64,169,255)' }}>
            {this.state.crtStudentInfo ? this.state.crtStudentInfo.TrueName : "此学生"}
          </span>?
        </p>
      </Modal>
      <Modal
        title="重置学生密码"
        open={this.state.resetModalOpen}
        onOk={this.resetStudentPassword}
        onCancel={this.resetModalClose}
      >
        <p>
          确定重置
          <span style={highlightText}>
            {this.state.crtStudentInfo ? this.state.crtStudentInfo.TrueName : "此学生"}
          </span>密码为<span style={highlightText}>123456</span>?
        </p>
      </Modal>
      <Modal title={isCreateMode ? "新建学生" : (this.state.isModified ? "修改学生信息" : "查看学生信息")}
        style={{ minWidth: "35vw" }}
        open={this.state.isModalOpen}
        onCancel={this.handleCancel}
        maskClosable={false}
        footer={(this.state.isModified || !this.state.crtStudentInfo) && [
          <Button key="back" onClick={this.handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => this.modalForm.current?.submit()}>
            提交
          </Button>,
        ]}
      >
        <Form
          ref={this.modalForm}
          onFinish={this.handleOk}
          labelCol={{ span: 8, }}
          wrapperCol={{ span: 16, }}
          disabled={!this.state.isModified}
          style={{ maxWidth: "80%", left: 0, right: 0, margin: "auto" }}
        // onValuesChange={values => { console.log("form value change:", values) }}
        >
          {/* <Form.Item label="头像" name="IDImage" rules={[{ required: true }]} hasFeedback>
                                <Input />
                            </Form.Item> */}
          <Form.Item label="学生名称" name="TrueName" {...formItemProps}>
            <Input bordered={this.state.isModified} />
          </Form.Item>
          {(!this.state.isModified || !this.state.crtStudentInfo) && <Form.Item label="账号" name="StudentAccount"  {...formItemProps} rules={[{ required: this.state.isModified, type: "string" }]} >
            <Input bordered={this.state.isModified} />
          </Form.Item>}
          {isCreateMode && <Form.Item label="密码" name="StudentPwd" {...formItemProps}>
            <Input.Password bordered={this.state.isModified} />
          </Form.Item>}
          <Form.Item label="班级名称" name="ClassId" {...formItemProps}>
            <Select
              options={this.props.classList?.map(item => ({ label: item.ClassName, value: item.Id, key: item.Id }))}
              bordered={this.state.isModified}
            />
          </Form.Item>
          <Form.Item label="学号" name="ExamNumber" hasFeedback={this.state.isModified}
            rules={[{ required: this.state.isModified }, { pattern: /\d+/, message }]} >
            <Input bordered={this.state.isModified} />
          </Form.Item>
          <Form.Item label="出生日期" name="Birthday" >
            <DatePicker format={'YYYY/MM/DD'} bordered={this.state.isModified} style={{
              width: '100%'
            }} />
          </Form.Item>
          <Form.Item label="家长电话" name="Phone" rules={[
            // pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
            { pattern: /\d{11}/, message }
          ]}>
            <Input bordered={this.state.isModified} />
          </Form.Item>
          <Form.Item label="出生籍贯" name="NativePlace">
            <Input bordered={this.state.isModified} />
          </Form.Item>
          <Form.Item label="电子邮箱" name="Email" rules={[{ type: "email", message }]} >
            <Input bordered={this.state.isModified} />
          </Form.Item>
        </Form>
      </Modal>
      <p />
      <ProTable actionRef={this.tableRef} defaultData={this.props.studentList} columns={this.columns} rowKey={item => item.Id}
        toolBarRender={() => [<Button type="primary" key={"add"} icon={<PlusOutlined />} onClick={this.showCreateModal}>新建</Button>]}
        rowSelection={{
          selections: [ProTable.SELECTION_ALL, ProTable.SELECTION_INVERT],
        }}
        tableAlertRender={({
          selectedRowKeys,
          selectedRows,
          onCleanSelected,
        }) => {
          return (
            <div style={{ display: 'flex', gridGap: '10px', alignItems: 'center' }}>
              <span>
                已选 {selectedRowKeys.length} 项
              </span>
              <Popconfirm title="确定删除所选项吗?" onConfirm={this.batchRemove.bind(this, selectedRows, onCleanSelected)}>
                <Button type='link' danger >批量删除</Button>
              </Popconfirm>
            </div>
          );
        }}
        request={(params, sort, filter) => {
          return Promise.resolve({
            data: () => {
              return this.props.studentList?.filter((item) => {
                let result = true;
                Object.entries(params).forEach(([key, value]) => {
                  if (key == "current" || key == "pageSize") {
                    return;
                  }
                  const dataKey = key.replace("search", "")
                  if (item.hasOwnProperty(dataKey)) {
                    result = (result && item[dataKey].indexOf(value) != -1)
                  }

                })
                if (this.props.adminSchoolId && this.props.adminSchoolId > 0) {
                  result = (result && item.SchoolId === this.props.adminSchoolId)
                }
                // console.log(`get ${JSON.stringify(params)} true name :`, item.TrueName, result);
                return result;
              });
            },
            success: true,
          });
        }}
      />

    </>
  }
}

