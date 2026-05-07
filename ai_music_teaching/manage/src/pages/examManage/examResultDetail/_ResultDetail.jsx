import { Button, Empty, Image, Modal, Select, notification } from 'antd'
import { ProTable } from '@ant-design/pro-components'
import MarkdownIt from 'markdown-it'; 
import React, { useRef, useEffect, useState } from 'react'
import { filePrefix } from 'urlList'

const ImagePreview = ({ imageArr }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(1);

  if (!imageArr || !imageArr.length || imageArr.length < 1) {
    return null;
  }

  let randomId = Math.random();

  const [visible, setVisible] = useState(false);

  return (<>
    <div style={{ display: 'flex', justifyContent: 'space-around' }} >
      {
        imageArr && imageArr.length && imageArr.filter((_, i) => i < 3).map(
          (img, index) => <Image
            key={"img" + index} width={30} src={filePrefix() + img.ImagePath + "?random" + randomId}
            preview={false}
            onClick={() => {
              setVisible(true);
              setCurrentImageIndex(index);
            }}
          />)
      }
    </div>
    <div
      style={{ display: 'none' }}
    >
      <Image.PreviewGroup
        preview={{
          visible,
          onVisibleChange: (vis) => setVisible(vis),
          current: currentImageIndex,

        }}
      >
        {imageArr.map((img, index) =>
          <Image key={"imgPrv" + index} width={200} src={filePrefix() + img.ImagePath + "?random" + randomId} />)}
      </Image.PreviewGroup>
    </div>
  </>
  );
};

function ResultDetail({ examResultDetail, dispatch }) {

  const md = new MarkdownIt({
  html: true,         // 允许 HTML 标签
  linkify: true,      // 自动识别链接
  typographer: true,  // 智能标点
});

  const examTableRef = useRef()
  const tableFilter = (params, sort, filter) => {
    return Promise.resolve({
      data: examResultDetail?.filter((item) => {
        let result = true;
        Object.entries(params).forEach(([key, value]) => {
          if (key == "current" || key == "pageSize" || key === "ExamImageArr") {
            return;
          }
          const dataKey = key.replace("search", "")
          if (item.hasOwnProperty(dataKey)) {
            result = (result && item[dataKey].indexOf(value) != -1)
          }
        })
        if (params.ExamImageArr) {
          result = result && (
            params.ExamImageArr == 1
              ? (item.ExamImageArr && item.ExamImageArr.length && item.ExamImageArr.length > 0)
              : (!item.ExamImageArr || !item.ExamImageArr.length || item.ExamImageArr.length < 1)
          )
        }
        // console.log(`get ${JSON.stringify(params)} true name :`, item.TrueName, result);
        return result;
      }),
      // data: () => {
      //     return examResultDetail;
      // },
      success: true,
    })
  }

  useEffect(() => {
    examTableRef.current?.reload();
  }, [examResultDetail])

  // todo: AI学情分析
  const viewIntelligentAnalysis = (params) => {
    let content = '';
    let answer = '';
    // if (!params || typeof (params) !== 'object' || Object.keys(params).length == 0) {
    //   console.log('查看考试完成详情参数出错');
    //   return;
    // }
    dispatch({
      type: 'examManage/queryExamFinishDetail', payload: params,
      callback: (detail) => {
        console.log('detail', detail);
        const temp1 = detail.TestPaperQuestionViewFile;
        const temp2 = detail.AnswerSheetarr;
        temp1.map((item, index) => {
          content += index + 1 + '.' + item.QuestionName;
        });
        temp2.map(item => {
          answer += item.IsTrue + ' ';
        });
        notification.open({
          message: detail.ExamName + '--学情分析',
          description: '正在分析，请稍后...',
          key: 'ai-summary',
          duration: 0,
          closeIcon: false,
        });
        dispatch({
          type: 'examManage/aiSummary',
          payload: {
            model: 'x1',
            user: 'user_123456',
            messages: [{
              role: 'user',
              content: `  你是一名音乐教学分析助手，,基于我提供的两段内容（冒号后的内容）,第一段数据是试卷的题目,
                      第二段是对应第一段题目的试题得分情况0代表答错,1代表答对
                      针对学生的答卷简单分析其知识点的掌握情况，明确指出哪些知识点掌握得较好，哪些知识点存在不足或错误，以及错误的具体表现。
                      根据知识点的掌握情况,给出具有针对性的学习方向和方法建议,
                      帮助学生更好地弥补薄弱环节,提升音乐知识水平：第一段`+ content + `第二段` + answer,
            }],
            stream: false,
            tools: [{
              type: "web_search",
              web_search: {
                enable: true,
                search_mode: "normal"
                // search_mode: "deep"
              }
            }]
          },
          callback: (result) => {
            notification.destroy('ai-summary');
            // this.setState({ isAiAnalyzing: false });
            console.log('result', result);
            Modal.info({
              title: detail.ExamName + '--学情分析',
              content: <div dangerouslySetInnerHTML={{ __html: md.render(result.choices[0].message.content) }} />,
              width: '60vw',
              closable: true,
            });
          }
        })
      }
    })
  }

  const columns = [
    {
      title: '学生ID',
      dataIndex: 'StudentId',
      align: 'center',
      sorter: (a, b) => a.StudentId - b.StudentId,
      search: false,
    },
    {
      title: '名字',
      dataIndex: 'TrueName',
      align: 'center',

    },
    {
      title: '考试时间',
      dataIndex: 'StartExamTime',
      align: 'center',
      render: (text, record, index, action) =>
        (record.StartExamTime && record.StartExamTime !== "") ?
          <span key={index}>{record.StartExamTime} 至 {record.EndExamTime}</span> :
          "-"
    },
    {
      title: '考试用时',
      dataIndex: 'UseTime',
      align: 'center',
    },
    {
      title: '成绩',
      dataIndex: 'Score',
      search: false,
      align: 'center',
      render: value => value === -1 ? "未完成考试" : value
    },
    {
      key: "operation",
      title: '操作',
      width: '2.5rem',
      align: 'center',
      render: (record) => [
        // todo: ai学情分析
        <Button key='operator_edit' type='link' onClick={() => viewIntelligentAnalysis(record)}>AI学情分析</Button>,
      ],
      search: false,
    },
    // {
    //     key: "ExamImageArr",
    //     title: '考试照片',
    //     // render: (text, record) => <Button type="link" onClick={() => viewStudentImage(record.ExamImageArr)}>查看考试照片</Button>
    //     render: (_, record) => <ImagePreview imageArr={record.ExamImageArr} />,
    //     // renderFormItem: () => <Select options={[{ label: "有照片", value: 1 }, { label: "无照片", value: 2 }]} />
    // }
  ]
  return <ProTable
    style={{ marginTop: '.3rem' }}
    rowKey={"Id"}
    actionRef={examTableRef}
    cardBordered
    pagination={{
      defaultPageSize: 10,
      showQuickJumper: true,
    }}
    columns={columns}
    request={tableFilter}
  />
}

export default ResultDetail;