import { Button, Modal, List, Descriptions, Image, Empty, Divider } from "antd";
import React, { useState, useEffect, useRef } from 'react';
import { ProCard } from "@ant-design/pro-components";
import { getFilePrefix } from 'config';
import ReactHlsPlayer from 'react-hls-player';

const PdfViewerWithFullscreen = ({ url }) => {
  const iframeRef = React.useRef(null);
  const [isFullScreen, setIsFullScreen] = React.useState(false);  //是否全屏

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);


  const goFullscreen = () => {
    if (!isFullScreen) {
      iframeRef?.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
  return (
    <div style={{ position: 'relative', backgroundColor: '#fff' }} ref={iframeRef}>
      <iframe
        src={url + '#toolbar=0'}
        style={{ height: isFullScreen ? '100vh' : '30vh' }}
        width={'100%'}
        frameborder={"0"} />
      <button style={{ position: 'absolute', bottom: 0, right: 0 }} onClick={goFullscreen}>{isFullScreen ? '退出全屏' : '全屏'}</button>
    </div>
  );
};

//props说明：resourceDetail资源详情列表  openDetailModal是否打开modal的状态   closeDetailModal关闭modal的回调函数  
export default function FileAnnexModal(props) {

  const [currentResource, setCurrentResource] = useState(undefined);

  useEffect(() => {
    setCurrentResource(undefined);
  }, [props.resourceDetail])

  const detailData = props.resourceDetail;
  // console.log(props.openDetailModal, 'detailData: ', detailData);

  // 你的getMediaPlayer函数改用这个
  const getMediaPlayer = (url) => {
    console.log('url: ', url);
    if (!url) return <div>无效地址</div>;

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith('.pdf')) {
      return <PdfViewerWithFullscreen url={url} />;
    }

    if (lowerUrl.endsWith('.m3u8')) {
      return (
        <ReactHlsPlayer
          src={url}
          autoPlay={false}
          controls={true}
          width={'100%'}
          height={'auto'}
        />
      );
    }

    if (lowerUrl.endsWith('.mp3')) {
      return (
        <audio controls style={{ width: '100%' }} controlsList="nodownload">
          <source src={url} type="audio/mp3" />
          您的浏览器不支持 audio 标签。
        </audio>
      );
    }

    return <div>不支持的文件格式</div>;
  };

  return (
    <>
      <Modal
        title={'公共课件列表'}
        width={'80vw'}
        open={props.openDetailModal}
        onCancel={() => props.closeDetailModal()}
        footer={null}
        maskClosable={false}
        destroyOnClose
        centered
      >
        {(detailData instanceof Array && Object.keys(detailData)?.length > 0) ? (
          //是专辑，则需要展示专辑的详情信息
          <ProCard direction='column'>
            <ProCard title='资源播放器' bordered>
              <ProCard title='资源列表' colSpan={'50%'} style={{ maxHeight: '30vh', overflow: 'auto' }}>
                <List
                  dataSource={detailData}
                  renderItem={(item, index) => {
                    return (<List.Item
                      actions={[
                        <Button type={(currentResource && currentResource?.fileInfoId == item.fileInfoId) ? ('primary') : ('default')}
                          onClick={() => {
                            setCurrentResource(item);
                          }}
                        >播放</Button>,
                      ]}
                    >
                      {String(index + 1) + ' - ' + item.fileName}
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
                      {/* <audio
                                                controls controlsList="nodownload"
                                                src={getFilePrefix() + currentResource.filePath}
                                            /> */}
                      {getMediaPlayer(getFilePrefix() + currentResource.filePath)}
                      <br />
                      <span>{'当前播放：' + currentResource.fileName}</span>
                    </>
                  ) : (
                    <Empty />
                  )
                }
              </ProCard>
            </ProCard>
          </ProCard >

        ) : ( //detail 对象参数为空，则展示empty
          <Empty />
        )
        }
      </Modal >
    </>
  )
}