const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

async function parseWordExam(docxPath) {
  const arrayBuffer = fs.readFileSync(docxPath);
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const questions = [];
  let currentPaper = 'A';
  let currentSection = '';
  let questionType = 1;
  
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
  currentPaper = 'A';

  for (let line of lines) {
    if (line.includes('标准答案')) {
      inAnswerSection = true;
      continue;
    }
    if (inAnswerSection) continue;

    if (line.includes('（A卷）')) { currentPaper = 'A'; continue; }
    if (line.includes('（B卷）')) { currentPaper = 'B'; continue; }

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

    const qMatch = line.match(/^(\d+)[.．、]\s*(.*)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();
      
      let degree = 1;
      const dMatch = qText.match(/难度\s*(\d+)/);
      if (dMatch) {
        degree = parseInt(dMatch[1]);
        qText = qText.replace(/难度\s*(\d+)/, '').trim();
      }

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
  }

  return questions;
}

const docxPath = path.join(__dirname, "../../../../../中小学音乐试卷AB卷.docx");
parseWordExam(docxPath).then(qs => {
    console.log("Parsed Questions Count:", qs.length);
    if (qs.length > 0) {
        console.log("First Question Sample:", JSON.stringify(qs[0], null, 2));
    }
});
