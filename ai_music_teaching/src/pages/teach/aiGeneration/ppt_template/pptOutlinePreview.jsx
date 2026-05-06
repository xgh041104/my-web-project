import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './markdownRenderer_ppt';
import { useHistory } from 'umi';
import { message, Spin, notification, Modal, Input, Button } from 'antd';
import { useDispatch, useSelector } from 'umi';
import styles from './pptOutlinePreview.less';

const PptOutlinePreview = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  // 从Redux store获取数据
  const { apiToken, taskId, editingOutline } = useSelector(state => state.generation);
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modifyRequirement, setModifyRequirement] = useState('');


  // 默认的Markdown内容
  const defaultMarkdown = `# ppt大纲未生成成功
## 可能原因：
1. 主题不明确或过于宽泛
2. 网络连接问题
3. API服务暂时不可用

请尝试：
- 点击"修改大纲要求"提供更具体的主题描述
- 检查网络连接后重新生成
- 稍后再试`;

  // 初始化大纲内容
  useEffect(() => {
    if (editingOutline) {
      try {
        // 尝试解析大纲内容
        const parsedOutline = JSON.parse(editingOutline);
        if (parsedOutline && parsedOutline.data && parsedOutline.data.text) {
          setMarkdownContent(parsedOutline.data.text);
          notification.success({
            message: '大纲加载成功',
            description: '已成功加载生成的大纲内容',
            duration: 2,
          });
        } else {
          setMarkdownContent(defaultMarkdown);
          notification.warning({
            message: '大纲格式异常',
            description: '大纲内容格式不符合预期，已使用默认内容',
            duration: 3,
          });
        }
      } catch (e) {
        // 如果解析失败，直接使用原始内容
        setMarkdownContent(editingOutline);
        notification.info({
          message: '大纲已加载',
          description: '大纲内容已直接显示',
          duration: 2,
        });
      }
    } else {
      setMarkdownContent(defaultMarkdown);
      notification.warning({
        message: '未获取到大纲数据',
        description: '正在使用默认内容，您可以尝试重新生成',
        duration: 3,
      });
    }
  }, [editingOutline]);

  // 重新生成大纲内容
  const regenerateOutline = async (userPrompt) => {
    if (!apiToken || !taskId) {
      message.error('API信息未就绪，无法重新生成');
      return;
    }

    if (!userPrompt.trim()) {
      message.warning('请输入修改要求');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        id: taskId,
        stream: false,
        question: userPrompt,
        markdown: markdownContent  // 当前大纲内容
      };

      const response = await fetch('https://open.docmee.cn/api/ppt/v2/updateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      // 解析API响应
      let newContent = '';
      if (responseData && responseData.data && responseData.data.text) {
        newContent = responseData.data.text;
      } else if (responseData && responseData.text) {
        newContent = responseData.text;
      } else {
        newContent = JSON.stringify(responseData);
      }

      setMarkdownContent(newContent);

      // 更新Redux中的大纲数据
      dispatch({
        type: 'generation/updateEditingOutline',
        payload: newContent
      });

      message.success('大纲已更新');
    } catch (error) {
      console.error('更新失败:', error);
      notification.error({
        message: '大纲更新失败',
        description: error.message || '请检查网络连接后重试',
        duration: 3,
      });

      // 出错时保留原始内容
      setMarkdownContent(editingOutline || defaultMarkdown);
    } finally {
      setLoading(false);
    }
  };

  // 渲染加载状态
  const renderLoading = () => (
    <div className={styles.spinOverlay}>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Spin size="large" />
        <p style={{ marginLeft: 12, fontSize: 16, marginTop: '0.2rem', color: '#4ca9ff', fontWeight: '700' }}>
          正在生成教案，请稍候...
        </p>
        <p style={{ marginTop: '0.1rem', color: '#999', fontSize: 14 }}>
          这通常需要10-30秒，请耐心等待
        </p>
      </div>
    </div>
  );

  // 打开模态框
  const showModal = () => {
    setIsModalOpen(true);
  };

  // 处理模态框确定按钮
  const handleOk = () => {
    if (!modifyRequirement.trim()) {
      message.warning('请输入修改要求');
      return;
    }

    setIsModalOpen(false);
    message.success('反馈已提交，正在重新生成大纲...');
    regenerateOutline(modifyRequirement);
    setModifyRequirement(''); // 清空输入框
  };

  // 处理模态框取消按钮
  const handleCancel = () => {
    setIsModalOpen(false);
    setModifyRequirement(''); // 清空输入框
  };

  // 输入处理函数
  const handleInputChange = (e) => {
    setModifyRequirement(e.target.value);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>PPT大纲预览</h1>
        <div>
          <Button
            type="primary"
            onClick={showModal}
            disabled={loading}
            className={styles.modifyButton}PPT
          >
            修改大纲要求
          </Button>

          {/* 模态框组件 */}
          <Modal
            title="修改大纲要求"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="提交修改"
            cancelText="取消"
            confirmLoading={loading} // 提交时显示加载状态
          >
            <Input.TextArea
              placeholder="请输入修改要求，例如：增加更多互动环节、简化专业术语、添加案例分析..."
              value={modifyRequirement}
              onChange={handleInputChange}
              autoSize={{ minRows: 4, maxRows: 8 }}
              showCount
              maxLength={500}
              allowClear
            />
          </Modal>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.contentWrapper}>
          <div className={styles.markdownContainer}>
            <MarkdownRenderer content={markdownContent} />
          </div>

          {loading && renderLoading()}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.navButton} ${styles.backButton}`}
            onClick={() => history.push({
              pathname: `/teach/aiGeneration`
            })}
            disabled={loading}
          >
            上一步
          </button>
          {/* 改成跳转到ppt */}
          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={() => history.push({
              pathname: './pptTemplate',
              state: {
                outlineContent: markdownContent,
                apiToken: apiToken,
                taskId: taskId
              }
            })}
            disabled={loading}
          >
            选择模板
          </button>
        </div>

      </footer>
    </div>
  );
};

export default PptOutlinePreview;