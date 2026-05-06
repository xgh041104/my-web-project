import React, { Component } from 'react';
import { history, Link, connect } from 'umi';
import { TreeSelect, Row, Col, Space, Divider, Input, Drawer, Typography, Pagination } from 'antd';
import { ProCard, ProList } from '@ant-design/pro-components';
const { Search } = Input;
const { Title, Paragraph, Text } = Typography;

@connect(({ dispatch, musicDict, user }) => ({
    dispatch,
    catsList: musicDict.catsList,
    treeData: musicDict.catsTreeData,
    docsList: musicDict.currentDocsList,
    docDetail: musicDict.docDetail,
    userInfo: user.userInfo
}))
export default class MusicDict extends Component {
    constructor(props) {
        super(props);
        this.state = {
            treeValue: undefined,
            searchText: '',
            openDrawer: false,
        };
    }

    handleTreeChange = (value) => {
        this.setState({
            treeValue: value,
        });
        this.props.dispatch({
            type: 'musicDict/queryDocsById',
            payload: {
                idList: value,
                searchText: this.state.searchText,
            }
        });
    }

    handleSearchChange = (value) => {
        this.setState({
            searchText: value
        });
        this.props.dispatch({
            type: 'musicDict/queryDocsByText',
            payload: {
                idList: (this.state.treeValue || []),
                searchText: value
            }
        });
    }

    handlePagination = (page, size) => {
        this.props.dispatch({
            type: 'musicDict/queryDocsByPage',
            payload: {
                idList: (this.state.treeValue || []),
                searchText: this.state.searchText,
                page: page
            }
        })
    }

    openDetail = (docId, docLibId) => {
        this.props.dispatch({
            type: 'musicDict/queryDocDetail',
            payload: { docId: docId, docLibId: docLibId },
            callback: () => {
                this.setState({
                    openDrawer: true,
                });
            }
        })
    }

    render() {
        const dataSource = this.props.docsList?.data?.map((item) => {
            return ({
                title: (<span>{item.SYS_TOPIC}</span>),
                content: (<>
                    <Space direction='vertical'>
                        <span>{(item.abstract || '本词条暂无注解！')}</span>
                        <span>定性语：{(item.DINGXINGYU || '-').slice(0, 10)}</span>
                        <span>作者：{(item.SYS_AUTHORS || '-').slice(0, 10)}</span>
                        <span>分类：{(item.DOC_CATALOG || '-').slice(0, 10)}</span>
                    </Space>
                </>),
                // description: (<>
                //     <Space>
                //         <span>{(item.abstract || '本词条暂无注解！')}</span>
                //         <span>定性语：{(item.DINGXINGYU || '-')}</span>
                //         <span>作者：{(item.SYS_AUTHORS || '-')}</span>
                //         <span>分类：{(item.DOC_CATALOG || '-')}</span>
                //     </Space>
                // </>),
                // subTitle: (<>
                //     <Space>
                //         <span>定性语：{(item.DINGXINGYU || '-')}</span>
                //         <span>作者：{(item.SYS_AUTHORS || '-')}</span>
                //         <span>分类：{(item.DOC_CATALOG || '-')}</span>
                //     </Space>
                // </>),
                docId: item.docId,
                docLibId: item.doclibId
            });
        });
        // console.log(this.props.docDetail);
        // console.log(dataSource, this.props.docsList?.content);
        return <>
            <div style={{ width: '88vw', height: '90vh', left: '2vw', margin: '.3rem' }}>
                <ProCard layout='center' style={{ background: 'transparent', height: '70vh' /*, overflow: 'auto'*/ }}>
                    <ProList style={{ width: '100%'/*, marginTop: '3.3rem'*/ }}  //TODO. 列表不能往下滑的问题
                        rowKey='docId'
                        // pagination={{}}
                        itemLayout='vertical'
                        grid={{ gutter: 16, column: 5 }}
                        showActions='hover'
                        dataSource={dataSource}
                        metas={{
                            title: { dataIndex: 'title' },
                            // description: { search: false },
                            subTitle: {},
                            content: { search: false },
                        }}
                        onItem={(record) => {
                            return {
                                onMouseEnter: () => {

                                },
                                onClick: () => {
                                    // console.log(record, 'clicked');
                                    this.openDetail(record.docId, record.docLibId);
                                },
                            };
                        }}
                    />
                </ProCard>
                <Divider type='horizontal' style={{ width: 'auto' }} />
                <Row>
                    <Col offset={1}>
                        <Pagination
                            total={this.props.docsList.total}
                            showTotal={(total) => `总共词条 ${total} 项`}
                            defaultPageSize={10}
                            defaultCurrent={1}
                            current={this.props.docsList.pageIndex}
                            showSizeChanger={false}
                            showQuickJumper
                            onChange={(page, size) => this.handlePagination(page, size)}
                        />
                    </Col>
                </Row>
                {/* <br /> */}
                <Divider type='horizontal' style={{ width: 'auto' }}  />
                <Row>
                    <Col span={1} offset={1}>
                        <span>选择分类:</span>
                    </Col>
                    <Col span={11}>
                        <TreeSelect
                            style={{ width: '100%' }}
                            placeholder='请选择词典内容分类'
                            treeData={this.props.treeData}
                            allowClear showSearch treeDataSimpleMode
                            treeCheckable showCheckedStrategy='SHOW_PARENT' //TODO.checkable看怎么控制root分类不能被选择
                            value={this.state.treeValue}
                            onChange={(value) => this.handleTreeChange(value)}
                        />
                    </Col>

                    <Col span={8} offset={1}>
                        <Search
                            addonBefore='搜索输入：'
                            allowClear
                            placeholder='请输入想要搜索的文字内容'
                            enterButton='开始搜索'
                            onSearch={(value) => {
                                this.handleSearchChange(value);
                            }}
                        />
                    </Col>
                </Row>
                <Drawer title={this.props.docDetail.SYS_TOPIC + '词条详情'}
                    open={this.state.openDrawer}
                    size='large'
                    onClose={() => {
                        this.setState({
                            openDrawer: false,
                        })
                    }}
                >
                    <Typography>
                        <Title>{this.props.docDetail.docName}</Title>
                        <Title level={5}>{this.props.docDetail.SYS_TOPIC}</Title>
                        <Title level={5}>{this.props.docDetail.DOC_CATALOG}</Title>
                        {(this.props.docDetail.ZUOCI) && <Title level={5}>{this.props.docDetail.ZUOCI}</Title>}
                        {(this.props.docDetail.ZUOQU) && <Title level={5}>{this.props.docDetail.ZUOQU}</Title>}
                        <Title level={4}>词条释义</Title>
                        <Paragraph>
                            <Title level={5}>{this.props.docDetail.DINGXINGYU}</Title>
                            {
                                (this.props.docDetail.DOC_TEXT) ? (
                                    <blockquote>{this.props.docDetail.DOC_TEXT}</blockquote>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: this.props.docDetail.DOC_EXPLAIN }}></div>
                                )
                            }
                        </Paragraph>
                        {(this.props.docDetail.DOC_SOURCE) && <Title level={5}>{this.props.docDetail.DOC_SOURCE}</Title>}
                        {(this.props.docDetail.SYS_AUTHORS) && <Title level={5}>{this.props.docDetail.SYS_AUTHORS}</Title>}
                        {(this.props.docDetail.CONTENT_CAT) && <Title level={5}>{this.props.docDetail.CONTENT_CAT}</Title>}
                    </Typography>
                </Drawer>
            </div >
        </>
    }
}