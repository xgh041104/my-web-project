import React, { Component } from 'react'
import { Table, Modal, Button, Input, Form, Space, Select } from 'antd'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { ProTable } from '@ant-design/pro-components'
import { PlusOutlined } from '@ant-design/icons'
import tableFilter from 'utils/tableFilter'

@connect(({ organizationInfo, user }) => ({
  classList: organizationInfo.classList,
  majorList: organizationInfo.majorList,
  collegeList: organizationInfo.collegeList,
  adminSchoolId: user.adminSchoolId
}))
export default class ClassList extends Component {
  static propTypes = {
    classList: PropTypes.array,
    majorList: PropTypes.array
  }

  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      RMModalOpen: false,
      crtCollegeId: null,
      majorList: props.majorList,
      crtClassInfo: null,
    }
    this.modalForm = React.createRef(null);
    this.removeClass = this.removeClass.bind(this);
    this.RMModalClose = this.RMModalClose.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.showModal = this.showModal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.changeCrtCollege = this.changeCrtCollege.bind(this);
    this.tableRef = React.createRef();
  }

  removeClass() {
    this.props.dispatch({ type: "organizationInfo/removeClass", payload: this.state.crtClassInfo.Id })
    this.setState({ RMModalOpen: false, crtClassInfo: null })

  }

  openRMModal(classInfo) {
    this.setState({ crtClassInfo: classInfo, RMModalOpen: true });
  }

  RMModalClose() {
    this.setState({ RMModalOpen: false });
  }

  // handleOk = () => {
  // 上述写法会给每个类的实例增加一个handleOk函数:
  //    console.log(class1.handleOk === class2.handleOk) // false
  // 下面写法给类原型增加一个函数
  handleOk(values) {
    if (!this.state.crtClassInfo) {
      this.props.dispatch({
        type: "organizationInfo/createClass", 
        payload: {
          ...values,
          MajorId: 1,
          CollegeId: 1,
        }

      })

    }
    else {
      this.props.dispatch({
        type: "organizationInfo/modifyClass", payload: {
          Id: this.state.crtClassInfo.Id,
          ClassName: values.ClassName,
          MajorId: 1,
        }
      })
    }

    this.setState({ isModalOpen: false, crtClassInfo: null })
  };

  showModal() {
    // setIsModalOpen(true);
    this.modalForm.current?.resetFields();
    this.setState({ isModalOpen: true, crtClassInfo: null });
  };

  showModifyModal(fileds) {
    this.setState({ isModalOpen: true, crtClassInfo: fileds }, () => {
      this.modalForm.current?.setFieldsValue({
        ClassName: fileds.ClassName,
        CollegeId: 1,
        MajorId: 1,
      });
    });
  }
  handleCancel() {
    // setIsModalOpen(false);
    this.setState({ isModalOpen: false });
  };
  changeCrtCollege(collegeId) {
    this.setState({ crtCollegeId: collegeId });
  }

  componentDidUpdate(preProps) {
    if (this.props.classList !== preProps.classList) {
      this.tableRef.current?.reload();
    }
    if (preProps && preProps.adminSchoolId !== this.props.adminSchoolId) {
      this.props.dispatch({ type: "organizationInfo/queryClassList" })
    }
  }

  columns = [
    {
      title: '编号',
      dataIndex: 'Id',
      sorter: (a, b) => a.Id - b.Id,
      search: false,
      align: 'center',
    },
    {
      title: '班级名称',
      dataIndex: 'ClassName',
      align: 'center',
    },
    // {
    //   title: '专业名称',
    //   align: 'center',
    //   dataIndex: 'MajorName'
    // },
    // {
    //   title: '学院名称',
    //   align: 'center',
    //   dataIndex: 'CollegeName'
    // },
    {
      title: '操作',
      key: "operator",
      width: '2.5rem',
      align: 'center',
      search: false,
      render: (_, rowData) => (<>
        <Button type='link' onClick={this.showModifyModal.bind(this, rowData)}>
          编辑
        </Button>
        <Button type='link' danger onClick={this.openRMModal.bind(this, rowData)}>
          删除
        </Button>
      </>
      )
    }
  ]

  render() {
    // console.log('classList: ', this.props.classList);
    // console.log('majorList: ', this.props.majorList);
    let majorList = this.props.majorList
    if (this.state.crtCollegeId && !this.state.crtClassInfo) {
      majorList = this.props.majorList.filter(major => major.CollegeId == this.state.crtCollegeId)
    }
    return <>
      <Modal
        title="删除班级"
        open={this.state.RMModalOpen}
        onOk={this.removeClass}
        onCancel={this.RMModalClose}
      >
        <p>
          确定删除
          <span style={{ fontWeight: 'bold', color: 'rgb(64,169,255)' }}>
            {this.state.crtClassInfo ? this.state.crtClassInfo.ClassName : "此班级"}
          </span>?<br />班级关联的所有数据都会被删除
        </p>
      </Modal>
      <Modal title={this.state.crtClassInfo ? "修改班级" : "新建班级"}
        open={this.state.isModalOpen}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" onClick={this.handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={this.modalForm.current?.submit}>
            提交
          </Button>,
        ]}
      >
        <Form
          ref={this.modalForm}
          onFinish={this.handleOk}
          style={{ maxWidth: "80%" }}
        >
          {/* <Form.Item label="当前学院" name="CollegeId" rules={[{ required: true }]} hasFeedback>
            <Select
              disabled={this.state.crtClassInfo}
              style={{ minWidth: '2rem' }}
              showSearch
              optionFilterProp="children"
              options={this.props.collegeList?.map(item => ({ label: item.CollegeName, value: item.Id, key: item.Id }))}
              onChange={this.changeCrtCollege}
            />
          </Form.Item>
          <Form.Item label="当前专业" name="MajorId" rules={[{ required: true }]} hasFeedback>
            <Select
              disabled={this.state.crtClassInfo}
              style={{ minWidth: '2rem' }}
              showSearch
              optionFilterProp="children"
              options={majorList.map(major => ({ value: major.MajorId, label: major.MajorName, key: major.MajorId }))}
            />
          </Form.Item> */}
          <Form.Item label="班级名称" name="ClassName" rules={[{ required: true }]} hasFeedback>
            <Input></Input>
          </Form.Item>
        </Form>
      </Modal>
      <ProTable
        //  dataSource={this.props.classList}
        actionRef={this.tableRef}
        request={(params, sort, filter) => Promise.resolve({
          data: tableFilter(this.props.classList, params),
          success: true
        })}
        toolBarRender={() => [
          <Button type="primary" key={"add"} onClick={this.showModal}>
            新建班级
          </Button>
        ]}
        columns={this.columns} rowKey={item => item.Id} />
    </>
  }
}

