import React, { Component } from 'react'
import { Row, Col, Card, Carousel, Typography, Empty, Divider, Space } from 'antd'
import NoticeCard from '../notice/noticecard';
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { baseUrl } from 'urlList'
import ReactHlsPlayer from 'react-hls-player';
const { Text } = Typography;

class NoticeDispaly extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let com_var;
        if (this.props.noticeList.length <= 0) {
            com_var = <>
                <Col span={11}>
                    <Card>
                        <Empty />
                    </Card>
                </Col >
                <Col span={11}>
                    <Card>
                        <Empty />
                    </Card>
                </Col >
            </>
        } else if (this.props.noticeList.length == 1) {
            com_var = <>
                <Col span={11}>
                    <NoticeCard itemData={this.props.noticeList[0]} />
                </Col>
                <Col span={11}>
                    <Card>
                        <Empty />
                    </Card>
                </Col >
            </>
        } else {
            com_var = <>
                <Col span={11}>
                    <NoticeCard itemData={this.props.noticeList[0]} />
                </Col>
                <Col span={11}>
                    <NoticeCard itemData={this.props.noticeList[1]} />
                </Col>
            </>
        }
        return <Row justify={"space-between"} style={{ marginTop: ".25rem" }}>
            {com_var}
        </Row>
    }
}

@connect(({ homePageSpace }) => ({ noticeList: homePageSpace.noticeList }))
export default class homePage extends Component {
    static propTypes = {
        noticeList: PropTypes.array
    }
    render() {
        const styles = {
            height: '45vh',
            color: '#fff',
            lineHeight: '45vh',// lineHeight==height 文字垂直居中
            textAlign: 'center',
            background: '#364d79',
            // background: 'transparent',
        };

        return <div style={{ left: 0, right: 0, margin: "auto", width: "80vw" }}>
            <Carousel autoplay>
                <div>
                    <img src={baseUrl+"/testImage/B01.jpg"} alt="测试图片" style={{ width: '100%', height: '45vh' }} />
                </div>
                <div>
                    <img src={baseUrl+"/testImage/B02.jpg"} alt="测试图片" style={{ width: '100%', height: '45vh' }} />
                </div>
                <div>
                    <img src={baseUrl+"/testImage/B03.jpg"} alt="测试图片" style={{ width: '100%', height: '45vh' }} />
                </div>
                <div>
                    <img src={baseUrl+"/testImage/B04.jpg"} alt="测试图片" style={{ width: '100%', height: '45vh' }} />
                </div>
                <div>
                    <img src={baseUrl+"/testImage/B05.jpg"} alt="测试图片" style={{ width: '100%', height: '45vh' }} />
                </div>
            </Carousel>
            <Divider style={{ width: 'auto' }} />
            <NoticeDispaly noticeList={this.props.noticeList} />
        </div>
    }
}
