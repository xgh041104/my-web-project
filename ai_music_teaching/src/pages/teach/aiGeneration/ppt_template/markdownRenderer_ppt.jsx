import React from 'react';
import MarkdownRenderer from './markdownRenderer_ppt';

// LaTeX 到纯文本的转换工具函数
function convertLatexToText(text) {
  return text
    .replace(/\$(.*?)\$/g, (match, p1) => {
      return p1
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\frac{(\d+)}{(\d+)}/g, '$1/$2')
        .replace(/\\pi/g, 'π')
        .replace(/\\sqrt{(\d+)}/g, '√$1')
        .replace(/\\pm/g, '±')
        .replace(/\\degree/g, '°')
    })
    .replace(/\\$(.+?)\\$/g, '$1')
    .replace(/\\$$(.+?)\\$$/g, '$1')
    .replace(/---/g, '');
}

const Markdown = ({ content }) => {
  if (!content) return null;

  // 处理纯文本和LaTeX转换
  const parsePlainText = (text) => {
    return convertLatexToText(text)
      .replace(/---/g, '')
      .replace(/(\d)\s*-\s*(\d)/g, '$1 - $2');
  };

  // 处理加粗文本
  const parseBoldText = (text) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    const parts = [];
    let match;
    let keyIndex = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parsePlainText(text.substring(lastIndex, match.index)));
      }
      parts.push(<strong key={`bold-${keyIndex++}`}>{parsePlainText(match[1])}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(parsePlainText(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [parsePlainText(text)];
  };

  // 处理斜体文本
  const parseItalicText = (text) => {
    const italicRegex = /_(.*?)_/g;
    let lastIndex = 0;
    const parts = [];
    let match;
    let keyIndex = 0;

    while ((match = italicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parseBoldText(text.substring(lastIndex, match.index)));
      }
      parts.push(<em key={`italic-${keyIndex++}`}>{parseBoldText(match[1])}</em>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(parseBoldText(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [parseBoldText(text)];
  };

  // 处理内联代码
  const parseInlineCode = (text) => {
    const codeRegex = /`(.*?)`/g;
    let lastIndex = 0;
    const parts = [];
    let match;
    let keyIndex = 0;

    while ((match = codeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parseItalicText(text.substring(lastIndex, match.index)));
      }
      parts.push(<code key={`code-${keyIndex++}`} className="inline-code">{match[1]}</code>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(parseItalicText(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [parseItalicText(text)];
  };

  // 处理链接
  const parseLinks = (text) => {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    let lastIndex = 0;
    const parts = [];
    let match;
    let keyIndex = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parseInlineCode(text.substring(lastIndex, match.index)));
      }
      parts.push(
        <a key={`link-${keyIndex++}`} href={match[2]} target="_blank" rel="noopener noreferrer">
          {parseInlineCode(match[1])}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(parseInlineCode(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [parseInlineCode(text)];
  };

  // 解析文本行
  const parseLine = (line) => {
    return parseLinks(line);
  };

  // 解析Markdown内容
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeContent = [];
  const elements = [];
  let listItems = [];
  let isInList = false;
  let listType = 'ul'; // 'ul' 或 'ol'

  lines.forEach((line, index) => {
    // 处理代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="code-block">
            <code>{codeContent.join('\n')}</code>
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

    // 处理标题
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      if (isInList && listItems.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${index}`} className="markdown-list">
            {listItems}
          </ListTag>
        );
        listItems = [];
        isInList = false;
      }

      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const HeadingTag = `h${level}`;

      elements.push(
        <HeadingTag key={`h-${index}`} className="markdown-heading">
          {parseLine(text)}
        </HeadingTag>
      );
      return;
    }

    // 处理列表项
    const listItemMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (listItemMatch) {
      const indent = listItemMatch[1].length;
      const marker = listItemMatch[2];
      const text = listItemMatch[3];
      const currentListType = /^\d+\.$/.test(marker) ? 'ol' : 'ul';

      if (!isInList) {
        isInList = true;
        listType = currentListType;
      } else if (listType !== currentListType) {
        // 列表类型改变，结束当前列表
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${index}`} className="markdown-list">
            {listItems}
          </ListTag>
        );
        listItems = [];
        listType = currentListType;
      }

      listItems.push(
        <li key={`li-${index}`} className={`list-item indent-${Math.floor(indent / 2)}`}>
          {parseLine(text)}
        </li>
      );
      return;
    }

    // 处理空行
    if (line.trim() === '') {
      if (isInList && listItems.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${index}`} className="markdown-list">
            {listItems}
          </ListTag>
        );
        listItems = [];
        isInList = false;
      }
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    // 处理引用块
    const blockquoteMatch = line.match(/^>\s+(.*)/);
    if (blockquoteMatch) {
      const text = blockquoteMatch[1];
      elements.push(
        <blockquote key={`blockquote-${index}`} className="markdown-blockquote">
          {parseLine(text)}
        </blockquote>
      );
      return;
    }

    // 处理分隔线
    if (line.match(/^[-*]{3,}$/)) {
      elements.push(<hr key={`hr-${index}`} className="markdown-hr" />);
      return;
    }

    // 结束列表
    if (isInList && listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag key={`list-${index}`} className="markdown-list">
          {listItems}
        </ListTag>
      );
      listItems = [];
      isInList = false;
    }

    // 处理普通段落
    elements.push(
      <p key={`p-${index}`} className="markdown-paragraph">
        {parseLine(line)}
      </p>
    );
  });

  // 处理最后的代码块
  if (inCodeBlock && codeContent.length > 0) {
    elements.push(
      <pre key="code-last" className="code-block">
        <code>{codeContent.join('\n')}</code>
      </pre>
    );
  }

  // 处理最后的列表
  if (isInList && listItems.length > 0) {
    const ListTag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <ListTag key="list-last" className="markdown-list">
        {listItems}
      </ListTag>
    );
  }

  return <div className="markdown-container">{elements}</div>;
};

export default Markdown;