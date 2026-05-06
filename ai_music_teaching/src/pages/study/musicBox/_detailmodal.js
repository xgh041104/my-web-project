import { Button, Modal, List, Descriptions, Image, Empty, Divider } from "antd";
import React, { useState } from 'react';
import { ProCard } from "@ant-design/pro-components";

//props说明：resourceDetail资源详情 detailIsVideo是否为视频的状态 openDetailModal打开modal的状态 closeDetailModal关闭modal的回调函数
export default function DetailModal(props) {

    const [currentResource, setCurrentResource] = useState(undefined);

    const detailData = props.resourceDetail;
    // console.log(props.openDetailModal, 'detailData: ', detailData);
    return (
        <>
            <Modal
                title={
                    (props.detailIsVideo) ? (
                        detailData.videoName + ' - 资源详情'
                    ) : (
                        detailData.catalogueName + ' - 资源详情'
                    )
                }
                width={(props.detailIsVideo) ? ('50vw') : ('80vw')}
                open={props.openDetailModal}
                onCancel={() => props.closeDetailModal()}
                footer={null}
                maskClosable={false}
                destroyOnClose
                centered
            >
                {
                    (typeof detailData === 'object' && Object.keys(detailData).length > 0) ? (
                        (props.detailIsVideo == false) ? (
                            //是专辑，则需要展示专辑的详情信息
                            <ProCard direction='column'>
                                <ProCard title='资源播放器' bordered>
                                    <ProCard title='资源列表' colSpan={'50%'} style={{ maxHeight: '30vh', overflow: 'auto' }}>
                                        <List
                                            dataSource={detailData?.trackList}
                                            renderItem={(item, index) => {
                                                return (<List.Item
                                                    actions={[
                                                        <Button type={(currentResource && currentResource?.trackId == item.trackId) ? ('primary') : ('default')}
                                                            onClick={() => {
                                                                setCurrentResource(item);
                                                                // console.log('checked item: ', item);
                                                            }}
                                                        >播放</Button>,
                                                    ]}
                                                >
                                                    {String(index + 1) + ' - ' + item.trackName}
                                                </List.Item>)
                                            }}
                                        >

                                        </List>
                                    </ProCard>
                                    <Divider type='vertical' style={{ height: 'auto' }} />
                                    <ProCard title='播放器' style={{ height: 'auto' }}>
                                        {
                                            (currentResource) ? (
                                                <>
                                                    <audio
                                                        controls controlsList="nodownload"
                                                        src={'http://catkin.rymusic.net/upload/' + currentResource.trackPath}
                                                    />
                                                    <br />
                                                    <span>{'当前播放：' + currentResource.trackName}</span>
                                                </>
                                            ) : (
                                                <Empty />
                                            )
                                        }
                                    </ProCard>
                                </ProCard>
                                <ProCard title='资源描述' bordered>
                                    <ProCard>
                                        <Descriptions bordered>
                                            <Descriptions.Item label="专辑名称">{detailData.catalogueName}</Descriptions.Item>
                                            <Descriptions.Item label="作曲">{detailData.composer}</Descriptions.Item>
                                            <Descriptions.Item label="艺术家">{detailData.artist}</Descriptions.Item>
                                            <Descriptions.Item label="专辑类型">{detailData.type}</Descriptions.Item>
                                            <Descriptions.Item label="专辑描述" span={2}>{detailData.catalogueDesc}</Descriptions.Item>
                                        </Descriptions>
                                    </ProCard>
                                    <ProCard colSpan={'30%'} style={{ maxHeight: '30vh' }} layout='center'>
                                        <Image
                                            alt={detailData.catalogueName}
                                            src={'http://catkin.rymusic.net/upload/' + detailData.coverImg}
                                            style={{ maxHeight: '25vh', width: 'auto' }}
                                        />
                                    </ProCard>
                                </ProCard>
                            </ProCard >
                        ) : (
                            //是视频，则要展示视频的详情窗口
                            <ProCard>
                                <video width={'100%'} height={'100%'} style={{ maxHeight: '50vh' }}
                                    playsInline controls
                                    controlsList="nodownload"
                                    src={'http://catkin.rymusic.net/upload/' + detailData.videoPath}
                                    poster={'http://catkin.rymusic.net/upload/' + detailData.coverImg}
                                    title={detailData.videoName}
                                />
                                <span>{detailData.videoName}</span>
                                <br />
                                <span>{detailData.videoDesc}</span>
                            </ProCard>
                        )
                    ) : ( //detail 对象参数为空，则展示empty
                        <Empty />
                    )
                }
            </Modal >
        </>
    )
}