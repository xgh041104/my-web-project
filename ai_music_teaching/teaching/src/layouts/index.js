import React, { Component } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN';

import BaseLayout from './BaseLayout'
class Layout extends Component {
  state = {
  }

  componentDidMount() {
  }

  render() {
    const { children } = this.props

    return (
      <ConfigProvider locale={zhCN}>
          <BaseLayout>{children}</BaseLayout>
      </ConfigProvider>
    )
  }
}

export default Layout
