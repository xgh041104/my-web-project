import React, { useState, useEffect } from 'react'
import { Layout, Button, Row, Col, Form, Input, Alert, Radio, Space } from 'antd'
import { connect } from 'dva'
import { hostAddr, baseUrl } from 'urlList'
import { Vertify } from '@alex_xu/react-slider-vertify';

import styles from "./index.css";

const { Header, Footer, Content } = Layout;

const FormItem = Form.Item;

const Login = ({ loading, dispatch, login
  , websiteInfo // BaseLayout注入的属性
}) => {
  const { errorMsg } = login;

  const [errorInfo, setErrorInfo] = useState(null);
  const [isSliderVerified, setVerified] = useState(false);

  useEffect(() => {
    setErrorInfo(errorMsg.message);
  }, [errorMsg])

  const handleOk = values => {
    console.log("submit values " + JSON.stringify(values));
    if (!isSliderVerified) {
      setErrorInfo("请完成安全验证!");
      return;
    }

    if (values.userType === "teacher") {
      dispatch({
        type: 'login/loginTeacher', payload: {
          "TeacherAccount": values.userName,
          "TeacherPassword": values.userPwd
        }
      })
    }
    else if (values.userType === "admin") {
      dispatch({
        type: 'login/loginAdmin',
        payload: {
          "AdminAccount": values.userName,
          "AdminPassword": values.userPwd
        }
      })
    }
  }

  const hideErrorMsg = () => {
    // console.log("关闭错误信息显示");
    setErrorInfo(null);
  }

  const verifySuccess = () => {
    setVerified(true);
  }
  const verifyFailed = () => {
    setVerified(false);
  }


  const userTypeOptions = [
    {
      label: '管理员',
      value: 'admin',
    },
    {
      label: '老师',
      value: 'teacher',
    },
  ]


  return <Layout style={{
    backgroundImage: `url(${baseUrl + '/image/login/background.png'})`, backgroundSize: "100% 100%",
  }}>
    <Header style={{ minHeight: '7vh', }}>
      <Row>
        <Col>
          <div className={styles.logo}>
            <span >AI音乐测评平台</span>
          </div>
        </Col>
      </Row>
    </Header>
    <Content style={{ minHeight: '82vh', backgroundColor: 'transparent' }}>
      <Row justify="space-around" align="middle" style={{ height: '75vh' }}>
        <Col offset={2} span={14}>
          <img src={baseUrl + '/image/login/peitu.png'} />
        </Col>
        <Col className={styles.form} span={7}>
          <Form
            labelCol={{ span: 4, offset: 1 }}
            wrapperCol={{ span: 15, }}
            onFinish={handleOk}
            onFocus={hideErrorMsg}
          >
            <div style={{ textAlign: 'center' }}><img src={baseUrl + '/image/login/welcome.png'} /></div>
            <br />
            <br />
            <FormItem name="userName" label="用户名"
              rules={[{ required: true }]} hasFeedback>
              <Input />
            </FormItem>
            <FormItem name="userPwd" label="密码" rules={[{ required: true }]} hasFeedback>
              <Input.Password type='password' />
            </FormItem>
            <FormItem name="userType" label="用户类型" rules={[{ required: true }]} initialValue={"teacher"} >
              <Radio.Group options={userTypeOptions} />
            </FormItem>
            <Row justify={'start'}>
              <Col offset={1}>
                <span style={{ color: 'red', marginRight: '.05rem' }}>*</span>
              </Col>
              <Col span={4}>
                安全验证：
              </Col>
              <Col span={15}>
                <Vertify
                  style={{ width: '100%', height: 'auto' }}
                  imgUrl={hostAddr + "/SlideImg"}
                  onSuccess={verifySuccess}
                  onFail={verifyFailed}
                // onRefresh={() => alert('refresh')}
                />
              </Col>
            </Row>

            <br />
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.effects.login}
              className={styles.button}
            // disabled={!isSliderVerified}
            >
              <span>登 录</span>
            </Button>
          </Form>
          {errorInfo && <Alert message={errorInfo} type="error" showIcon />}
        </Col>
      </Row>
    </Content>
  </Layout>



}


Login.title = "login";

export default connect(({ loading, dispatch, login }) => ({ loading, dispatch, login }))(Login);
