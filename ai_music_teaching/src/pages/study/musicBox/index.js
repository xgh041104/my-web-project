import React from 'react';
import { connect } from 'umi';
import { Row, Col, Divider, Input, Pagination, Select, Button, Image, Modal, Typography, List, Empty, Card, Space, Spin } from 'antd';
import { ProCard, ProList } from '@ant-design/pro-components';
import { SearchOutlined } from '@ant-design/icons';
import DetailModal from './_detailmodal';
import { baseUrl } from 'config';
import './index.css'

const { Text } = Typography;
@connect(({ dispatch, musicBox, user }) => ({
    dispatch,
    allCats: musicBox.allCats,
    resourceList: musicBox.resourceList,
    resourceDetail: musicBox.resourceDetail,
    recommendList: musicBox.recommendList,
    lastRecordList: musicBox.lastRecordList,
    userInfo: user.userInfo
}))
export default class MusicBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentRoot: 1, //默认选中 专辑 根分类
            current1st: 1, //默认选中 中国声乐 一级分类
            current2st: 2, //默认选中 歌曲 二级分类
            openDetailModal: false,
            detailIsVideo: false, //专辑和视频的detail字段不一样，因此需要区分控制
            pageNo: 1,
            pageSize: 10,
            loading: true, //是否正在加载
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastRecordList !== prevProps.lastRecordList || this.props.resourceList !== prevProps.resourceList || this.props.recommendList !== prevProps.recommendList) {
            this.setState({
                loading: false
            })
        }
    }

    getDefault2stId = () => {
        var defaultRoot, default1st, default2st;//与state中的几个参数，配合起来控制3个select显示

        if (this.state.currentRoot == -1 && this.props.allCats.length > 0) {
            defaultRoot = this.props.allCats[0].value;
        } else {
            defaultRoot = this.state.currentRoot;
        }
        this.props.allCats.forEach((item) => {
            if (item.value == defaultRoot) {
                if (this.state.current1st == -1 && item.children.length > 0) {
                    default1st = item.children[0].id;
                } else {
                    default1st = this.state.current1st;
                }

                if (defaultRoot == 2) { //由于视频资源目录没有二级分类，因此这里做特例处理
                    default2st = default1st;
                    return;
                }

                item.children.forEach((item1st) => {
                    if (item1st.id == default1st) {
                        if (this.state.current2st == -1 && item1st.children.length > 0) {
                            default2st = item1st.children[0].id;
                        } else {
                            default2st = this.state.current2st;
                        }
                    }
                });
            }
        });
        // console.log('default2st cat: ', defaultRoot, default1st, default2st);
        return default2st;
    }

    handleSearch = () => {
        this.props.dispatch({
            type: 'musicBox/queryResourceList',
            payload: {
                rootType: this.state.currentRoot,
                //如果二级有选中，则查二级；没有则查一级；若都没有选中则查parentId=0，即根分类
                classifyId: (this.state.current2st > 0) ? (this.state.current2st) : (this.getDefault2stId()),
                pageNo: 1,
                pageSize: this.state.pageSize,
            },
        });
    }

    handlePageChange = (page, size) => {
        this.props.dispatch({
            type: 'musicBox/queryResourceList',
            payload: {
                rootType: this.state.currentRoot,
                //如果二级有选中，则查二级；没有则查一级；若都没有选中则查parentId=0，即根分类
                classifyId: (this.state.current2st > 0) ? (this.state.current2st) : (this.getDefault2stId()),
                pageNo: page,
                pageSize: size,
            },
        });
        this.setState({
            pageNo: page,
            pageSize: size,
        })
    }

    resourceClicked = (resourceId, rootType = -1) => {
        this.props.dispatch({
            type: 'musicBox/openResourceDetail',
            payload: {
                //-1时，表示是下面的列表选中打开；有参数时，表示是上面的推荐或者历史记录打开
                rootType: (rootType == -1) ? (this.state.currentRoot) : (rootType),
                resourceId: resourceId
            },
            callback: (detailData) => {
                // console.log(detailData);
                //弹窗后，展示资源基本信息、资源列表，及预览播放资源

                if (typeof detailData === 'object' && detailData.hasOwnProperty('videoPath')) {
                    this.setState({
                        openDetailModal: true,
                        detailIsVideo: true,
                    });
                } else {
                    this.setState({
                        openDetailModal: true,
                        detailIsVideo: false,
                    });
                }

                this.setResourceRecord(detailData, this.state.currentRoot);
            }
        });
    }


    setResourceRecord = (detail, rootType) => {
        this.props.dispatch({
            type: 'musicBox/setLastRecord',
            payload: {
                detail: detail,
                rootType: rootType
            }
        })
    }

    closeDetailModal = () => {
        this.setState({
            openDetailModal: false,
        });
    }

    render() {
        var defaultRoot, default1st, default2st;//与state中的几个参数，配合起来控制3个select显示
        var option1st = [];
        var option2st = [];

        const prefix = '/image/study/musicBox'

        const imgList = [
            { url: `${prefix}/zhMusic.png`, title: '中国声乐' },
            // { url: '/image/study/musicBox/classics.png', title: '红色经典' },
            { url: `${prefix}/foreignInstru.png`, title: '西方器乐' },
            { url: `${prefix}/zhInstru.png`, title: '中国器乐' },
            { url: `${prefix}/enjoyVideo.png`, title: '欣赏视频' },
            { url: `${prefix}/teachVideo.png`, title: '教学视频' },
        ];
        if (this.state.currentRoot == -1 && this.props.allCats.length > 0) {
            defaultRoot = this.props.allCats[0].value;
        } else {
            defaultRoot = this.state.currentRoot;
        }
        const rootOption = this.props.allCats.map((item) => {
            //判断根分类选择的是哪一个，即需要更新一级分类的option
            if (item.value == 1) {
                if (this.state.current1st == -1 && item.children.length > 0) {
                    default1st = item.children[0].id;
                } else {
                    default1st = this.state.current1st;
                }

                option1st = item.children.map((item1st) => {
                    //判断一级分类选择的是哪一个，即需要更新二级分类的option
                    if (item1st.id == default1st) {
                        if (this.state.current2st == -1 && item1st.children.length > 0) {
                            default2st = item1st.children[0].id;
                        } else {
                            default2st = this.state.current2st;
                        }
                        option2st = item1st.children.map((item2st) => {
                            //返回二级分类的select option
                            return { label: item2st.name, value: item2st.id };
                        });
                    }
                    //返回一级分类的select option
                    return { label: item1st.name, value: item1st.id };
                });
            }
            //返回根分类的select option
            return { label: item.label, value: item.value };
        });
        // console.log(this.props.allCats);

        //展示查询到的资源条目卡片
        const listDataSource = this.props.resourceList?.list?.map((item) => {
            if (defaultRoot == 1) {
                return ({
                    resourceId: item.id,
                    //由于切换list data是根据根分类来定。切换分类时，为了防止读取出错，就将name做个容错处理
                    content: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <Image height={'1.7rem'} style={{ borderRadius: '.2rem' }} alt={item.catalogueName} preview={false} src={'http://catkin.rymusic.net/upload/' + item.coverImg} />
                        <Text style={{ marginTop: '.1rem', textAlign: 'center', width: '100%', fontSize: '.21rem', fontWeight: 400 }}>
                            {item.catalogueName ? item.catalogueName.split("——")[0] : item.videoName.split("——")[0]}
                        </Text>
                    </div>
                })
            } else if (defaultRoot == 2) {
                return ({
                    resourceId: item.id,
                    //由于切换list data是根据根分类来定。切换分类时，为了防止读取出错，就将name做个容错处理
                    content: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', borderRadius: '.2rem' }}>
                        <Image height={'1.7rem'} alt={item.videoName} preview={false} src={'http://catkin.rymusic.net/upload/' + item.coverImg} style={{ borderRadius: '.2rem' }} />
                        <Text style={{ marginTop: '.1rem', textAlign: 'center', width: '100%', fontSize: '.21rem', fontWeight: 400 }}>
                            {item.videoName ? item.videoName.split("——")[0] : item.catalogueName.split("——")[0]}
                        </Text>
                    </div>
                })
            }
        });
        // console.log(listDataSource);

        return <Spin spinning={this.state.loading}>
            <div
                style={{ width: '88vw', height: '90vh', left: '2vw', margin: '.3rem', overflow: 'auto' }}
            >

                <DetailModal resourceDetail={this.props.resourceDetail} detailIsVideo={this.state.detailIsVideo} openDetailModal={this.state.openDetailModal} closeDetailModal={this.closeDetailModal} />
                <ProCard direction='column' style={{ background: 'transparent', borderSpacing: '0px' }}>
                    {/* <ProCard
                    style={{ borderSpacing: '0px', borderRadius: '20px' }}
                >
                    <ProCard title='智能推荐'
                        style={{ background: 'transparent', borderSpacing: '0px' }}
                    >
                        <Space size={'large'}>
                            {
                                (this.props.recommendList?.length > 0) ? (
                                    this.props.recommendList.map((item) => {
                                        return (
                                            <Card
                                                key={'recommend' + item.id}
                                                hoverable
                                                style={{
                                                    width: '4vw',
                                                    height: '6vw',
                                                }}
                                                cover={
                                                    <img
                                                        style={{ maxHeight: '6vw', maxWidth: '4vw' }}
                                                        title={item.catalogueName}
                                                        alt={item.catalogueName}
                                                        src={'http://catkin.rymusic.net/upload/' + item.coverImg}
                                                    />
                                                }
                                                onClick={() => {
                                                    //推荐默认打开的是专辑
                                                    this.resourceClicked(item.id, 1);
                                                }}
                                            >
                                                <Card.Meta title={item.catalogueName} />
                                            </Card>
                                        )
                                    })
                                ) : (
                                    <Empty />
                                )
                            }
                        </Space>
                    </ProCard>
                    <Divider type='vertical' style={{ height: 'auto' }} />
                    <ProCard title='最近播放'
                        style={{ background: 'transparent' }}
                    >
                        <Space size={'large'}>
                            {
                                (this.props.lastRecordList?.length > 0) ? (
                                    this.props.lastRecordList.map((item, index) => {
                                        return (
                                            <Card
                                                key={'record' + String(index) + item.detail.id}
                                                hoverable
                                                style={{
                                                    width: '4vw',
                                                    height: '6vw',
                                                }}
                                                cover={
                                                    <img
                                                        style={{ maxHeight: '6vw', maxWidth: '4vw' }}
                                                        title={item.rootType == 1 ? (item.detail.catalogueName) : (item.detail.videoName)}
                                                        alt={item.rootType == 1 ? (item.detail.catalogueName) : (item.detail.videoName)}
                                                        src={'http://catkin.rymusic.net/upload/' + item.detail.coverImg}
                                                    />
                                                }
                                                onClick={() => {
                                                    //记录打开的有可能是专辑或视频
                                                    this.resourceClicked(item.detail.id, item.rootType);
                                                }}
                                            >
                                                <Card.Meta title={item.catalogueName} />
                                            </Card>
                                        )
                                    })
                                ) : (
                                    <Empty />
                                )
                            }
                        </Space>
                    </ProCard>
                </ProCard> */}

                    {/* <Divider style={{ width: 'auto' }} /> */}

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '1.2rem' }}>
                        {option1st.map((item, index) => {
                            return (<>
                                <Divider className='musicBoxDivider' type="vertical" style={{ height: '1rem', margin: '0 0.2rem', marginTop: '0.2rem', borderRadius: '.2rem' }} />
                                <div style={{
                                    width: '1.6rem',
                                    height: '100%',
                                    marginLeft: '0.1rem',
                                    marginRight: '0.1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    backgroundColor: (this.state.current1st == -1) ? default1st : this.state.current1st === item.value ? '#FDD3C9' : 'transparent',
                                    borderRadius: '.2rem'
                                }}
                                    onClick={() => {
                                        this.setState({
                                            currentRoot: option1st.length - index > 2 ? 1 : 2,
                                            current1st: item.value,
                                            current2st: -1,
                                            loading: true
                                        }, () => {
                                            this.handleSearch();
                                        });
                                    }}>
                                    <img src={baseUrl + imgList[index].url} style={{ height: '0.6rem', width: 'auto', marginTop: '0.1rem', }} />
                                    <span style={{ marginTop: '0.1rem', fontWeight: 400, fontSize: '0.26rem' }}>{item.label}</span>
                                </div>
                                {index === option1st.length - 1 && <Divider className='musicBoxDivider' type="vertical" style={{ height: '1rem', margin: '0 0.2rem', marginTop: '0.2rem' }} />}
                            </>)
                        })
                        }
                    </div>

                    <br />

                    <ProCard
                        // title='音乐馆'
                        style={{ borderSpacing: '0px', borderRadius: '.2rem', marginTop: '.4rem', boxShadow: '5px 4px 6px rgba(0,0,0,0.1)', paddingTop: '0.1rem' }}
                    >
                        {/* <Row>
                        <Col span={7}>
                            <span>资源类型：</span>
                            <Select
                                defaultValue={(this.state.currentRoot == -1) ? defaultRoot : this.state.currentRoot}
                                style={{ width: '16vw' }}
                                options={rootOption}
                                onChange={(value) => {
                                    this.setState({
                                        currentRoot: value,
                                        current1st: -1,
                                        current2st: -1,
                                    });
                                }}
                            />
                        </Col>
                        <Col span={7}>
                            <span>一级分类：</span>
                            <Select
                                value={(this.state.current1st == -1) ? default1st : this.state.current1st}
                                style={{ width: '16vw' }}
                                options={option1st}
                                onChange={(value) => {
                                    this.setState({
                                        current1st: value,
                                        current2st: -1,
                                    });
                                }}
                            />
                        </Col>
                        <Col span={7}>
                            <span>二级分类：</span>
                            <Select
                                value={(this.state.current2st == -1) ? (default2st == -1 ? null : default2st) : this.state.current2st}
                                style={{ width: '16vw' }}
                                options={option2st}
                                onChange={(value) => {
                                    this.setState({
                                        current2st: value,
                                    });
                                }}
                            />
                        </Col>
                        <Button icon={<SearchOutlined />} type='primary'
                            onClick={() => {
                                this.handleSearch();
                            }}>查询</Button>
                    </Row> */}

                        {/* <Divider style={{ width: 'auto' }} /> */}
                        {/* <br /> */}

                        <div style={{ height: '60vh', overflow: 'auto' }}>
                            <ProList
                                rowKey={'resourceId'}
                                itemLayout='vertical'
                                grid={{ gutter: 5, column: 5 }}
                                showActions='hover'
                                dataSource={listDataSource}
                                metas={{
                                    // extra: {},
                                    content: {},
                                }}
                                onItem={(record) => {
                                    return {
                                        onClick: () => {
                                            this.resourceClicked(record.resourceId);
                                        }
                                    }
                                }}
                            />
                        </div>
                        {/* <br /> */}
                        <Pagination
                            // pageSize={this.props?.resourceList?.pageSize}
                            current={this.props?.resourceList?.pageNumber}
                            total={this.props?.resourceList?.totalRow}
                            showTotal={(total) => `资源总数 ${total} 项`}
                            defaultPageSize={10}
                            defaultCurrent={1}
                            showSizeChanger={true}
                            onChange={(page, size) => {
                                // console.log('pageNumber:', page, size);

                                this.handlePageChange(page, size);
                            }}
                        />
                    </ProCard>
                </ProCard>
            </div>
        </Spin>

    }
}