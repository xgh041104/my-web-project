import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { convertLatexToText } from './latexUtils';

// 处理粗体文本
export function processBoldText(text) {
  const parts = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(new TextRun({
        text: text.substring(lastIndex, match.index),
        font: "Microsoft YaHei",
        size: 22
      }));
    }

    parts.push(new TextRun({
      text: match[1],
      font: "Microsoft YaHei",
      size: 22,
      bold: true
    }));

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(new TextRun({
      text: text.substring(lastIndex),
      font: "Microsoft YaHei",
      size: 22
    }));
  }

  return parts.length > 0 ? parts : [new TextRun({
    text: text,
    font: "Microsoft YaHei",
    size: 22
  })];
}

// 保存为Word文档
export function saveToWord(content, baseFilename = "教案") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${baseFilename}_${timestamp}.docx`;

  const paragraphs = [];

  paragraphs.push(new Paragraph({
    text: "教案",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    bold: true,
    spacing: { after: 400 }
  }));

  const lines = content.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let codeContent = [];

  for (const line of lines) {
    let trimmedLine = line.trim();
    trimmedLine = convertLatexToText(trimmedLine);

    if (!trimmedLine && !inCodeBlock) continue;

    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        if (codeContent.length > 0) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: codeContent.join('\n'),
              font: "Consolas",
              size: 20,
              color: "#fff"
            })],
            spacing: { before: 100, after: 100 }
          }));
        }
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      const headerLevel = headerMatch[1].length;
      const headerText = headerMatch[2];
      const cleanText = headerText.replace(/\*\*/g, '');

      const headingLevels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6
      ];

      const level = Math.min(headerLevel - 1, 5);

      paragraphs.push(new Paragraph({
        text: cleanText,
        heading: headingLevels[level],
        bold: true,
        spacing: {
          before: level === 0 ? 300 : 200 - (level * 30),
          after: level === 0 ? 200 : 150 - (level * 20)
        }
      }));
      continue;
    }

    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.match(/^\d+\.\s/)) {
      if (!inList) inList = true;

      const listText = trimmedLine.replace(/^[-*]\s|^\d+\.\s/, '');
      const processedText = processBoldText(listText);

      paragraphs.push(new Paragraph({
        bullet: { level: 0 },
        children: processedText
      }));
      continue;
    }

    if (inList) inList = false;

    const processedText = processBoldText(trimmedLine);
    paragraphs.push(new Paragraph({
      children: processedText,
      spacing: { before: 100, after: 100 }
    }));
  }

  paragraphs.push(new Paragraph({ text: "" }));

  const doc = new Document({
    styles: {
      paragraphStyles: [{
        id: "Normal",
        name: "Normal",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Microsoft YaHei",
          size: 22
        },
        paragraph: {
          spacing: { line: 276 }
        }
      }]
    },
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, filename);
  });
}

