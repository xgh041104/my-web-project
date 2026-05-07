import mammoth from 'mammoth';

export const parseWordExam = async (file) => {
  console.log("开始全局扫描解析 Word 文件:", file.name);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  console.log("成功提取文本，总字数:", text.length);

  const sectionTypeMap = {
    '单项选择题': 1,
    '多项选择题': 2,
    '判断题': 3,
    '填空题': 4,
    '实操题': 5
  };

  // 1. 提取所有答案
  const answerMap = { 'A': new Map(), 'B': new Map() };
  const answerSections = text.split(/（?[AB]）?标准答案/);
  if (answerSections.length > 1) {
    for (let i = 1; i < answerSections.length; i++) {
        const paperChar = text.match(new RegExp(`（?([AB])）?标准答案`))?.[1] || (i === 1 ? 'A' : 'B');
        const sectionText = answerSections[i].split(/（?[AB]）?标准答案/)[0];
        const ansRegex = /(\d+)[.．、]\s*([^ \s\n]+(?: [^ \s\n]+)*)/g;
        let m;
        while ((m = ansRegex.exec(sectionText)) !== null) {
            answerMap[paperChar].set(parseInt(m[1]), m[2].trim());
        }
    }
  }
  console.log("答案提取完成: A卷", answerMap.A.size, "个, B卷", answerMap.B.size, "个");

  // 2. 提取所有题目
  const questions = [];
  // 将文本按试卷拆分
  const paperParts = text.split(/（?([AB])卷）|试卷\s*（([AB])）/);
  // 注意：split 带捕获括号会保留分隔符。我们要手动处理。
  
  // 简单起见，我们直接在整个题目区搜索
  const questionsOnlyText = answerSections[0];
  
  // 识别题型分段
  const sections = [];
  let lastIdx = 0;
  const sectionRegex = new RegExp(Object.keys(sectionTypeMap).join('|'), 'g');
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(questionsOnlyText)) !== null) {
      sections.push({
          type: sectionTypeMap[sectionMatch[0]],
          start: sectionMatch.index,
          name: sectionMatch[0]
      });
  }
  
  for (let i = 0; i < sections.length; i++) {
      const currentSection = sections[i];
      const nextSectionStart = sections[i+1]?.start || questionsOnlyText.length;
      const sectionContent = questionsOnlyText.substring(currentSection.start, nextSectionStart);
      
      // 判断当前段落属于哪个试卷 (看这段文字之前最近的试卷标记)
      const textBefore = questionsOnlyText.substring(0, currentSection.start);
      const paperMatch = textBefore.match(/（?([AB])卷）|试卷\s*（([AB])）/g);
      const currentPaper = paperMatch ? (paperMatch[paperMatch.length-1].includes('B') ? 'B' : 'A') : 'A';

      // 在段落内搜索题目: 数字开头 + 点/顿号
      const qRegex = /(\d+)[.．、]\s*([^]*?)(?=\d+[.．、]|$)/g;
      let qm;
      while ((qm = qRegex.exec(sectionContent)) !== null) {
          const qNum = parseInt(qm[1]);
          let fullContent = qm[2].trim();
          
          // 提取难度
          let degree = 1;
          const dMatch = fullContent.match(/难度\s*(\d+)/);
          if (dMatch) {
              degree = parseInt(dMatch[1]);
              fullContent = fullContent.replace(/难度\s*(\d+)/, '').trim();
          }

          // 分离题干和选项
          // 选项通常以 A. B. C. D. 开头
          let qName = fullContent;
          const qOptions = [];
          const optRegex = /([A-Z])[.．、\s]\s*([^A-Z \s\n]+(?: [^A-Z \s\n]+)*)/g;
          let om;
          const firstOptIdx = fullContent.search(/[A-Z][.．、\s]/);
          if (firstOptIdx !== -1) {
              qName = fullContent.substring(0, firstOptIdx).trim();
              while ((om = optRegex.exec(fullContent)) !== null) {
                  qOptions.push(om[2].trim());
              }
          }

          qName = qName.replace(/（\s*）/g, '').replace(/\(\s*\)/g, '').replace(/_{2,}/g, '').trim();
          
          // 过滤掉太短的（可能是误匹配）
          if (qName.length < 2 && qOptions.length === 0) continue;

          questions.push({
            id: `word_${currentPaper}_${qNum}_${Math.random().toString(36).substr(2, 5)}`,
            QuestionName: `[${currentPaper}卷] ${qName}`,
            QuestionType: currentSection.type,
            Digree: degree,
            QuestionContent: qOptions,
            Answer: answerMap[currentPaper].get(qNum) || '',
            QuestionPoolId: 1,
            Status: 0
          });
      }
  }

  console.log("解析结束，成功提取题目数:", questions.length);

  // 3. 答案格式转换
  questions.forEach(q => {
    if (!q.Answer) return;
    if (q.QuestionType === 1) {
      const letter = q.Answer.toUpperCase().charAt(0);
      if (letter >= 'A' && letter <= 'Z') {
        q.Answer = String(letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1);
      }
    } else if (q.QuestionType === 2) {
      const letters = q.Answer.toUpperCase().split(/[\s,，、]+/);
      const indices = letters.map(l => {
        const char = l.charAt(0);
        if (char >= 'A' && char <= 'Z') return String(char.charCodeAt(0) - 'A'.charCodeAt(0) + 1);
        return null;
      }).filter(i => i !== null);
      q.Answer = JSON.stringify(indices);
    } else if (q.QuestionType === 3) {
      if (q.Answer.includes('√') || q.Answer.includes('正确') || q.Answer.includes('对')) q.Answer = '1';
      else if (q.Answer.includes('×') || q.Answer.includes('错误') || q.Answer.includes('错')) q.Answer = '0';
    } else if (q.QuestionType === 4) {
        const blanks = q.Answer.split(/[；;]/).map(b => b.trim());
        q.Answer = JSON.stringify(blanks);
    }
  });

  return questions;
};
