import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './markdownRenderer_ppt';
import { useHistory } from 'umi';
import { message, Spin, notification, Button, Modal, Input } from 'antd';
import { useDispatch, useSelector } from 'umi';
import styles from './lessonOutlinePreview.less';

const LessonOutlinePreview = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  // 从Redux store获取数据
  const { apiToken, taskId, editingOutline } = useSelector(state => state.generation);
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modifyRequirement, setModifyRequirement] = useState('');

  // 默认的Markdown内容
  const defaultMarkdown = `# 大纲未生成成功
## 可能原因：
1. 主题不明确或过于宽泛
2. 网络连接问题
3. API服务暂时不可用

请尝试：
- 点击"修改大纲要求"提供更具体的主题描述
- 检查网络连接后重新生成
- 稍后再试`;

  // 解析大纲内容
  const parseOutline = (content) => {
    if (!content) return defaultMarkdown;

    try {
      // 尝试解析JSON格式
      const parsed = JSON.parse(content);

      // 检查是否是第一次API调用的格式
      if (parsed?.data?.text) {
        return parsed.data.text;
      }

      // 检查是否是第二次API调用的教案格式
      if (typeof parsed === 'string') {
        return parsed;
      }

      // 都不匹配则返回原始内容
      return content;
    } catch (e) {
      // 解析失败，直接返回内容（可能是纯Markdown）
      return content;
    }
  };

  // 初始化大纲内容
  useEffect(() => {
    const content = parseOutline(editingOutline);
    setMarkdownContent(content);

    if (!editingOutline) {
      notification.warning({
        message: '未获取到大纲数据',
        description: '正在使用默认内容，您可以尝试重新生成',
        duration: 3,
      });
    }
  }, [editingOutline]); // 依赖editingOutline以便在内容更新时重新渲染

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
      // 调用Dva model中的updateContent effect
      const newContent = await dispatch({
        type: 'generation/updateContent',
        payload: {
          question: userPrompt,
          markdown: markdownContent
        }
      });

      // 直接更新Markdown内容（确保格式正确）
      const parsedContent = parseOutline(newContent);
      setMarkdownContent(parsedContent);

      // 同时更新Redux中的大纲数据
      dispatch({
        type: 'generation/updateEditingOutline',
        payload: parsedContent
      });

      message.success('大纲已更新');
    } catch (error) {
      console.error('更新失败:', error);
      notification.error({
        message: '大纲更新失败',
        description: error.message || '请检查网络连接后重试',
        duration: 3,
      });
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

  const prefix = '/teach/aiGeneration';

  const handleOk = () => {
    if (!modifyRequirement.trim()) {
      message.warning('请输入修改要求');
      return;
    }

    setIsModalOpen(false);
    message.success('反馈已提交，正在重新生成大纲...');
    regenerateOutline(modifyRequirement);
    setModifyRequirement('');
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setModifyRequirement('');
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setModifyRequirement(e.target.value);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>教学大纲预览</h1>
        <div>
          <Button
            type="primary"
            onClick={showModal}
            disabled={loading}
            className={styles.modifyButton}
          >
            修改大纲要求
          </Button>
          <Modal
            title="修改大纲要求"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="提交修改"
            cancelText="取消"
            confirmLoading={loading}
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
            onClick={() => history.push({ pathname: prefix })}
            disabled={loading}
          >
            上一步
          </button>
          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={() => history.push({
              pathname: `${prefix}/lessonPlanPreviewPage`,
              state: { outlineContent: markdownContent }
            })}
            disabled={loading}
          >
            下一步
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LessonOutlinePreview;