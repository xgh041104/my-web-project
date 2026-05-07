import React from 'react';
import { filePrefix } from 'urlList';
import SimpleChoiceContent from './SimpleChoiceContent';
import MultipleChoiceContent from './MultipleChoiceContent';
import TrueOrFalseContent from './TrueOrFalseContent';
import CloseTestContent from './CloseTestContent';
import OperationContent from './OperationContent';
import CodingContent from './CodingContent';
import SqlContent from './SQLContent';
import HJCContent from './HJCContent';
import CodingComplete from './CodingComplete';
import CodingOpen from './CodingOpen';

const answerQuestionValidator = (isAnswerError, isOptionsError) => {
  if (isOptionsError) {
    //!value.Options||value.Options.length<1||value.Options.some(o=>o==="")
    return Promise.reject(new Error('题目内容未设置完整!'))
  }
  if (isAnswerError) {//!value.Answer
    return Promise.reject(new Error("未设置答案!"))
  }
  return Promise.resolve()
};

// interface QuestionContent {
//     label: string, // 题目名称
//     value: string, // 类型值
//     validator: Function, // 题目组件输入form校验
//     component: React.ReactNode, // 题目组件
//     attachFile?: boolean, // 题目是否有附件
//     handleCommitData?: Function, // 提交数据处理，返回提交数据。目前只有操作题有
//     handleFieldsData?: Function  // 获取数据处理，返回数据，目前只有操作题有
// }
export const QuestionContents = [
  {
    label: '单选题',
    value: '1',
    validator: (_, value) => answerQuestionValidator(
      !value.Answer || value.Answer === "",
      !value.Options || value.Options.length < 1 || value.Options.some(o => o === "")
    ),
    component: <SimpleChoiceContent />,
    attachFile: true // 是否允许上传附件
  },
  {
    label: '多选题',
    validator: (_, value) => answerQuestionValidator(
      !value.Answer || value.Answer.length < 1 || value.Answer.some(a => a === ""),
      !value.Options || value.Options.length < 1 || value.Options.some(o => o === "")
    ),
    component: <MultipleChoiceContent />,
    value: '2',
    attachFile: true // 是否允许上传附件
  },
  {
    label: '判断题',
    validator: (_, value) => answerQuestionValidator(
      !value.Answer || value.Answer === "",
      false
    ),
    component: <TrueOrFalseContent />,
    value: '3',
    attachFile: true // 是否允许上传附件

  },
  {
    label: '填空题',
    validator: (_, value) => answerQuestionValidator(
      !value.Answer || value.Answer.length < 1 || value.Answer.some(a => a === ""),
      false
    ),
    component: <CloseTestContent />,
    value: '4',
    attachFile: true // 是否允许上传附件

  },
  // {
  //     label: '实操题',
  //     validator: (_, value) => answerQuestionValidator(
  //         false,
  //         !value.Options || value.Options.length < 1 || value.Options.some(o => o === "")
  //     ),
  //     component: <OperationContent />,
  //     value: '5',
  //     attachFile: false,        
  //     handleCommitData: (values) => ({
  //         // 实操题没有附件
  //         fileData: values.QuestionContent.Options.map(f => f.originFileObj) || [],
  //         QuestionContent: "",
  //         Answer: ""
  //     }),
  //     handleFieldsData: (crtQuestionInfo) => {
  //         // "QuestionContent": { Options: QuestionFiles }, // 操作题的unity文件保存在QuestionFiles中
  //         const QuestionFiles = crtQuestionInfo.FileInfo?.map((file) => ({
  //             uid: file.Id,
  //             name: file.FileName,
  //             status: 'done',
  //             url: filePrefix() + file.FilePath,
  //         })) || []
  //         return { QuestionContent: { Options: QuestionFiles } }
  //     }
  // },
  // {
  //     label: '编程题',
  //     validator: (_, value) =>
  //         answerQuestionValidator(
  //             !value.Answer || value.Answer === "",
  //             !value.Options || !value.Options.originCode || !value.Options.testCode || value.Options.testCode?.length < 1 || !value.Options.originCode === ""
  //         ),
  //     component: <CodingContent />,
  //     value: '6',
  // },
  // {
  //     label: 'sql题',
  //     validator: (_, value) => answerQuestionValidator(
  //         !value.Answer || value.Answer === "",
  //         false
  //     ),
  //     component: <SqlContent />,
  //     value: '7'
  // },
  // {
  //     label: 'html+css题',
  //     validator: (_, value) => answerQuestionValidator(
  //         !value.Answer || value.Answer === "",
  //         false
  //     ),
  //     component: <HJCContent />,
  //     value: '8'
  // },
  // {
  //     label: '代码填空题',
  //     validator: (_, value) => answerQuestionValidator(
  //         !value.Answer || value.Answer === "",
  //         !value.Options || !value.Options.originCode || !value.Options.originCode === ""
  //     ),
  //     component: <CodingComplete />,
  //     value: '9'
  // },
  // {
  //     label: '编程主观题',
  //     validator: (_, value) => answerQuestionValidator(
  //         !value.Answer || value.Answer === "",
  //         !value.Options || !value.Options.originCode || !value.Options.originCode === ""
  //     ),
  //     component: <CodingOpen />,
  //     value: '10'
  // }
]

function generatorTypes() {
  let questionTypes = {}
  QuestionContents.forEach((item) => {
    questionTypes[item.value] = item.label
  })
  return questionTypes
}
export const questionTypeEnum = generatorTypes()