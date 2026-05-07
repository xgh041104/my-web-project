import { Button, Modal, List, Input, Empty, Drawer, Typography } from "antd";
import React, { useState, useEffect } from 'react';
import { ProCard } from "@ant-design/pro-components";
const { Search } = Input;
const { Title, Paragraph, Text } = Typography;

//props说明: dispatch  openSearchModal是否打开modal的状态   closeSearchModal关闭modal的回调函数  
export default function DictSearchModal(props) {

    const [resultList, setResultList] = useState(undefined);
    const [currentResource, setCurrentResource] = useState(undefined);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [currentDetail, setCurrentDetail] = useState(undefined);

    useEffect(() => {

    }, []);

    const handleSearchChange = (searchValue) => {
        if (!props.dispatch) {
            return;
        }
        props?.dispatch({
            type: 'musicDict/queryDocsByText',
            payload: {
                idList: [],
                searchText: searchValue,
            },
            callback: (docsList) => {
                setResultList(docsList?.data);
                // console.log('handlesearch: ', docsList);
            }
        });
    }

    const openDetail = (docId, docLibId) => {
        if (!props.dispatch) {
            return;
        }
        props.dispatch({
            type: 'musicDict/queryDocDetail',
            payload: { docId: docId, docLibId: docLibId },
            callback: (detail) => {
                setOpenDrawer(true);
                setCurrentDetail(detail);
            }
        })
    }

    return (
        <>
            <Modal
                title={'音乐词典搜索'}
                width={'60vw'}
                open={props.openSearchModal}
                onCancel={() => props.closeSearchModal()}
                footer={null}
                maskClosable={false}
                destroyOnClose
                centered
            >
                <Search
                    addonBefore='搜索输入：'
                    allowClear
                    placeholder='请输入想要搜索的文字内容'
                    enterButton='开始搜索'
                    onSearch={(value) => {
                        handleSearchChange(value);
                    }}
                />
                <ProCard title='结果列表' style={{ maxHeight: '50vh', overflow: 'auto' }}>
                    {
                        (resultList instanceof Array && resultList?.length > 0) ? (
                            <List
                                dataSource={resultList}
                                renderItem={(item, index) => {
                                    return (<List.Item
                                        actions={[
                                            <Button type={(currentResource && currentResource?.docId == item.docId) ? ('primary') : ('default')}
                                                onClick={() => {
                                                    // console.log('view detail: ', item, item.docId, item.doclibId)
                                                    setCurrentResource(item);
                                                    openDetail(item.docId, item.doclibId); //原生的doclibId，大小写没有问题
                                                }}
                                            >查看详情</Button>,
                                        ]}
                                    >
                                        {String(index + 1) + ' - ' + item.SYS_TOPIC}
                                    </List.Item>)
                                }}
                            >
                            </List>
                        ) : (
                            <Empty />
                        )
                    }
                </ProCard>

                <Drawer title={currentDetail?.SYS_TOPIC + '词条详情'}
                    open={openDrawer}
                    size='large'
                    onClose={() => {
                        setOpenDrawer(false);
                    }}
                >
                    {
                        (currentDetail) ? (
                            <Typography>
                                <Title>{currentDetail.docName}</Title>
                                <Title level={5}>{currentDetail.SYS_TOPIC}</Title>
                                <Title level={5}>{currentDetail.DOC_CATALOG}</Title>
                                {(currentDetail.ZUOCI) && <Title level={5}>{currentDetail.ZUOCI}</Title>}
                                {(currentDetail.ZUOQU) && <Title level={5}>{currentDetail.ZUOQU}</Title>}
                                <Title level={4}>词条释义</Title>
                                <Paragraph>
                                    <Title level={5}>{currentDetail.DINGXINGYU}</Title>
                                    {
                                        (currentDetail.DOC_TEXT) ? (
                                            <blockquote>{currentDetail.DOC_TEXT}</blockquote>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: currentDetail.DOC_EXPLAIN }}></div>
                                        )
                                    }
                                </Paragraph>
                                {(currentDetail.DOC_SOURCE) && <Title level={5}>{currentDetail.DOC_SOURCE}</Title>}
                                {(currentDetail.SYS_AUTHORS) && <Title level={5}>{currentDetail.SYS_AUTHORS}</Title>}
                                {(currentDetail.CONTENT_CAT) && <Title level={5}>{currentDetail.CONTENT_CAT}</Title>}
                            </Typography>
                        ) : (
                            <Empty />
                        )
                    }
                </Drawer>
            </Modal>
        </>
    );
}