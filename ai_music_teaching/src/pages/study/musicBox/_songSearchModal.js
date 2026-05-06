import { Button, Modal, List, Input, Empty, Drawer, Typography, message } from "antd";
import React, { useState, useEffect } from 'react';
import { ProCard } from "@ant-design/pro-components";
const { Search } = Input;
const { Title, Paragraph } = Typography;

//props说明: dispatch  openSearchModal是否打开modal的状态   closeSearchModal关闭modal的回调函数  
export default function SongSearchModal(props) {

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
        message.info('数据库无法查找到相关资源!');
    }

    return (
        <>
            <Modal
                title={'歌曲查找搜索'}
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
            </Modal>
        </>
    );
}