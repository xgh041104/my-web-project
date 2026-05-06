import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './markdownRenderer_ppt';
import { saveToWord } from './docxUtils';
import { useHistory, history, useLocation } from 'umi';
import { message } from 'antd';
import styles from './lessonPlanPreviewPage.less'; // 使用CSS模块

// 示例内容常量
const sampleContent = `
# 示例教案

## 课程信息
- **课程名称**: 数学基础
- **授课教师**: 张老师
- **班级**: 三年级一班

## 教学目标
1. 理解加法和减法的基本概念
2. 掌握20以内的加减法运算
3. 培养逻辑思维能力

## 教学重点
- 加法和减法的运算规则
- 进位和退位的理解

## 教学过程
1. **导入** (5分钟)
   - 复习数字0-20
   - 通过日常生活中的例子引入加减法概念

2. **新课讲解** (15分钟)
   - 讲解加法运算规则
   - 讲解减法运算规则
   - 演示进位和退位的计算方法

3. **课堂练习** (15分钟)
   - 学生完成练习册第25页习题
   - 教师巡视指导

4. **总结与作业** (5分钟)
   - 总结本课重点内容
   - 布置家庭作业：练习册第26页

## 教学反思
- 学生参与度较高
- 进位概念需要更多练习巩固
`;

function LessonPlanPreviewPage() {
  const location = useLocation();
  const routeData = location.state || {};
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 优先使用从路由传递过来的大纲内容
    if (routeData.outlineContent) {
      setContent(routeData.outlineContent);
      setIsLoading(false);
    } else {
      // 没有传递数据时使用示例内容
      message.warning('未获取到教案数据，正在使用示例内容');
      const timer = setTimeout(() => {
        setContent(sampleContent);
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDownload = () => {
    saveToWord(content);
  };

  const prefix = '/teach/aiGeneration'

  const handleBack = () => {
    // 返回时携带当前内容，以便返回后可以再次编辑
    history.push({
      pathname: `${prefix}/lessonOutlinePreview`,
      state: { parentData: content }
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>预览教案</h1>
      </header>
      <main className={styles.content}>
        <div className={styles.markdownContainer}>
          {isLoading ? (
            <div className={styles.loadingPlaceholder}>
              <div className={styles.spinner}></div>
              <p>正在加载教案内容...</p>
            </div>
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
      </main>
      <div className={styles.footer}>
        <div className={styles.buttonGroup}>
          <button
            onClick={handleBack}
            className={styles.navButton}
            style={{
              background: 'white',
              color: '#1890ff',
              border: '1px solid #1890ff',
            }}
          >
            返回
          </button>
          <button
            onClick={handleDownload}
            className={styles.navButton}
            disabled={isLoading}
            style={{
              background: isLoading ? '#ccc' : '#1890ff',
            }}
          >
            {isLoading ? '生成中...' : '下载Word'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LessonPlanPreviewPage;