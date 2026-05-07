import mammoth from 'mammoth';

export const parseWordExam = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  
  // Mapping of section names to types
  const sectionTypeMap = {
    '单项选择题': 1,
    '多项选择题': 2,
    '判断题': 3,
    '填空题': 4,
    '实操题': 5
  };

  // Split text into questions and answers sections
  // Using a more flexible regex for splitting
  const answerStartIdx = text.search(/（?[AB]）?标准答案/);
  const questionsText = answerStartIdx !== -1 ? text.substring(0, answerStartIdx) : text;
  const answersText = answerStartIdx !== -1 ? text.substring(answerStartIdx) : '';

  const qLines = questionsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const aLines = answersText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const answerMap = { 'A': new Map(), 'B': new Map() };
  let currentPaperForAnswers = 'A';

  // Extract answers
  for (const line of aLines) {
    if (line.includes('A）标准答案') || line.includes('A卷答案')) {
      currentPaperForAnswers = 'A';
      continue;
    }
    if (line.includes('B）标准答案') || line.includes('B卷答案')) {
      currentPaperForAnswers = 'B';
      continue;
    }
    
    // Match answers like "1.A 2. B" or "16.√" or "26.四分音符"
    const regex = /(\d+)[.．、]\s*([^ \s]+(?: [^ \s]+)*)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const num = parseInt(match[1]);
      const ans = match[2].trim();
      answerMap[currentPaperForAnswers].set(num, ans);
    }
  }

  const questions = [];
  let currentPaper = 'A';
  let questionType = 1;
  let lastQuestion = null;

  // Extract questions
  for (const line of qLines) {
    // Check for paper title
    if (line.includes('（A卷）') || line.includes('试卷（A）')) { 
      currentPaper = 'A'; 
      continue; 
    }
    if (line.includes('（B卷）') || line.includes('试卷（B）')) { 
      currentPaper = 'B'; 
      continue; 
    }

    // Check for section
    let foundSection = false;
    for (const sectionName in sectionTypeMap) {
      if (line.includes(sectionName)) {
        questionType = sectionTypeMap[sectionName];
        foundSection = true;
        break;
      }
    }
    if (foundSection) continue;

    // Match question: "1. XXX" (allow optional leading punctuation/spaces)
    const qMatch = line.match(/^(\d+)[.．、]\s*(.*)/);
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

      // Cleanup question text
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
      continue;
    }

    // Match options
    if (lastQuestion && (lastQuestion.QuestionType === 1 || lastQuestion.QuestionType === 2)) {
      // Look for A. B. C. D. in the line
      const optionsRegex = /([A-Z])[.．、]\s*([^A-Z \s]+(?: [^A-Z \s]+)*)/g;
      let oMatch;
      let foundOption = false;
      while ((oMatch = optionsRegex.exec(line)) !== null) {
        lastQuestion.QuestionContent.push(oMatch[2].trim());
        foundOption = true;
      }
      if (foundOption) continue;
    }
  }

  // Post-process answers to match application format
  questions.forEach(q => {
    if (!q.Answer) return;

    if (q.QuestionType === 1) { // Single choice: convert "A" to index (0-based for logic, but UI shows 1-based)
      // Note: your application logic seems to expect "0" for index 0 (Option A)
      const letter = q.Answer.toUpperCase();
      if (letter >= 'A' && letter <= 'Z') {
        q.Answer = String(letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1);
      }
    } else if (q.QuestionType === 2) { // Multiple choice: "A B D" -> ["1", "2", "4"]
      const letters = q.Answer.toUpperCase().split(/[\s,，、]+/);
      const indices = letters.map(l => {
        if (l >= 'A' && l <= 'Z') return String(l.charCodeAt(0) - 'A'.charCodeAt(0) + 1);
        return null;
      }).filter(i => i !== null);
      q.Answer = JSON.stringify(indices);
    } else if (q.QuestionType === 3) { // True/False: "√" -> 1, "×" -> 0
      if (q.Answer === '√' || q.Answer === '正确' || q.Answer === '对') q.Answer = '1';
      else if (q.Answer === '×' || q.Answer === '错误' || q.Answer === '错') q.Answer = '0';
    } else if (q.QuestionType === 4) { // Fill in blanks: "A; B" -> ["A", "B"]
        const blanks = q.Answer.split(/[；;]/).map(b => b.trim());
        q.Answer = JSON.stringify(blanks);
    }
  });

  return questions;
};
