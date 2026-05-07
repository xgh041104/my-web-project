import React, { Component } from 'react'
import { Table, Modal, Button, Input, Form, Space, Select } from 'antd'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { history } from 'umi'
import { ProTable } from '@ant-design/pro-components'
import tableFilter from 'utils/tableFilter'
import { PlusOutlined } from '@ant-design/icons'

@connect(({ organizationInfo, user }) => ({
  adminSchoolId: user.adminSchoolId,
  majorList: organizationInfo.majorList,
  collegeList: organizationInfo.collegeList,
}))
export default class MajorList extends Component {
  static propTypes = {
    majorList: PropTypes.array,
    collegeList: PropTypes.array,
  }

  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      RMModalOpen: false,
      crtMajorInfo: null,
    }
    this.modalForm = React.createRef(null);
    this.removeMajor = this.removeMajor.bind(this);
    this.RMModalClose = this.RMModalClose.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.showModal = this.showModal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.tableRef = React.createRef();
  }

  removeMajor() {
    this.props.dispatch({ type: "organizationInfo/removeMajor", payload: this.state.crtMajorInfo.MajorId })
    this.setState({ RMModalOpen: false, crtMajorInfo: null })
  }

  openRMModal(majorInfo) {
    this.setState({ crtMajorInfo: majorInfo, RMModalOpen: true });
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
    if (!this.state.crtMajorInfo) {
      this.props.dispatch({
        type: "organizationInfo/createMajor", payload: {
          ...values
        }
      })

    }
    else {
      this.props.dispatch({
        type: "organizationInfo/modifyMajor", payload: {
          MajorId: this.state.crtMajorInfo.MajorId,
          ...values
        }
      })
    }

    this.setState({ isModalOpen: false, crtMajorInfo: null })
  };

  showModal() {
    // setIsModalOpen(true);
    this.setState({ isModalOpen: true });
  };
  showModifyModal(fileds) {
    this.setState({ isModalOpen: true, crtMajorInfo: fileds }, () => {
      this.modalForm.current?.setFieldsValue({
        ...fileds,
      });
    });
  }
  handleCancel() {
    // setIsModalOpen(false);
    this.setState({ isModalOpen: false });
  };

  componentDidUpdate(preProps) {
    if (this.props.majorList !== preProps.majorList) {
      this.tableRef.current?.reload();
    }

    if (preProps && preProps.adminSchoolId !== this.props.adminSchoolId) {
      this.props.dispatch({ type: "organizationInfo/queryMajorList" })
    }
  }

  columns = [
    {
      title: '编号',
      dataIndex: 'MajorId',
      align: 'center',
      sorter: (a, b) => a.MajorId - b.MajorId,
      search: false,
    },
    {
      title: '专业名称',
      align: 'center',
      dataIndex: 'MajorName'
    },
    {
      title: '学院名称',
      align: 'center',
      dataIndex: "CollegeName",
    },
    {
      title: '操作',
      align: 'center',
      width: '2.5rem',
      key: "operator",
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
    // console.log('majorList: ', this.props.majorList);
    // console.log('collegeList: ', this.props.collegeList);
    return <>
      <Modal
        title="删除专业"
        open={this.state.RMModalOpen}
        onOk={this.removeMajor}
        onCancel={this.RMModalClose}
      >
        <p>
          确定删除
          <span style={{ fontWeight: 'bold', color: 'rgb(64,169,255)' }}>
            {this.state.crtMajorInfo ? this.state.crtMajorInfo.MajorName : "此专业"}
          </span>?<br />专业关联的所有数据都会被删除
        </p>
      </Modal>
      <Modal title={this.state.crtMajorInfo ? "修改专业" : "新建专业"}
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
          onFinish={this.handleOk}
          style={{ maxWidth: "80%" }}
        >
          <Form.Item label="当前学院" name="CollegeId" rules={[{ required: true }]} hasFeedback>
            <Select
              disabled={this.state.crtMajorInfo}
              style={{ minWidth: '2rem' }}
              showSearch
              optionFilterProp="children"
              options={this.props.collegeList?.map(item => ({ label: item.CollegeName, value: item.Id, key: item.Id }))}
            />
          </Form.Item>
          <Form.Item label="专业名称" name="MajorName" rules={[{ required: true }]} hasFeedback>
            <Input></Input>
          </Form.Item>
        </Form>
      </Modal>
      {!this.props.majorList ?
        <p>未查询到专业信息</p> :
        <ProTable
          actionRef={this.tableRef}
          request={(params, sort, filter) => Promise.resolve({
            data: tableFilter(this.props.majorList, params),
            success: true
          })}
          toolBarRender={() => [
            <Button type="primary" icon={<PlusOutlined />} onClick={this.showModal}>
              新建
            </Button>
          ]}
          columns={this.columns} rowKey={item => item.MajorId} />
      }
    </>
  }
}

