import { Form, Input } from 'antd'
import React, { Component } from 'react'
import { connect } from 'umi'

@connect(({ user }) => ({ userInfo: user.userInfo }))
export default class SelfInfo extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isModified: false
    }
    this.form = React.createRef();
  }

  componentDidMount() {
    this.form.current?.setFieldsValue(this.props.userInfo);
  }

  render() {
    const message = "请输入有效的${label}"
    const TextInput = <Input bordered={this.state.isModified} />
    const formItemProps = {
      rules: [{ required: this.state.isModified }],
      hasFeedback: this.state.isModified
    }
    return <Form
      size='large'
      disabled={!this.state.isModified}
      ref={this.form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 16 }}
      style={{ width: "4rem", marginTop: "1.1rem", marginLeft: "1.5rem" }}
    >
      <Form.Item label="姓名" name="userName" props={formItemProps}>
        {TextInput}
      </Form.Item>
      <Form.Item label="账号" name="account" props={formItemProps}>
        {TextInput}
      </Form.Item>
      <Form.Item label="称号" name="title" props={formItemProps}>
        {TextInput}
      </Form.Item>
      <Form.Item label="电话" name="phoneNumber" rules={[{ required: this.state.isModified, pattern: /\d+/, message }]} >
        {TextInput}
      </Form.Item>
      <Form.Item label="邮箱" name="email" rules={[{ required: this.state.isModified, type: "email", message }]} >
        {TextInput}
      </Form.Item>
      <Form.Item label="学校" name="schoolId" props={formItemProps}>
        {TextInput}
      </Form.Item>
    </Form>
  }
}
