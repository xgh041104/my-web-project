import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'dva';
import { history, useLocation } from 'umi';
import { Button, Card, Modal, Pagination, message, Popconfirm } from 'antd';
import { FullscreenOutlined, CloseOutlined, SortAscendingOutlined, SortDescendingOutlined, ArrowLeftOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './index.less';

import { teachPrefix } from 'config';
import moment from 'moment';


const VideoList = (props) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' 为降序，'asc' 为升序
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); // 每页显示6个视频
  const videoRef = useRef(null);
  const { videoDisplayData, total, dispatch } = props;
  const [videoData, setVideoData] = useState([]);
  const location = useLocation();

  console.log("请求到的参数", videoData, total);

  // 处理videoDisplayData数据
  useEffect(() => {
    if (videoDisplayData && videoDisplayData.length > 0) {
      const transformedApiData = videoDisplayData.map((item, index) => {

        // 处理时间格式
        const rawTime = item.createAt;
        const ts = Number(rawTime);
        const isTimestamp = !Number.isNaN(ts) && ts > 1e12;
        const timeStr = isTimestamp
          ? moment(ts).format('YYYY-MM-DD HH:mm')
          : moment(rawTime).isValid()
            ? moment(rawTime).format('YYYY-MM-DD HH:mm')
            : moment().format('YYYY-MM-DD HH:mm');
        return {
          id: item.courseId,
          title: item.title,
          video: `${teachPrefix}/${item.video}`,
          // videoUrl: videoUrl,
          summary: item.summary || '暂无总结',
          date: timeStr,
        };
      });
      setVideoData(transformedApiData);
    } else if (videoDisplayData && videoDisplayData.length === 0) {
      // 如果videoDisplayData为空数组，清空本地状态
      setVideoData([]);
    }
  }, [videoDisplayData, total]);
  // 根据排序顺序对视频进行排序
  const sortedVideos = [...videoData].sort((a, b) => {
    if (sortOrder === 'desc') {
      return new Date(b.date) - new Date(a.date);
    }
    return new Date(a.date) - new Date(b.date);
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1); // 排序后回到第一页
  };

  // 分页处理
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentVideos = sortedVideos.slice(startIndex, endIndex);

  console.log("当前视频列表", currentVideos);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  const handleAIClick = (video) => {
    console.log("视频信息", video);
    history.push('/teach/videoSummary/conclude', {
      summary: {
        title: video.title,
        content: video.summary,
      }
    });
  };

  const handleDeleteClick = (video) => {
    // 获取视频ID
    const videoId = video.id;
    
    if (!videoId) {
      message.error('无法获取视频ID');
      return;
    }

    // 调用删除接口
    dispatch({
      type: 'videoSummary/deleteVideo',
      payload: {
        videoId: videoId,
      }
    });
  };


  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setSelectedVideo(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => history.push('/teach/videoSummary')}
            className={styles.backButton}
          >
            返回
          </Button>
          <h1 className={styles.title}>微课视频</h1>
          <Button
            type="primary"
            icon={sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
            onClick={toggleSortOrder}
            className={styles.sortButton}
          >
            {sortOrder === 'desc' ? '降序' : '升序'}
          </Button>
        </div>
        <div className={styles.videoGrid}>
          {currentVideos.map((video, index) => (
            <div
              key={video.id}
              className={`${styles.videoCardWrapper} ${styles[`position${index + 1}`]}`}
            >
              <Card
                className={styles.videoCard}
                cover={
                  <div className={styles.videoContainer} onClick={() => handleVideoClick(video)}>
                    <video className={styles.video} src={video.video} />
                    <Button
                      className={styles.aiButton}
                      type="primary"
                      onClick={() => handleAIClick(video)}
                    >
                      AI总结
                    </Button>
                    <Popconfirm
                      title="确认删除"
                      description="确定要删除该视频吗？删除后无法恢复。"
                      onConfirm={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(video);
                      }}
                      onCancel={(e) => {
                        e.stopPropagation();
                        console.log('取消删除操作');
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        className={styles.deleteButton}
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      // onClick={(e) => handleDeleteClick(e, video)}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <div className={styles.titleContainer}>
                      <span className={styles.videoTitle}>{video.title}</span>
                      <span className={styles.videoDate}>{video.date}</span>
                    </div>
                  }
                />
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* 悬浮分页组件 */}
      <div className={styles.paginationContainer}>
        <Pagination
          current={currentPage}
          total={sortedVideos.length}
          pageSize={pageSize}
          onChange={handlePageChange}
          showQuickJumper={true}
          showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`}
          className={styles.pagination}
        />
      </div>

      <Modal
        open={selectedVideo !== null}
        footer={null}
        onCancel={handleClose}
        width="70%"
        centered
        className={styles.videoModal}
        closable={false}
        destroyOnClose
      >
        {selectedVideo && (
          <div className={styles.modalContent}>
            <video
              ref={videoRef}
              className={styles.modalVideo}
              src={selectedVideo.video}
              controls
              autoPlay
            />
            <div className={styles.videoControls}>
              <Button
                type="primary"
                icon={<FullscreenOutlined />}
                onClick={toggleFullscreen}
              >
                全屏
              </Button>
              <Button
                type="primary"
                danger
                icon={<CloseOutlined />}
                onClick={handleClose}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default connect(
  ({ videoSummary }) => ({
    videoDisplayData: videoSummary.videoDisplayData,
    total: videoSummary.total,
  }),
  (dispatch) => ({ dispatch })
)(VideoList);
