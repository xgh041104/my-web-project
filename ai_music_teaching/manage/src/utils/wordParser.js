import mammoth from 'mammoth';

export const parseWordExam = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const questions = [];
  let currentPaper = '';
  let currentSection = '';
  let questionType = 1; // Default to single choice
  
  // Mapping of section names to types
  const sectionTypeMap = {
    '单项选择题': 1,
    '多项选择题': 2,
    '判断题': 3,
    '填空题': 4,
    '实操题': 5
  };

  const answerMap = { 'A': new Map(), 'B': new Map() };
  let currentPaperForAnswers = 'A';

  // First pass: extract answers
  let inAnswerSection = false;
  for (let line of lines) {
    if (line.includes('（A）标准答案')) {
      inAnswerSection = true;
      currentPaperForAnswers = 'A';
      continue;
    }
    if (line.includes('（B）标准答案')) {
      inAnswerSection = true;
      currentPaperForAnswers = 'B';
      continue;
    }
    if (inAnswerSection) {
      // Parse answers like "1.A 2. B" or "16.√" or "26.四分音符"
      // Match "1.A" or "1. A" or "1、A"
      const parts = line.split(/[ \s]+(?=\d+[.．、])/);
      if (parts.length === 1 && !line.match(/^\d+[.．、]/)) {
          // Maybe answers are space-separated without numbering? 
          // No, the Word text showed "1.A 2. B"
      }
      
      const regex = /(\d+)[.．、]\s*([^ \s]+(?: [^ \s]+)*)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const num = parseInt(match[1]);
        const ans = match[2].trim();
        answerMap[currentPaperForAnswers].set(num, ans);
      }
    }
  }

  // Second pass: extract questions
  inAnswerSection = false;
  let lastQuestion = null;
  currentPaper = 'A'; // Reset

  for (let line of lines) {
    if (line.includes('标准答案')) {
      inAnswerSection = true;
      continue;
    }
    if (inAnswerSection) continue;

    // Check for paper title
    if (line.includes('（A卷）')) { currentPaper = 'A'; continue; }
    if (line.includes('（B卷）')) { currentPaper = 'B'; continue; }

    // Check for section
    let foundSection = false;
    for (let sectionName in sectionTypeMap) {
      if (line.includes(sectionName)) {
        currentSection = sectionName;
        questionType = sectionTypeMap[sectionName];
        foundSection = true;
        break;
      }
    }
    if (foundSection) continue;

    // Check for question: "1. XXX", "2. XXX", etc.
    const qMatch = line.match(/^(\d+)[.．、]\s*(.*)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();
      
      // Extract difficulty if present: "难度 1"
      let degree = 1;
      const dMatch = qText.match(/难度\s*(\d+)/);
      if (dMatch) {
        degree = parseInt(dMatch[1]);
        qText = qText.replace(/难度\s*(\d+)/, '').trim();
      }

      // Remove "( )" or "（ ）" or "____" from question name
      qText = qText.replace(/（\s*）/g, '').replace(/\(\s*\)/g, '').replace(/_{2,}/g, '').trim();

      const newQuestion = {
        id: `word_${currentPaper}_${qNum}`,
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

    // Check for options: "A. XXX", "B. XXX", etc.
    if (lastQuestion && (lastQuestion.QuestionType === 1 || lastQuestion.QuestionType === 2)) {
      const options = line.split(/[ \s]+(?=[A-Z][.．、])/);
      let foundOption = false;
      for (let opt of options) {
        const oMatch = opt.match(/^([A-Z])[.．、](.*)/);
        if (oMatch) {
          lastQuestion.QuestionContent.push(oMatch[2].trim());
          foundOption = true;
        }
      }
      if (foundOption) continue;
    }
    
    // If it's a follow-up line for a question (like in fill-in-the-blanks or complex questions)
    if (lastQuestion && !line.match(/^[A-Z][.．、]/) && !line.match(/^\d+[.．、]/)) {
        // Just append to question name or content if needed
        // For now, let's keep it simple
    }
  }

  // Post-process answers
  questions.forEach(q => {
    if (q.QuestionType === 1) { // Single choice: convert "A" to index
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
      if (q.Answer === '√') q.Answer = '1';
      else if (q.Answer === '×') q.Answer = '0';
    } else if (q.QuestionType === 4) { // Fill in blanks: "A; B" -> ["A", "B"]
        const blanks = q.Answer.split(/[；;]/).map(b => b.trim());
        q.Answer = JSON.stringify(blanks);
    }
  });

  return questions;
};
