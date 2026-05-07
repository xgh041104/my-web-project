import React from 'react';
import { convertLatexToText } from './latexUtils';
import './markdownRenderer.css';

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // 改进的连字符处理函数，添加竖线删除功能
  const parsePlainText = (text) => {
    // 处理数字范围（保留连字符两侧空格）
    let processed = text.replace(/(\d+)\s*-\s*(\d+)/g, '$1 - $2');

    // 处理单词间的连字符（保留原样）
    processed = processed.replace(/(\w)-\s+(\w)/g, '$1-$2');

    // 将LaTeX转换为文本
    processed = convertLatexToText(processed);

    // 新增：删除所有竖线符号
    processed = processed.replace(/\|/g, '');

    return processed;
  };

  // 增强的加粗文本解析
  const parseBoldText = (text) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    const parts = [];
    let match;
    let keyIndex = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      // 处理加粗标记前的普通文本
      if (match.index > lastIndex) {
        const plain = text.substring(lastIndex, match.index);
        parts.push(parsePlainText(plain));
      }

      // 处理加粗内容本身（确保连字符也被处理）
      parts.push(
        <strong key={`bold-${keyIndex++}`}>
          {parsePlainText(match[1])}
        </strong>
      );

      lastIndex = match.index + match[0].length;
    }

    // 处理剩余文本
    if (lastIndex < text.length) {
      parts.push(parsePlainText(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [parsePlainText(text)];
  };

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeContent = [];
  const elements = [];
  let listItems = [];
  let isInList = false;
  let listType = null; // 追踪列表类型（ul/ol）

  lines.forEach((line, index) => {
    // 跳过空行
    if (line.trim() === '' && !inCodeBlock) {
      if (isInList && listItems.length > 0) {
        elements.push(
          listType === 'ol'
            ? <ol key={`list-${index}`} className="markdown-list">{listItems}</ol>
            : <ul key={`list-${index}`} className="markdown-list">{listItems}</ul>
        );
        listItems = [];
        isInList = false;
        listType = null;
      }
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    // 代码块处理
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="code-block">
            {codeContent.join('\n')}
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    // 增强的水平线检测（避免误判）
    if (/^\s*---+\s*$/.test(line) && line.length >= 3) {
      if (isInList && listItems.length > 0) {
        elements.push(
          listType === 'ol'
            ? <ol key={`list-${index}`} className="markdown-list">{listItems}</ol>
            : <ul key={`list-${index}`} className="markdown-list">{listItems}</ul>
        );
        listItems = [];
        isInList = false;
        listType = null;
      }
      elements.push(<hr key={`hr-${index}`} className="markdown-hr" />);
      return;
    }

    // 标题检测
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      if (isInList) {
        elements.push(
          listType === 'ol'
            ? <ol key={`list-${index}`} className="markdown-list">{listItems}</ol>
            : <ul key={`list-${index}`} className="markdown-list">{listItems}</ul>
        );
        listItems = [];
        isInList = false;
        listType = null;
      }

      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const HeadingTag = `h${level}`;

      elements.push(
        <HeadingTag key={`h-${index}`} className="markdown-heading">
          {parseBoldText(text)}
        </HeadingTag>
      );
      return;
    }

    // 增强的列表项检测
    const listItemMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (listItemMatch) {
      const [, indent, marker, text] = listItemMatch;
      const currentListType = /^\d+\.$/.test(marker) ? 'ol' : 'ul';

      // 如果列表类型变化或首次检测到列表
      if (!isInList || currentListType !== listType) {
        if (isInList && listItems.length > 0) {
          elements.push(
            listType === 'ol'
              ? <ol key={`list-${index}`} className="markdown-list">{listItems}</ol>
              : <ul key={`list-${index}`} className="markdown-list">{listItems}</ul>
          );
          listItems = [];
        }
        listType = currentListType;
        isInList = true;
      }

      listItems.push(
        <li key={`li-${index}`} style={{ marginLeft: `${indent.length * 15}px` }}>
          {parseBoldText(text)}
        </li>
      );
      return;
    }

    // 处理段落中的连字符
    if (isInList && listItems.length > 0) {
      elements.push(
        listType === 'ol'
          ? <ol key={`list-${index}`} className="markdown-list">{listItems}</ol>
          : <ul key={`list-${index}`} className="markdown-list">{listItems}</ul>
      );
      listItems = [];
      isInList = false;
      listType = null;
    }

    // 处理普通段落（确保连字符被正确处理）
    elements.push(
      <p key={`p-${index}`} className="markdown-paragraph">
        {parseBoldText(line)}
      </p>
    );
  });

  // 处理结束时的未闭合块
  if (inCodeBlock && codeContent.length > 0) {
    elements.push(
      <pre key="code-last" className="code-block">
        {codeContent.join('\n')}
      </pre>
    );
  }

  if (isInList && listItems.length > 0) {
    elements.push(
      listType === 'ol'
        ? <ol key="list-last" className="markdown-list">{listItems}</ol>
        : <ul key="list-last" className="markdown-list">{listItems}</ul>
    );
  }

  return <div className="markdown-content">{elements}</div>;
};

export default MarkdownRenderer;