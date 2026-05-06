import { Component } from 'react';
import { withRouter } from 'umi';
import { Helmet } from 'react-helmet'
import { siteName } from 'config';
import { connect } from 'dva';
import NProgress from 'nprogress'
import PrimaryLayout from './PrimaryLayout';
// import { message } from 'antd';

@withRouter
@connect(({ loading, user }) => ({
  loading, schoolId: user.userInfo.schoolId
}))
class BasicLayout extends Component {
  previousPath = ''

  constructor(props) {
    super(props)
  }

  render() {

    const { loading, location, children } = this.props

    const currentPath = location.pathname + location.search
    // console.log("current path" + currentPath);
    if (currentPath !== this.previousPath) {
      NProgress.start()
    }
    if (!loading.global) {
      NProgress.done()
      this.previousPath = currentPath
    }

    // let needLayout = (location.pathname !== '/login');
    let needLayout = true;
    if (location.pathname === '/login') {
      needLayout = false;
    }

    return <>
      <Helmet>
        <title>{siteName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
      </Helmet>
      {/* <Loader fullScreen spinning={loading.effects['app/query']} /> */}
      {needLayout ?
        <PrimaryLayout >{children}</PrimaryLayout>
        : children}
    </>
  }
}

export default BasicLayout;