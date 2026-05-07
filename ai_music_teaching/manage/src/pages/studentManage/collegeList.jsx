import React, { Component } from 'react'
import { Table, Modal, Button, Input, Form, Space, Select } from 'antd'
import { ProTable } from "@ant-design/pro-components"
import { PlusOutlined } from '@ant-design/icons'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import tableFilter from 'utils/tableFilter'

@connect(({ organizationInfo, user, schoolInfo, dispatch }) => ({
  collegeList: organizationInfo.collegeList,
  userType: user.userInfo.userType,
  adminSchoolId: user.adminSchoolId,
  dispatch
}))
export default class CollegeList extends Component {
  static propTypes = {
    collegeList: PropTypes.array
  }

  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      RMModalOpen: false,
      crtCollegeInfo: null
    }
    this.modalForm = React.createRef(null);
    this.removeCollege = this.removeCollege.bind(this);
    this.RMModalClose = this.RMModalClose.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.showModal = this.showModal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.tableRef = React.createRef();
  }

  removeCollege() {
    this.props.dispatch({ type: "organizationInfo/removeCollege", payload: this.state.crtCollegeInfo.Id })
    this.setState({ RMModalOpen: false, crtCollegeInfo: null })
  }

  openRMModal(collegeInfo) {
    this.setState({ crtCollegeInfo: collegeInfo, RMModalOpen: true });
  }

  RMModalClose() {
    this.setState({ RMModalOpen: false });
  }

  // handleOk = () => {
  // 上述写法会给每个类的实例增加一个handleOk函数:
  //    console.log(class1.handleOk === class2.handleOk) // false
  // 下面写法给类原型增加一个函数
  handleOk() {
    // console.log('handle ok');
    const values = this.modalForm.current.getFieldsValue();
    if (!this.state.crtCollegeInfo) {
      this.props.dispatch({
        type: "organizationInfo/createCollege", payload: {
          "CollegeName": values.collegeName
        }
      })

    }
    else {
      this.props.dispatch({
        type: "organizationInfo/modifyCollege", payload: {
          "Id": this.state.crtCollegeInfo.Id,
          "CollegeName": values.collegeName,
        }
      })
    }

    this.setState({ isModalOpen: false, crtCollegeInfo: null })
  };

  showModal() {
    // setIsModalOpen(true);
    this.setState({ isModalOpen: true });
  };
  showModifyModal(fileds) {

    this.setState({ isModalOpen: true, crtCollegeInfo: fileds }, () => {
      this.modalForm.current?.setFieldsValue({
        collegeName: fileds.CollegeName,
      });
    });
  }
  handleCancel() {
    // setIsModalOpen(false);
    this.setState({ isModalOpen: false });
  };

  componentDidUpdate(preProps) {
    if (preProps && preProps.adminSchoolId !== this.props.adminSchoolId) {
      this.props.dispatch({ type: "organizationInfo/queryCollegeList" })
    }
    this.tableRef.current?.reload();
  }

  columns = [
    {
      title: '编号',
      dataIndex: 'Id',
      sorter: (a, b) => a.Id - b.Id,
      align: 'center',
      search: false,
    },
    {
      title: '学院名称',
      dataIndex: 'CollegeName',
      align: 'center',
    },
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
    return <>
      <Modal
        title="删除学院"
        open={this.state.RMModalOpen}
        onOk={this.removeCollege}
        onCancel={this.RMModalClose}
      >
        <p>
          确定删除
          <span style={{ fontWeight: 'bold', color: 'rgb(64,169,255)' }}>
            {this.state.crtCollegeInfo ? this.state.crtCollegeInfo.CollegeName : "此学院"}
          </span>?<br />学院关联的所有数据都会被删除
        </p>
      </Modal>
      <Modal title="新建学院"
        open={this.state.isModalOpen}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" onClick={this.handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={this.handleOk}>
            提交
          </Button>,
        ]}
      >
        <Form
          ref={this.modalForm}
          // onFinish={this.handleOk}
          style={{ maxWidth: "80%" }}
        >
          <Form.Item label="学院名称" name="collegeName" rules={[{ required: true }]} hasFeedback>
            <Input></Input>
          </Form.Item>
        </Form>
      </Modal>
      <ProTable
        actionRef={this.tableRef}
        request={(params, sort, filter) => Promise.resolve({
          data: tableFilter(this.props.collegeList, params),
          success: true
        })}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={this.showModal}>
            新建
          </Button>
        ]}
        // dataSource={this.props.collegeList}
        columns={this.columns} rowKey={item => item.Id} />

    </>
  }
}

