import React, { Fragment, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Row, Col, Radio, Checkbox, Space, Tooltip, Input, Button } from 'antd';
import { FileImageOutlined, FilePdfOutlined, FileExcelOutlined, FileWordOutlined, PlaySquareOutlined, FileExclamationOutlined } from '@ant-design/icons';
import FileViewCom from 'components/fileview';
import { filePrefix } from 'urlList';
import OperateQuestion from './_operate'
import CodingQuestion from '@/components/question/codingQuestion'
import SqlQuestion from '@/components/question/sqlQuestion';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import HJCQuestion from '@/components/question/HJCQuestion';
import HJCEditor from '@/components/HJCEditor';
import CodingBlankQuestion from '@/components/question/codingBlankQuestion';
import ObjectComparison from 'components/ObjectComparison';
import ObjectRenderer from 'components/ObjectRenderer';
import CodingOpenQuestion from '@/components/question/codingOpenQuestion';
import calculateSimilarity from 'utils/calculateSimilarity';
import OriginCodeEditor from 'components/originCodeEditor';
import { set } from 'nprogress';

//props说明
//detail: object，题目的原始数据，直接传入题目数据详情，即可根据数据显示5种题目
//questionId、index: Id用于记录和使用，index用于显示题号，即可以用于单题显示，也可用于试卷连续显示
//showAnswer: bool，detail中有正确答案，showAnswer=true，则可显示正确答案，及可进行新答题的答案对比
//noCheckAnswer: bool，true则表示仅显示正确答案，不做检查对比答案操作，与showAnswer配合使用
//showScore: bool，是否显示detail中的分数，单题预览时不用显示分数，试卷预览或考试详情查询需要显示该题的设置分数
//returnResult(): 传递答题答案、Id、及正确与否数据出去的回调函数，设置了则可传递，未设置则不会给外部传答题数据。
//extraAnswer: object，当需要显示以往的答题答案时，则需要设置该参数。如回看考试详情，查看错题集时，都需要看到以前的答题数据。与后台的AnswerSheetarr、answerSteps字段相关


//抽象的题目显示组件，可适应显示几个题型、附件、答案显示与判断等功能

/**
 * TODO: 重构此组件以适应越来越多的新题型。
 * 可以从以下几个方面重构:
 * 1. 题目显示部分(包括试卷显示)
 * 2. 答案显示部分(包括试卷显示)
 * 3. 答案判断部分
 * 4. 分数处理部分
 * 5. 附件显示部分
 * 6. 连续答题(自动跳转下一题)
 * 7. 实操题跳转处理
 */


/**
 * 对比两个对象是否相同深度对比，去除前后空格
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns
 */
const deepEqualTrimmed = (obj1, obj2) => {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return String(obj1).trim() === String(obj2).trim(); // 去掉前后空格后对比
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => deepEqualTrimmed(obj1[key], obj2[key]));
};


/**
 * 对比两个答案的匹配度
 * @param {Object} currentAnswers
 * @param {Object} answer
 * @returns 0-1
 */
function calculateMatchRatio(currentAnswers, answer) {
  const keys = Object.keys(answer); // 获取所有的答案的键
  const total = keys.length; // 答案的总数
  let correctCount = 0; // 正确匹配的数量

  keys.forEach(key => {
    if (currentAnswers[key]?.trim() === answer[key]?.trim()) {
      correctCount++;
    }
  });

  return correctCount / total; // 返回相符的比例
}

