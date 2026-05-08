import mammoth from 'mammoth';

export const parseWordExam = async (file) => {
  console.log("终极调试版解析开始:", file.name);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToMarkdown({ arrayBuffer });
  let text = result.value;

  text = text.replace(/\\([.．、])/g, '$1');
  text = text.replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' '); // 清除乱码

  const answerMap = { 'A': new Map(), 'B': new Map() };
  let currentPaperForAns = 'A';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let inAnswerArea = false;
  for (const line of lines) {
    if (line.includes('标准答案')) {
      inAnswerArea = true;
      if (line.includes('B')) currentPaperForAns = 'B';
      else if (line.includes('A')) currentPaperForAns = 'A';
      console.log(`已进入 ${currentPaperForAns} 卷答案区`);
      continue;
    }

    if (inAnswerArea) {
      // 更加宽松的答案正则：匹配 数字+符号+内容
      const ansRegex = /(\d+)[.．、\s]\s*([^\s\d.．、]+(?: [^\s\d.．、]+)*)/g;
      let m;
      while ((m = ansRegex.exec(line)) !== null) {
        const qNum = parseInt(m[1]);
        const qAns = m[2].trim();
        answerMap[currentPaperForAns].set(qNum, qAns);
        console.log(`  [答案提取] ${currentPaperForAns}卷 第${qNum}题 -> ${qAns}`);
      }
    }
  }

  const questions = [];
  let currentPaper = 'A';
  let currentType = 1;
  const typeKeywords = { '单选': 1, '单项': 1, '多选': 2, '多项': 2, '判断': 3, '填空': 4 };
  let lastQuestion = null;

  for (const line of lines) {
    if (line.includes('标准答案')) break;

    if (line.includes('A卷') || (line.includes('试卷') && line.includes('A'))) currentPaper = 'A';
    if (line.includes('B卷') || (line.includes('试卷') && line.includes('B'))) currentPaper = 'B';

    for (const kw in typeKeywords) {
      if (line.includes(kw)) {
        currentType = typeKeywords[kw];
        break;
      }
    }

    const qMatch = line.match(/^[*#\s-]*(\d+)[.．、\s]\s*(.*)/);
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

      lastQuestion = {
        id: `word_${currentPaper}_${qNum}_${Math.random().toString(36).substr(2, 5)}`,
        QuestionName: `[${currentPaper}卷] ${qText}`,
        QuestionType: currentType,
        Digree: degree,
        QuestionContent: [],
        Answer: answerMap[currentPaper].get(qNum) || '',
        QuestionPoolId: 1,
        Status: 0
      };
      questions.push(lastQuestion);
      continue;
    }

    if (lastQuestion && (lastQuestion.QuestionType === 1 || lastQuestion.QuestionType === 2)) {
      const optRegex = /([A-Z])[.．、\s]\s*([^A-Z\s\n*]+(?: [^A-Z\s\n*]+)*)/g;
      let om;
      let found = false;
      while ((om = optRegex.exec(line)) !== null) {
        lastQuestion.QuestionContent.push(om[2].trim());
        found = true;
      }
      if (found) continue;
    }
  }

  // 4. 答案格式化
  questions.forEach(q => {
    if (!q.Answer) {
      if (q.QuestionType === 2 || q.QuestionType === 4) q.Answer = "[]";
      else q.Answer = "";
      return;
    }

    const rawAns = q.Answer.toString().trim().toUpperCase();

    try {
      if (q.QuestionType === 1) {
        const m = rawAns.match(/[A-Z]/);
        // 如果是单选，必须匹配到字母，并转为 1, 2, 3...
        q.Answer = m ? String(m[0].charCodeAt(0) - 'A'.charCodeAt(0) + 1) : "";
      } else if (q.QuestionType === 2) {
        const ms = rawAns.match(/[A-Z]/g);
        q.Answer = JSON.stringify(ms ? ms.map(m => String(m.charCodeAt(0) - 'A'.charCodeAt(0) + 1)) : []);
      } else if (q.QuestionType === 3) {
        q.Answer = (rawAns.includes('√') || rawAns.includes('对') || rawAns.includes('T') || rawAns.includes('TRUE')) ? '1' : '0';
      } else if (q.QuestionType === 4) {
        const blanks = rawAns.split(/[；; \s]/).map(s => s.trim()).filter(s => s.length > 0);
        q.Answer = JSON.stringify(blanks);
      }
    } catch (e) {
      q.Answer = (q.QuestionType === 2 || q.QuestionType === 4) ? "[]" : "";
    }
  });

  console.log("解析完成，总题目数:", questions.length);
  return questions;
};
