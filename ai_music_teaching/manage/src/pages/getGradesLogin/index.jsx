import React, { useState, useEffect } from 'react';
import { Layout, Button, Row, Col, Form, Input, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { connect } from 'dva';

const { Header, Footer, Content } = Layout;
const FormItem = Form.Item;

const Login = ({ loading, dispatch, login }) => {
    const { errorMsg } = login;
    const [errorInfo, setErrorInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setErrorInfo(errorMsg.message);
        setIsLoading(false);
    }, [errorMsg]);

    const handleOk = values => {
        setIsLoading(true);
        dispatch({
            type: 'login/loginStandUser',
            payload: {
                StandUserAccount: values.userName,
                StandUserPwd: values.userPwd,
            },
        });
    };

    return (<Spin size="large" spinning={isLoading}>
        <Layout style={{ background: 'linear-gradient(135deg, #6dd5ed, #2193b0)', minHeight: '100vh' }}>
            <Header style={{ background: 'transparent', padding: '30px 0' }}>
                <div style={{ color: '#fff', fontSize: '36px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '2px' }}>
                    成绩查询系统
                </div>
            </Header>

            <Content style={{ padding: '80px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Row justify="center" align="middle" style={{ width: '100%' }}>
                    <Col span={8}>
                        <div style={{
                            backgroundColor: '#f9f9f9',
                            padding: '50px 40px',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                            textAlign: 'center',
                            borderRight: '6px solid #2193b0',
                            borderBottom: '6px solid #2193b0',
                            animation: 'fadeIn 1s ease-out',
                        }}>
                            <h2 style={{
                                fontSize: '36px',
                                fontWeight: 'bold',
                                color: '#333',
                                marginBottom: '20px',
                                letterSpacing: '2px',
                                textTransform: 'uppercase'
                            }}>登录</h2>

                            <Form onFinish={handleOk} style={{ width: '100%' }}>
                                <FormItem
                                    name="userName"
                                    rules={[{ required: true, message: '请输入用户名' }]}>
                                    <Input
                                        prefix={<UserOutlined />}
                                        placeholder="请输入用户名"
                                        style={{
                                            borderRadius: '10px',
                                            padding: '12px',
                                            fontSize: '16px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                            marginBottom: '20px',
                                            transition: 'all 0.3s ease',
                                        }}
                                    />
                                </FormItem>

                                <FormItem
                                    name="userPwd"
                                    rules={[{ required: true, message: '请输入密码' }]}>
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        placeholder="请输入密码"
                                        style={{
                                            borderRadius: '10px',
                                            padding: '12px',
                                            fontSize: '16px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                            marginBottom: '30px',
                                            transition: 'all 0.3s ease',
                                        }}
                                    />
                                </FormItem>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        borderRadius: '30px',
                                        background: 'linear-gradient(45deg,rgb(47, 170, 201),rgb(72, 183, 248))',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '14px 0',
                                        height: '50px',
                                        transition: 'background-color 0.3s ease',
                                        userSelect: 'none',
                                    }}
                                    onMouseEnter={e => (e.target.style.backgroundColor = '#e9745d')}
                                    onMouseLeave={e => (e.target.style.backgroundColor = '#ff9a8b')}
                                >
                                    登录
                                </Button>
                            </Form>

                            {errorInfo && (
                                <Alert
                                    message={errorInfo}
                                    type="error"
                                    showIcon
                                    style={{
                                        marginTop: '20px',
                                        borderRadius: '10px',
                                        padding: '10px',
                                        width: '100%',
                                    }}
                                />
                            )}
                        </div>
                    </Col>
                </Row>
            </Content>

            <Footer style={{
                background: 'linear-gradient(135deg, #6dd5ed, #2193b0)',
                color: '#fff',
                textAlign: 'center',
                padding: '30px 0',
                fontSize: '16px',
                borderTop: '1px solid #fff',
                borderRadius: '15px 15px 0 0',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}>
                <p style={{ margin: '0', fontSize: '18px' }}>© {new Date().getFullYear()} 版权所有</p>
            </Footer>
        </Layout>
    </Spin>
    );
};

export default connect(({ loading, dispatch, login }) => ({ loading, dispatch, login }))(Login);
