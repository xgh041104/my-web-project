import React from 'react';
import { Button, message } from 'antd';
import { history, useLocation } from 'umi';
import styles from './conclude.less';

const Conclude = (props) => {
  // 模拟视频总结数据

  const location = useLocation();
  const summary = location.state?.summary || {
    title: props.title,
    content: props.content,
  }

  console.log("进入了conclude")

  const handleBack = () => {
    window.history.back(-1);
  };

  const handleCopy = async () => {
    try {
      const contentToCopy = summary.content || '暂无总结内容';
      await navigator.clipboard.writeText(contentToCopy);
      message.success('复制成功');
    } catch (err) {
      message.error('复制失败，请重试');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.videoTitle}>{summary.title}</h2>
        <div className={styles.summaryText}>
          {summary.content ? summary.content.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          )) : <p>暂无总结内容</p>}
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <Button size="large" onClick={handleBack}>
          <strong>返回</strong>
        </Button>
        <Button type="primary" size="large" onClick={handleCopy}>
          <strong>复制内容</strong>
        </Button>
      </div>
    </div>
  );
};

export default Conclude;