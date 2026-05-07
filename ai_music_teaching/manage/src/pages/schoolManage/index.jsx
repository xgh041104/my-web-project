import React, { Component } from 'react'
import { Table, Modal, Button, Input, Form } from 'antd'
import { ProTable } from "@ant-design/pro-components";
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { history } from 'umi'

@connect(({ schoolInfo }) => ({
  schoolList: schoolInfo.schoolList
}))
export default class SchoolList extends Component {
  static propTypes = {
    schoolList: PropTypes.array
  }

  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      RMModalOpen: false,
      crtSchoolInfo: null
    }
    this.modalForm = React.createRef(null);
    this.removeSchool = this.removeSchool.bind(this);
    this.RMModalClose = this.RMModalClose.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.showModal = this.showModal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    // console.log("schoolInfo", this.props.schoolList);
  }

  removeSchool() {
    this.props.dispatch({ type: "schoolInfo/removeSchool", payload: this.state.crtSchoolInfo.Id })
    this.setState({ RMModalOpen: false, crtSchoolInfo: null })

  }

  openRMModal(schoolInfo) {
    this.setState({ crtSchoolInfo: schoolInfo, RMModalOpen: true });
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
    if (!this.state.crtSchoolInfo) {
      this.props.dispatch({
        type: "schoolInfo/createSchool", payload: {
          "SchoolName": values.schoolName, "SchoolAddress": values.schoolAddress
        }
      })

    }
    else {
      this.props.dispatch({
        type: "schoolInfo/modifySchool", payload: {
          "Id": this.state.crtSchoolInfo.Id,
          "SchoolName": values.schoolName,
          "SchoolAddress": values.schoolAddress
        }
      })
    }

    this.setState({ isModalOpen: false, crtSchoolInfo: null })
  };

  showModal() {
    // setIsModalOpen(true);
    this.setState({ isModalOpen: true });
  }

  showModifyModal(fileds) {
    this.setState({ isModalOpen: true, crtSchoolInfo: fileds }, () => {
      this.modalForm.current?.setFieldsValue({
        schoolName: fileds.SchoolName,
        schoolAddress: fileds.SchoolAddress,
      });
    });
  }

  handleCancel() {
    // setIsModalOpen(false);
    this.setState({ isModalOpen: false });
  };

  columns = [
    {
      title: '编号',
      dataIndex: 'Id',
      search: false,
      align: 'center',
    },
    {
      title: '学校名称',
      dataIndex: 'SchoolName',
      align: 'center',
    },
    {
      title: '学校地址',
      dataIndex: 'SchoolAddress',
      align: 'center',
    },
    {
      title: '操作',
      key: "operator",
      align: 'center',
      render: (_, rowData) => (<>
        <Button type='link' onClick={() => this.showModifyModal(rowData)}>
          编辑
        </Button>
        <Button type='link' danger onClick={() => this.openRMModal(rowData)}>
          删除
        </Button>
      </>
      )
    }
  ]

  render() {
    return <>
      <Modal
        title="删除学校"
        open={this.state.RMModalOpen}
        onOk={this.removeSchool}
        onCancel={this.RMModalClose}
      >
        <p>
          确定删除
          <span style={{ fontWeight: 'bold', color: 'rgb(64,169,255)' }}>
            {this.state.crtSchoolInfo ? this.state.crtSchoolInfo.SchoolName : "此学校"}
          </span>?<br />学校关联的所有数据都会被删除
        </p>
      </Modal>
      <Modal title={(this.state.crtSchoolInfo ? "编辑" : "新建") + "学校"}
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
          <Form.Item label="学校名称" name="schoolName" rules={[{ required: true }]} hasFeedback>
            <Input></Input>
          </Form.Item>
          <Form.Item label="学校地址" name="schoolAddress" hasFeedback>
            <Input></Input>
          </Form.Item>
        </Form>
      </Modal>
      {
        !this.props.schoolList ?
          <p>未查询到学校信息</p> :
          <ProTable dataSource={this.props.schoolList} columns={this.columns} rowKey={item => item.Id}
            toolBarRender={() => [
              <Button type="primary" onClick={this.showModal}>
                新建学校
              </Button >
            ]} />
      }
    </>
  }
}
