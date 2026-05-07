import React from 'react';
import { Button, Space, Avatar, Breadcrumb, Divider, Radio } from 'antd';
import { UserOutlined } from "@ant-design/icons"
import { ProCard } from "@ant-design/pro-components"
import { connect } from 'dva';
import { history, Link } from 'umi';
import UnloginEmpty from '../unlogin';
import SelfInfoPage from './selfinfo';
import MyLesson from './mylesson';
import MyExam from './myexam';
import QuestionSet from './questionset';
import { filePrefix } from 'urlList';

@connect(({ dispatch, myCenter, user }) => ({ dispatch, myCenter, userInfo: user.userInfo }))
export default class MyCenter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contentType: 0, //0: selfinfo;  1:lesson; 2:exam; 3:错题集
        }
    }

    switchContentType(id) {
        if (id < 0 || id > 3) {
            return;
        }
        this.setState({
            contentType: id,
        })
    }

    ContentCom() {
        if (this.state.contentType == 0) {
            return <SelfInfoPage />
        } else if (this.state.contentType == 1) {
            return <MyLesson />
        } else if (this.state.contentType == 2) {
            return <MyExam />
        } else if (this.state.contentType == 3) {
            return <QuestionSet />
        }
    }

    render() {
        const studentIDImage = this.props.myCenter.studentInfo.IDImage;
        const avatarUrl = (!studentIDImage || studentIDImage == '') ? ''
            : (filePrefix() + this.props.myCenter.studentInfo.IDImage);
        return (!this.props.userInfo.isLogin) ? (<UnloginEmpty />) : (
            <div style={{ left: 0, right: 0, margin: "auto", width: "80%" }}>
                {/* <Breadcrumb>
                    <Breadcrumb.Item>
                        <Link to='/homePage'>首页</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Link to='/mycenter'>个人中心</Link>
                    </Breadcrumb.Item>
                </Breadcrumb> */}
                <ProCard split='vertical' style={{ background: 'transparent' }}>
                    <ProCard colSpan="20%"
                        style={{
                            background: 'transparent',
                            alignContent: 'center',
                            alignItems: 'center',
                        }}
                        layout='center'
                        direction='column'
                    >
                        <Avatar
                            size={{
                                xs: 32,
                                sm: 64,
                                md: 80,
                                lg: 100,
                                xl: 128,
                                xxl: 200,
                            }}
                            icon={<UserOutlined />}
                            src={avatarUrl}
                        />
                        <div style={{ textAlign: 'center' }}><h3>姓名：{this.props.userInfo.userName}</h3></div>

                        <Radio.Group buttonStyle='solid' size='large' defaultValue={0}
                            onChange={(e) => { this.switchContentType(e.target.value) }}
                        >
                            <Radio.Button value={1}>我的课程</Radio.Button><br />
                            <Radio.Button value={2}>我的考试</Radio.Button><br />
                            <Radio.Button value={3}>我的错题</Radio.Button><br />
                            <Radio.Button value={0}>个人信息</Radio.Button>
                        </Radio.Group>
                    </ProCard>
                    <ProCard style={{ background: 'transparent' }}>
                        <div style={{ minHeight: "60%" }}>
                            {this.ContentCom()}
                        </div>
                    </ProCard>
                </ProCard>
            </div>
        )
    }
}