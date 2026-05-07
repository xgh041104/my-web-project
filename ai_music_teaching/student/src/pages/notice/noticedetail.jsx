import React from 'react';
import { Breadcrumb, Typography, Tag, Divider, Input } from 'antd';
import { connect } from 'dva';
import { Link } from 'umi';
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

@connect(({ noticeModel }) => ({ noticeDetail: noticeModel.noticeDetail }))
export default class NoticeDetail extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const data = this.props.noticeDetail;
        let bkcolor = 'green';
        if (data.NoticeLevel == 1) bkcolor = '#FF0000';
        else if (data.NoticeLevel == 2) bkcolor = '#0000FF';
        else if (data.NoticeLevel == 3) bkcolor = '#5BD8A6';

        return <div style={{ left: 0, right: 0, margin: "auto", width: "80vw" }}>
            {/* <Breadcrumb>
                <Breadcrumb.Item>
                    <Link to='/homePage'>首页</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to='/notice/noticepage'>通知公告</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    公告详情
                </Breadcrumb.Item>
            </Breadcrumb> */}
            <Divider />
            <Title style={{ textAlign: 'center' }}>
                {data.NoticeTitle}
            </Title>
            <Title level={5} style={{ textAlign: 'center' }}>{data.SendUser} </Title>
            <Text>{data.NoticeContent}</Text>
            <Title level={5}> <Tag color={bkcolor}>{data.NoticeType}</Tag>{data.Time}</Title>
            <Divider />
        </div>
    }
}