const QuestionsCom = forwardRef((props, ref) => {
  // props: detail questionId  index, showAnswer，noCheckAnswer, showScore, returnResult(), extraAnswer
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [setEmpty, setSetEmpty] = useState(false);
  const [operatorParam, setOperatorParam] = useState(null);
  const [result, setResult] = useState(false);
  const [codeAnswers, setCodeAnswers] = useState("");
  const backupId = useRef(props.questionId);
  const fileViewRef = useRef();
  const codeRuestionRef = useRef();
  const sqlQuestionRef = useRef();
  const hjcQuestionRef = useRef();
  const questionResultRef = useRef(null);

  // getAnswerResult暴露给父组件
  useImperativeHandle(ref, () => ({
    getAnswerResult: () => questionResultRef.current,
    checkAnswer: checkAnswer
  }));

  // componentDidUpdate逻辑
  useEffect(() => {
    if (backupId.current !== props.questionId && setEmpty === false) {
      backupId.current = props.questionId;
      setSetEmpty(true);
    } else if (setEmpty) {
      setSetEmpty(false);
    }
  }, [props.questionId, setEmpty]);

  useEffect(() => {
    if (props.showAnswer && questionResultRef.current) {
      props?.returnResult?.(
        questionResultRef.current.questionId, questionResultRef.current.result, questionResultRef.current.answerTemp)
    }
  }, [props.showAnswer]);

  useEffect(() => {
    setCurrentAnswer(null);
    setCodeAnswers(props.detail?.Answer);
  }, [props.index]);

  //根据题目内容不同，显示不同的content组件
  //TODO： 显示答案后，如何控制disable
  // options: 为题目选项或者除题干外的其他内容
  // questionType: 题目类型
  // fileInfos: 附件信息
  // questionCategory: 操作题的题目类别：1为Unity实操题，2为其他题目
  function contentCom(options, questionType, fileInfos, questionCategory, answer) {
    switch (questionType) {
      case 1: // 单选题
        return (
          <Radio.Group
            disabled={props.showAnswer}
            {...(setEmpty && { value: '' })}
            key={props.index + "QRgroup"}
            onChange={(e) => setCurrentAnswer(e.target.value)}
          >
            <Space direction="vertical">
              {options?.map((item, index) => (
                <Radio key={props.index + "QRadio" + index} value={index}>
                  {item}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
      case 2: // 多选题
        return (
          <Checkbox.Group
            disabled={props.showAnswer}
            {...(setEmpty && { value: '' })}
            key={props.index + "qCgroup"}
            onChange={(checkedValues) => setCurrentAnswer(checkedValues)}
          >
            <Space direction="vertical">
              {options?.map((item, index) => (
                <Checkbox key={props.index + "QCheck" + index} value={index}>
                  {item}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
      case 3: // 判断题
        return (
          <Radio.Group
            disabled={props.showAnswer}
            {...(setEmpty && { value: '' })}
            key={props.index + "QRgroup"}
            onChange={(e) => setCurrentAnswer(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value={1}>正确</Radio>
              <Radio value={0}>错误</Radio>
            </Space>
          </Radio.Group>
        );
      case 4: // 填空题
        return (
          <Space direction="vertical">
            {options?.map((item, index) => (
              <Row key={props.index + "qInput" + index}>
                <Col>第{index + 1}个空：</Col>
                <Col>
                  <Input
                    disabled={props.showAnswer}
                    placeholder={`请输入第${index + 1}个空的答案`}
                    {...(setEmpty && { value: '' })}
                    onChange={(e) => {
                      setCurrentAnswer((prev) => {
                        let tempObj = prev;
                        if (!prev || Array.isArray(prev) || typeof prev !== "object") {
                          tempObj = {};
                        }
                        tempObj[String(index)] = e.target.value;
                        return { ...tempObj };
                      });
                    }}
                  />
                </Col>
              </Row>
            ))}
          </Space>
        );
      case 5: // 实操题
        return (
          <Fragment key={props.index + "q_operate"}>
            <div
              style={{
                display: operatorParam ? "block" : "none",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 999,
              }}
            >
              {operatorParam && (
                <OperateQuestion
                  params={operatorParam}
                  questionFinished={(msg) => {
                    setOperatorParam(null);
                    setCurrentAnswer(msg);
                  }}
                />
              )}
            </div>
            <Button
              type="primary"
              disabled={props.showAnswer}
              onClick={() => {
                if (fileInfos.length === 0) return;
                const file = fileInfos[0];
                const { FileName, FilePath } = file;

                if (FileName.includes("zip") || FileName.includes("rar") || FileName.includes("7z")) {
                  const urlUnity = FilePath.split(".")[0] + "/" + FileName.split(".")[0];
                  setOperatorParam({ urlUnity, type: 0, needButton: questionCategory === 1 });
                } else if (FileName.includes("xml") || FileName.includes("musicxml")) {
                  setOperatorParam({ scoreFileUrl: FilePath, type: 1 });
                }
              }}
            >
              跳转到实操页面
            </Button>
          </Fragment>
        );
      case 6: // 编程题
        return (
          <CodingQuestion
            ref={codeRuestionRef}
            renderType={props.showAnswer ? "show" : "edit"}
            contentValue={options}
            state={props?.state}
            commitResult={(code) => setCurrentAnswer(code)}
          />
        );
      case 7: // SQL题
        return (
          <SqlQuestion
            ref={sqlQuestionRef}
            renderType={props.showAnswer ? "show" : "edit"}
            contentValue={options}
            state={props?.state}
            commitResult={(sql) => setCurrentAnswer(sql)}
            answer={answer}
          />
        );
      case 8: // HTML+CSS题
        return (
          <HJCQuestion
            ref={hjcQuestionRef}
            renderType={props.showAnswer ? "show" : "edit"}
            contentValue={options}
            commitResult={(code) => setCurrentAnswer((prev) => ({ ...prev, steps: code }))}
          />
        );
      case 9: // 代码填空题
        return (
          <CodingBlankQuestion
            contentValue={options}
            state={props?.state}
            commitResult={(code) => setCurrentAnswer((prev) => ({ ...prev, steps: code }))}
          />
        );
      case 10: // 代码主观题
        return (
          <CodingOpenQuestion
            contentValue={options}
            commitResult={(code) => setCurrentAnswer((prev) => ({ ...prev, steps: code }))}
          />
        );
      default:
        return <h2>暂无此题目类型</h2>;
    }
  }

  function previewFile(info) {
    //TODO：点击附件ICON，打开预览附件
    const fileName = info.FileName.split('.')[0];
    const fileType = info.FilePath.split('.').pop();
    fileViewRef.current?.setFile(fileName, fileType, filePrefix() + info.FilePath);
  }

  //根据附件文件类型，生成对应的ICON，点击事件都一样
  function getFileIconCom(info, index) {
    let icon;
    if (info.FileType.indexOf('pdf') != -1) {
      icon = <FilePdfOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    } else if (info.FileType.indexOf('xls') != -1) {
      icon = <FileExcelOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    } else if (info.FileType.indexOf('doc') != -1) {
      icon = <FileWordOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    } else if (info.FileType.indexOf('png') != -1 || info.FileType.indexOf('jpg') != -1) {
      icon = <FileImageOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    } else if (info.FileType.indexOf('mp3') != -1 || info.FileType.indexOf('wav') != -1) {
      icon = <PlaySquareOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    } else if (info.FileType.indexOf('mp4') != -1 || info.FileType.indexOf('m3u8') != -1) {
      icon = <PlaySquareOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    } else {
      icon = <FileExclamationOutlined style={{ color: 'red' }} onClick={() => previewFile(info)} />;
    }
    return (
      <Tooltip key={String(props.index) + String(index) + info.FileName} title={info.FileName}>
        {icon}
      </Tooltip>
    )
  }

  //根据答案类型，生成对应的组件
  function getAnswerCom(options, answers, questionType) {

    if (questionType == 1) {
      return <Col>
        {options[Number(answers)]}
      </Col>
    } else if (questionType == 2) {
      return (
        (answers.steps || answer).map((item, index) => {
          return <Space key={props.index + "answer" + index}>
            <Col key={props.index + "qa" + String(index)}>答案{index + 1}：{options[item]}</Col>
            <Col key={props.index + "qs" + String(index)} span={1}> </Col>
          </Space>
        })
      )
    } else if (questionType == 3) {
      return (
        <Col>{(answers == "1") ? ("正确") : ("错误")}</Col>
      )
    } else if (questionType == 4) {
      return (
        (answers.steps || answer).map((item, index) => {
          return <Space key={props.index + "answer" + index}>
            <Col key={props.index + "qa" + String(index)}>空{index + 1}：{item}</Col>
            <Col key={props.index + "qs" + String(index)} span={1}> </Col>
          </Space>
        })
      )
    } else if (questionType == 5) {
      if (answers
        && (answers.score != undefined || answers.score != null)
        && (answers.steps != undefined || answers.steps != null)) {
        return <Col>上次实操得分：{answers.score}分</Col>
      }
      return <Col>实操题无标准答案</Col>
    }
    else if (questionType == 6) {
      // TODO: 渲染代码
      return <>
        <AceEditor
          mode={options?.language || "python"}
          theme="monokai"
          name="UNIQUE_ID_OF_DIV"
          fontSize={14}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
          value={JSON.parse(answers) || ""}//answers是一个json字符串,需要转换
          readOnly
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 3,
          }} />
      </>
    }
    else if (questionType == 7) {
      return <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#f5f5f5", border: "1px solid #ccc", borderRadius: "4px", padding: "5px" }}>{answers}</pre>
    }
    else if (questionType == 8) {
      return <>
        <HJCEditor value={answers.steps ? JSON.parse(answers.steps) : JSON.parse(answers) || { css: "", html: "" }} renderType="view" />
      </>
    }
    else if (questionType == 9) {
      return <>{props.extraAnswer && (Object.keys(props.extraAnswer).length != 0) ? <ObjectRenderer objectContent={answers.steps ? answers.steps : answers || {}} /> :
        <ObjectComparison answers={answers.steps ? answers.steps : answers || {}} setupAnswers={currentAnswer?.steps || {}} />
      }
      </>
    }
    else if (questionType == 10) {
      return <>
        <OriginCodeEditor originCode={answers} contentValue={options} readOnly />
      </>
    }
  }

  //检查答案是否正确，即答案与正确答案的对比
  async function checkAnswer() {
    props.setShowAnswer && props.setShowAnswer(false)
    const data = props.detail;
    let options = null;
    if (!data || Object.keys(data).length == 0) {
      return;
    }
    let answer = [];
    if (data.QuestionType) {
      options = JSON.parse((data.QuestionContent == "" || !data.QuestionContent) ? ("\"\"") : (data.QuestionContent));
      answer = JSON.parse((data.Answer == "" || !data.Answer) ? ("[]") : (data.Answer));
    }
    if (data.QuestionType == 4) {  //如果是填空题，由于content为空，则利用答案的数量去创建content
      options = answer;
    }
    if (data.QuestionType != 5 && typeof (options) !== "object") {
      options = [];
    }
    if (data.QuestionType === 6) {
      answer = data.Answer;
    }

    if (data.QuestionType == 7) {
      answer = data.Answer;
    }

    let extraAnswerValue = "";
    if (props.extraAnswer && Object.keys(props.extraAnswer).length != 0) {
      extraAnswerValue = JSON.parse((props.extraAnswer.AnswerSteps == "" || !props.extraAnswer.AnswerSteps) ? ("[]") : (props.extraAnswer.AnswerSteps));
    }

    const questionType = data.QuestionType;

    let _result = false;
    let answerTemp = '';
    if (!currentAnswer && currentAnswer !== 0) {
      // this.questionResult = null;
      // 没有作答直接显示答案
      // 记录答案，在检查答案后再告知父组件
      questionResultRef.current = { questionId: props.questionId, result: _result, answerTemp }
      // this.props?.onResultChange(...questionResult);
      setResult(_result);
      props.setShowAnswer && props.setShowAnswer(true)
      return false;
    }
    if (questionType == 1) {
      _result = (Number(answer) == currentAnswer);
      answerTemp = String(currentAnswer);
    }
    else if (questionType == 2) {
      let sum = 0;
      const currentValues = Object.values(currentAnswer);
      for (const val of currentValues) {
        if (answer.includes(val)) {
          sum++;
        } else {
          sum = 0;
          break;
        }
      }
      const newAnswerTemp = {
        steps: currentAnswer,
        score: sum / answer.length,
      };
      _result = sum > 0;
      answerTemp = newAnswerTemp;

    }

    else if (questionType == 3) {
      _result = (Number(answer) == currentAnswer);
      answerTemp = String(currentAnswer);
    }
    else if (questionType == 4) {
      let sum = answer.length;
      answer.forEach((item, index) => {
        const label = String(index);
        if (!currentAnswer || !currentAnswer[label] || item !== currentAnswer[label]) {
          sum--;
        }
      });
      _result = sum > 0;
      const newAnswerTemp = {
        steps: Object.values((currentAnswer) ? (currentAnswer) : ({})),
        score: sum / answer.length
      };
      answerTemp = newAnswerTemp;
    }
    else if (questionType == 5) {
      // console.log('operate score:', this.state.currentAnswer && this.state.currentAnswer.score,
      // "steps:", this.state.currentAnswer && this.state.currentAnswer.steps || "");
      if (currentAnswer && currentAnswer.score && currentAnswer.score >= 60) {
        _result = true;
      }
      answerTemp = currentAnswer;
    }
    else if (questionType == 6) {
      const results = await codeRuestionRef?.current?.runCode();
      _result = results?.every((item) => item.isCorrect);
      answerTemp = currentAnswer;
    }
    else if (questionType == 7) {
      _result = await sqlQuestionRef?.current?.judgeSQL();
      answerTemp = currentAnswer;
    }
    else if (questionType == 8) {
      const results = hjcQuestionRef?.current?.runCode();
      const newCurrentAnswer = { steps: currentAnswer.steps, score: results?.filter((item) => item.passed).length / results?.length };
      setCurrentAnswer(newCurrentAnswer);
      _result = results?.filter((item) => item.passed).length > 0;
      answerTemp = newCurrentAnswer;
    }
    else if (questionType == 9) {
      const newScore = calculateMatchRatio(currentAnswer.steps, answer);
      const newCurrentAnswer = { steps: currentAnswer.steps, score: newScore };
      setCurrentAnswer(newCurrentAnswer);
      _result = newScore > 0;
      answerTemp = newCurrentAnswer;
    }
    else if (questionType == 10) {
      const newScore = calculateSimilarity(JSON.parse(currentAnswer.steps)?.code2, JSON.parse(answer)?.code2);
      const newCurrentAnswer = { steps: currentAnswer.steps, score: newScore };
      setCurrentAnswer(newCurrentAnswer);
      _result = newScore > 0;
      answerTemp = newCurrentAnswer;
    }
    //检查完答案，可告知父组件，对应题目ID的对错情况
    // this.props.returnResult?.(this.props.questionId, result, answerTemp);
    // 记录答案，在检查答案后再告知父组件
    questionResultRef.current = { questionId: props.questionId, result: _result, answerTemp }
    // this.props?.onResultChange(...questionResult);
    setResult(_result);
    props.setShowAnswer && props.setShowAnswer(true)
  }
  console.log("props.extraAnswer", props.extraAnswer)

  // render逻辑
  const data = props.detail;
  if (!data || Object.keys(data).length == 0) { //如果detail为空，则无需显示任何东西
    return <div></div>
  }
  let options = null;
  let answer = [];
  if (data.QuestionType) {
    options = JSON.parse((data.QuestionContent == "" || !data.QuestionContent) ? ("\"\"") : (data.QuestionContent));
    answer = JSON.parse((data.Answer == "" || !data.Answer) ? ("[]") : (data.Answer));
  }
  if (data.QuestionType == 4) {  //如果是填空题，由于content为空，则利用答案的数量去创建content
    options = answer;
  }
  if (data.QuestionType != 5 && typeof (options) !== "object") {
    options = [];
  }
  if (data.QuestionType === 6) {
    answer = data.Answer;
  }

  let extraAnswerValue = "";
  if (props.extraAnswer && Object.keys(props.extraAnswer).length != 0) {
    extraAnswerValue = JSON.parse((props.extraAnswer.AnswerSteps == "" || !props.extraAnswer.AnswerSteps) ? ("[]") : (props.extraAnswer.AnswerSteps));
  }

  if (data.QuestionType == 6) {
    if (props.extraAnswer) {
      const originCodeObj = JSON.parse(JSON.parse(props.extraAnswer.AnswerSteps))
      extraAnswerValue = JSON.stringify([originCodeObj.code1, originCodeObj.code2, originCodeObj.code3].filter(Boolean).join("\n"));
    }
  }

  return (data.QuestionType && <div key={"question" + String(props.index)}>
    <FileViewCom ref={fileViewRef} />
    <Row>
      <Space>
        <Col >第 {props.index + 1} 题：</Col>
        <Col >{data.QuestionName}</Col>
      </Space>
    </Row>
    {data.QuestionDescribe && <Row><Input.TextArea disabled autoSize style={{ color: 'black', background: 'transparent', border: 'none', cursor: 'text' }} value={data.QuestionDescribe} /></Row>}
    <Row>
      { //根据showScore变量控制是否显示题目分数
        props.showScore && (<Col >{"(" + String(data.QuestionScore) + "分)"}</Col>)
      }
      <Col>
        <Space>
          {(data.QuestionType != 5) &&
            (data.FileInfo?.map((item, index) => {
              return (
                getFileIconCom(item, index)
              );
            }))
          }
        </Space>
      </Col>
    </Row>
    <br />
    {/* 题目内容部分 */}
    <Col span={12}>
      <div>
        {contentCom(options, data.QuestionType, data.FileInfo, data.QuestionCategory, answer)}
      </div>
    </Col>

    {/* 答案部分（受 showAnswer 控制） */}
    {(props.showAnswer) && (
      <Col span={12}>
        <div>
          <br />
          {// 根据 noCheckAnswer 决定是否显示答题正确与否
            (!props.noCheckAnswer) && (
              <Row style={{ color: 'red' }}>
                <Col>答案：</Col>
                <Col>{result ? ("答对√") : ("答错×")}</Col>
                {(data.QuestionType == 5) && <Col>实操评分：{currentAnswer && currentAnswer.score}/100</Col>}
              </Row>
            )
          }
          {props.extraAnswer &&
            <>
              <Row>
                <Col>正确答案：</Col>
              </Row>
              <Row>
                {getAnswerCom(options, answer, data.QuestionType)}
              </Row>
            </>}
        </div>
      </Col>
    )}

    { //判断是否有外部答案需要显示
      (props.extraAnswer && (Object.keys(props.extraAnswer).length != 0)) && (
        <div>
          <Row>
            <Col>答题答案:</Col>
          </Row>
          <Row>
            {
              getAnswerCom(
                (data.QuestionType == 4) ? (extraAnswerValue) : (options),
                extraAnswerValue,
                data.QuestionType
              )
            }</Row>
          <Row><Space size={'large'}>
            <Col>答题：{(props.extraAnswer.IsTrue) ? ("正确") : (<span style={{ color: 'red' }}>错误</span>)}</Col>
            <Col>
              得分：{
                props.extraAnswer.IsTrue
                  ? (() => {
                    try {
                      const stepData = JSON.parse(props.extraAnswer.AnswerSteps);
                      // 如果是对象，并且有 score 字段
                      const score = typeof stepData === 'object' && stepData !== null && 'score' in stepData
                        ? parseFloat(stepData.score)
                        : parseFloat(stepData);

                      const base = Number(props.extraAnswer.AnswerScore);
                      if (isNaN(score) || isNaN(base)) return base || 0;
                      return Math.round(score * base);
                    } catch (e) {
                      return props.extraAnswer.AnswerScore || 0;
                    }
                  })()
                  : 0
              }
            </Col>

          </Space></Row>
        </div>
      )
    }
  </div>)
});

export default QuestionsCom
