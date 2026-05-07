import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { history } from 'umi';
const { Paragraph } = Typography;

/**props
 * itemData{
        "Id": 1,
        "Time": "2023/6/12 11:28:47",
        "NoticeTitle": "test1+修改",
        "NoticeContent": "test1",
        "SendUser": "test1",
        "NoticeLevel": 3,
        "NoticeType": "系统"
 * }
 */

class NoticeCard extends React.Component {
  constructor(props) {
    super(props);
  }

  clicked() {
    console.log("notice card clicked");
    history.push({ pathname: "/notice/noticedetail", state: { id: this.props.itemData.Id } });
  }

  render() {
    let bkcolor = 'green';
    if (this.props.itemData.NoticeLevel == 1) bkcolor = '#FF0000';
    else if (this.props.itemData.NoticeLevel == 2) bkcolor = '#0000FF';
    else if (this.props.itemData.NoticeLevel == 3) bkcolor = '#5BD8A6';

    return <Card
      title={<span><ExclamationCircleFilled style={{ color: bkcolor }} />{this.props.itemData.NoticeTitle}</span>}
      extra={<Tag color={bkcolor}>{this.props.itemData.NoticeType}</Tag>}
      style={{ body: { display: 'flex', justifyContent: "space-between", flexFlow: "column", minHeight: '20vh' } }}
      onClick={() => this.clicked()}
    >
      <Paragraph ellipsis={true} style={{ fontSize: '.3rem' }}>{this.props.itemData.NoticeContent}</Paragraph>
      <Card.Meta description={this.props.itemData.Time + "     " + this.props.itemData.SendUser + "      发布"} />
    </Card>
  }
}

export default NoticeCard;
