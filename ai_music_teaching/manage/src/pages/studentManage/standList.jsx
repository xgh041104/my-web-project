import React, { Component } from 'react'
import { Modal, Button, Input, Form, Space, DatePicker } from 'antd'
import { ProTable } from "@ant-design/pro-components"
import PropTypes from 'prop-types'
import { connect } from 'dva'
import tableFilter from 'utils/tableFilter'
import moment from 'moment'

@connect(({ organizationInfo, user, dispatch }) => ({
  standList: organizationInfo.standList,
  userType: user.userInfo.userType,
  adminSchoolId: user.adminSchoolId,
  dispatch
}))
export default class StandList extends Component {
  static propTypes = {
    standList: PropTypes.array
  }

  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      RMModalOpen: false,
      crtStandInfo: null
    }
    this.modalForm = React.createRef(null);
    this.removeStand = this.removeStand.bind(this);
    this.RMModalClose = this.RMModalClose.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.showModal = this.showModal.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.tableRef = React.createRef();
  }

  removeStand() {
    this.props.dispatch({ type: "organizationInfo/removeStand", payload: this.state.crtStandInfo.Id })
    this.setState({ RMModalOpen: false, crtStandInfo: null })
  }

  openRMModal(standInfo) {
    this.setState({ crtStandInfo: standInfo, RMModalOpen: true });
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
    const dispatchData = {
      "StandName": values.standName,
      "ExamTimeRange": values.examTimeRange?.map(item => moment(item).unix()).join(",") || ""
    }
    if (!this.state.crtStandInfo) {
      this.props.dispatch({
        type: "organizationInfo/createStand", payload: dispatchData
      })

    }
    else {
      this.props.dispatch({
        type: "organizationInfo/modifyStand", payload: {
          "Id": this.state.crtStandInfo.Id,
          ...dispatchData,
        }
      })
    }

    this.setState({ isModalOpen: false, crtStandInfo: null })
  };

  showModal() {
    // setIsModalOpen(true);
    this.setState({ isModalOpen: true });
  };
  showModifyModal(fields) {

    this.setState({ isModalOpen: true, crtStandInfo: fields }, () => {
      const timeStrings = fields.ExamTimeRange?.split(',');
      let examTimeRange = null;
      if (timeStrings && timeStrings.length === 2) {
        examTimeRange = [moment.unix(parseInt(timeStrings[0])), moment.unix(parseInt(timeStrings[1]))];
      }

      this.modalForm.current?.setFieldsValue({
        standName: fields.StandName,
        examTimeRange
      });
    });
  }
  handleCancel() {
    // setIsModalOpen(false);
    this.setState({ isModalOpen: false });
  };

  componentDidUpdate(preProps) {
    if (preProps && preProps.adminSchoolId !== this.props.adminSchoolId) {
      this.props.dispatch({ type: "organizationInfo/queryStandList" })
    }
    this.tableRef.current?.reload();
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
      title: '站点名称',
      dataIndex: 'StandName',
      align: 'center',
    },
    {
      title: '考试时间',
      dataIndex: "ExamTimeRange",
      render: (value) => {
        const timeStamps = value.split(',');
        if (timeStamps && timeStamps.length === 2) {
          return `${moment.unix(parseInt(timeStamps[0])).format('YYYY-MM-DD HH:mm')}至${moment.unix(parseInt(timeStamps[1])).format('YYYY-MM-DD HH:mm')}`
        }
        return '-';
      },
      align: 'center',
    },
    {
      title: '操作',
      key: "operator",
      width: '2.5rem',
      search: false,
      render: (_, rowData) => (<>
        <Button type='link' onClick={this.showModifyModal.bind(this, rowData)}>
          编辑
        </Button>
        <Button type='link' onClick={this.openRMModal.bind(this, rowData)}>
          删除
        </Button>
      </>
      ),
      align: 'center',
    }
  ]

  render() {
    return <>
      <Modal
        title="删除站点"
        open={this.state.RMModalOpen}
        onOk={this.removeStand}
        onCancel={this.RMModalClose}
      >
        <p>
          确定删除
          <span style={{ fontWeight: 'bold', color: 'rgb(64,169,255)' }}>
            {this.state.crtStandInfo ? this.state.crtStandInfo.StandName : "此站点"}
          </span>?<br />站点关联的所有数据都会被删除
        </p>
      </Modal>
      <Modal title="新建站点"
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
          <Form.Item label="站点名称" name="standName" rules={[{ required: true }]} hasFeedback>
            <Input></Input>
          </Form.Item>
          <Form.Item label="考试时间" name="examTimeRange" style={{ minWidth: "400px" }} rules={[{ required: true }]} hasFeedback>
            <DatePicker.RangePicker showTime format={"YYYY-MM-DD HH:mm"} />
          </Form.Item>
        </Form>
      </Modal>
      <Space size={100}>
        <Button type="primary" onClick={this.showModal}>
          新建站点
        </Button>
      </Space>

      <p />
      {!this.props.standList ?
        <p>未查询到站点信息</p> :
        <ProTable
          actionRef={this.tableRef}
          request={(params, sort, filter) => Promise.resolve({
            data: tableFilter(this.props.standList, params),
            success: true
          })}
          // dataSource={this.props.standList}
          columns={this.columns} rowKey={item => item.Id} />
      }
    </>
  }
}

