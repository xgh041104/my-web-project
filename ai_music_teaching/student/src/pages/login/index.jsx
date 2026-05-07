import { useState, useEffect, useRef } from 'react'
import { Button, Row, Col, Form, Input, Alert, Modal, Spin, Layout, message } from 'antd'
import { connect } from 'dva'
import { Vertify } from '@alex_xu/react-slider-vertify';
import { hostAddr } from 'urlList';
import styles from "./index.css";

import { history } from 'umi';
import { baseUrl } from 'urlList';

const { Header, Footer, Content } = Layout;

const FormItem = Form.Item;

const Login = ({
  loading, dispatch, login, devicestatus,
  websiteInfo,// BaseLayout注入的属性
}) => {
  const { errorMsg } = login;
  const [errorMsgVisible, setErrorMsgVisible] = useState(false);
  const cameraVideoRef = useRef();
  const [loginInfo, setLoginInfo] = useState({ isLogin: false, info: null });
  const [isVertify, setVertify] = useState(false);

  useEffect(() => {
    const visible = (errorMsg.message !== undefined && errorMsg.message !== null)
    setErrorMsgVisible(visible);
    if (visible) {
      setLoginInfo(false, null);
    }
  }, [errorMsg])

  const handleOk = values => {
    if (!isVertify) {
      message.error("请先完成验证");
      return;
    }
    setLoginInfo({ isLogin: true, info: "正在登陆中..." });
    dispatch({
      type: 'login/loginStudent',
      payload: {
        "StudentAccount": values.userName,
        "StudentPwd": values.userPwd,
        "currentImageBase64": () => cameraVideoRef.current.getCurrentImageBase64(),
        "currentImage": () => cameraVideoRef.current.getCurrentImage()
      },
      callback: ({ loadingInfo, loading }) => {
        setTimeout(() => setLoginInfo({ isLogin: loading, info: loadingInfo }), 300);
      }
    })
  }

  const hideErrorMsg = () => {
    setErrorMsgVisible(false);
  }

  return <Layout >
    <Header style={{ background: "white" }}>
    </Header>
    <Content style={{
      backgroundImage: `url(${baseUrl + '/image/login/background.png'})`, backgroundSize: "100% 100%"
    }}>
      <Row justify='start' align="middle" style={{ minHeight: "80vh" }}>
        <Col offset={2} span={12}>
          <img src={baseUrl + "/image/login/peitu.png"} />
        </Col>
        <Col offset={1} span={5}>
          <Spin tip={loginInfo.info} spinning={loginInfo.isLogin} size='large' style={{ minHeight: "25%", width: "4rem" }}>
            <Form
              className={styles.form}
              labelCol={{ span: 5 }}
              onFinish={handleOk}
              onValuesChange={hideErrorMsg}
            >
              <div style={{ textAlign: 'center' }}><img src={baseUrl + '/image/login/welcome.png'} /></div>
              <br />
              <FormItem name="userName" label="用户名"
                rules={[{ required: true }]} hasFeedback>
                <Input />
              </FormItem>
              <br />
              <FormItem name="userPwd" label="密码" rules={[{ required: true }]} hasFeedback>
                <Input.Password type='password' />
              </FormItem>
              <br />
              <Vertify
                width={220} height={100}
                imgUrl={hostAddr + "/SlideImg?" + Math.floor(Math.random() * 100000)}
                onSuccess={() => { setVertify(true) }}
                onFail={() => { setVertify(false) }}
              />
              <Row justify={'center'}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading.effects.login}
                  style={{ width: '60%' }}
                >
                  学员登陆
                </Button>
              </Row>
              <br />
              <div>{errorMsgVisible ? <Alert message={errorMsg.message} type="error" showIcon /> : null}</div>
            </Form>
          </Spin>
        </Col>
        <Col></Col>
      </Row>
    </Content >
  </Layout >
}


Login.title = "login";

export default connect(({ loading, dispatch, login, user }) => ({
  loading, dispatch, login,
  devicestatus: user.devicestatus,
}))(Login);
