import mammoth from 'mammoth';

export const parseWordExam = async (file) => {
  console.log("开始解析 Word 文件:", file.name);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  console.log("成功提取文本，字数:", text.length);

  // Mapping of section names to types
  const sectionTypeMap = {
    '单项选择题': 1,
    '多项选择题': 2,
    '判断题': 3,
    '填空题': 4,
    '实操题': 5
  };

  // Split text into questions and answers sections
  const answerStartIdx = text.search(/（?[AB]）?标准答案/);
  const questionsText = answerStartIdx !== -1 ? text.substring(0, answerStartIdx) : text;
  const answersText = answerStartIdx !== -1 ? text.substring(answerStartIdx) : '';
  console.log("拆分题目区字数:", questionsText.length, "答案区字数:", answersText.length);

  const qLines = questionsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const aLines = answersText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log("有效行数:", qLines.length);

  const answerMap = { 'A': new Map(), 'B': new Map() };
  let currentPaperForAnswers = 'A';

  // Extract answers
  for (const line of aLines) {
    if (line.includes('A）标准答案') || line.includes('A卷答案') || line.includes('试卷（A）')) {
      currentPaperForAnswers = 'A';
      continue;
    }
    if (line.includes('B）标准答案') || line.includes('B卷答案') || line.includes('试卷（B）')) {
      currentPaperForAnswers = 'B';
      continue;
    }
    
    // Match answers like "1.A 2. B"
    const regex = /(\d+)[.．、]\s*([^ \s]+(?: [^ \s]+)*)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const num = parseInt(match[1]);
      const ans = match[2].trim();
      answerMap[currentPaperForAnswers].set(num, ans);
    }
  }
  console.log("答案提取完成: A卷", answerMap.A.size, "个, B卷", answerMap.B.size, "个");

  const questions = [];
  let currentPaper = 'A';
  let questionType = 1;
  let lastQuestion = null;

  // Extract questions
  for (const line of qLines) {
    // Check for paper title
    if (line.includes('（A卷）') || (line.includes('试卷') && line.includes('A'))) { 
      currentPaper = 'A'; 
      console.log("切换到 A 卷模式");
      continue; 
    }
    if (line.includes('（B卷）') || (line.includes('试卷') && line.includes('B'))) { 
      currentPaper = 'B'; 
      console.log("切换到 B 卷模式");
      continue; 
    }

    // Check for section
    let foundSection = false;
    for (const sectionName in sectionTypeMap) {
      if (line.includes(sectionName)) {
        questionType = sectionTypeMap[sectionName];
        foundSection = true;
        console.log("切换题型为:", sectionName, "(", questionType, ")");
        break;
      }
    }
    if (foundSection) continue;

    // Match question: Allow leading spaces or punctuation
    const qMatch = line.match(/^(\d+)[.．、\s]\s*(.*)/) || line.match(/^\s*(\d+)[.．、\s]\s*(.*)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();
      
      // Extract difficulty
      let degree = 1;
      const dMatch = qText.match(/难度\s*(\d+)/);
      if (dMatch) {
        degree = parseInt(dMatch[1]);
        qText = qText.replace(/难度\s*(\d+)/, '').trim();
      }

      qText = qText.replace(/（\s*）/g, '').replace(/\(\s*\)/g, '').replace(/_{2,}/g, '').trim();

      const newQuestion = {
        id: `word_${currentPaper}_${qNum}_${Math.random().toString(36).substr(2, 5)}`,
        QuestionName: `[${currentPaper}卷] ${qText}`,
        QuestionType: questionType,
        Digree: degree,
        QuestionContent: [],
        Answer: answerMap[currentPaper].get(qNum) || '',
        QuestionPoolId: 1,
        Status: 0
      };
      
      questions.push(newQuestion);
      lastQuestion = newQuestion;
      console.log("匹配到题目:", qNum, qText.substring(0, 20));
      continue;
    }

    // Match options
    if (lastQuestion && (lastQuestion.QuestionType === 1 || lastQuestion.QuestionType === 2)) {
      // Look for A. B. C. D. 
      const optionsRegex = /([A-Z])[.．、\s]\s*([^A-Z \s\u2000-\u200F]+(?: [^A-Z \s\u2000-\u200F]+)*)/g;
      let oMatch;
      let foundOption = false;
      while ((oMatch = optionsRegex.exec(line)) !== null) {
        lastQuestion.QuestionContent.push(oMatch[2].trim());
        foundOption = true;
      }
      if (foundOption) {
          console.log("  匹配到选项:", lastQuestion.QuestionContent.slice(-1)[0]);
          continue;
      }
    }
  }

  console.log("解析结束，总题目数:", questions.length);

  // Post-process answers
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
