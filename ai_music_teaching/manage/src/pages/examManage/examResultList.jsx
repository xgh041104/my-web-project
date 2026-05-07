import { Typography, Switch, Button, Popconfirm, Table, notification, Modal } from 'antd'
import { ProTable } from '@ant-design/pro-components'
import React, { useRef, useEffect } from 'react'
import { connect, history } from 'umi';
import MarkdownIt from 'markdown-it';
import usePageState from '@/hooks/usePageState';


function ExamResultList({ dispatch, examResultList, adminSchoolId }) {

  const md = new MarkdownIt({
    html: true,         // 允许 HTML 标签
    linkify: true,      // 自动识别链接
    typographer: true,  // 智能标点
  });
  const examTableRef = useRef();

  const pageState = usePageState("examManage", "pageNumber");

  const viewExamResult = (ExamSessionId, ExamId) => {
    history.push({ pathname: '/examManage/examResultDetail', state: { ExamSessionId, ExamId } })
  }

  // todo: AI分析
  const viewIntelligentAnalysis = (record) => {
    notification.open({
      message:  record.ExamSession+'--学情分析',
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
          content: `  你是一名教学数据分析助手，请根据以下音乐试卷（包含题目和每题的出错人数）总共2人，为这次测试生成一份学情分析报告。报告需包括以下内容：
                      知识点掌握情况，高频错题分析（分析其涉及的知识点）
                      知识薄弱点总结，教学建议（为教师下一步复习或讲解提供建议，特别是针对错误率高的题型或内容）
                      请使用面向教师的专业语言，内容要系统、可操作性强。：
                      音符 “5” 的唱名是（ ） 
                      A. Do B. Re C. Mi ✅ D. Sol
                      ✅ 答对人数：2 人
                      下列音乐术语中，表示“渐慢”的是（ ） 
                      A. Allegro ✅ B. Rit C. Cresc D. Staccato
                      ✅ 答对人数：1 人
                      中国民族乐器“二胡”的主要演奏方式是（ ） 
                      A. 吹奏 B. 弹拨 ✅ C. 拉弦 D. 打击
                      ✅ 答对人数：1 人
                      《蓝色多瑙河》的作曲者是（ ） 
                      A. 海顿 B. 贝多芬 ✅ C. 约翰·施特劳斯 D. 舒曼
                      ✅ 答对人数：2 人`
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
          title: record.ExamSession + '--学情分析',
          content: <div dangerouslySetInnerHTML={{ __html: md.render(result.choices[0].message.content) }} />,
          width: '60vw',
          closable: true,
        });
      }
    })
  }

  const tableFilter = (params, sort, filter) => {
    return Promise.resolve({
      data: () => {
        return examResultList?.filter((item) => {
          let result = true;
          if (params.MajorName) {
            result = (result && item.MajorName.indexOf(params.MajorName) != -1);
          }
          if (params.ExamSession) {
            result = (result && item.ExamSession.indexOf(params.ExamSession) != -1);
          }
          return result;
        })
      },
      success: true,
    })
  }

  useEffect(() => {
    examTableRef.current?.reload();
  }, [examResultList])

  useEffect(() => {
    dispatch({ type: "examManage/queryExamResultList" })
  }, [adminSchoolId])

  const columns = [
    {
      title: '考试场次',
      dataIndex: 'ExamSession',
      align: 'center',
      // sorter: (a, b) => a.ExamSessionId - b.ExamSessionId,
      // search: false,
    },
    {
      title: '专业',
      dataIndex: 'MajorName',
      align: 'center',

    },
    {
      title: '及格/满分',
      dataIndex: 'Score',
      align: 'center',
      search: false,
    },
    {
      title: '参考人次',
      dataIndex: 'ExamPeopleSumNum',
      sorter: (a, b) => a.ExamPeopleSumNum - b.ExamPeopleSumNum,
      align: 'center',
      search: false,
    },

    {
      title: '平均分',
      dataIndex: 'AvgScore',
      sorter: (a, b) => a.AvgScore - b.AvgScore,
      align: 'center',
      search: false,
    },
    {
      key: "operation",
      title: '操作',
      width: '2.5rem',
      align: 'center',
      render: (text, record, index, action) => [
        <Button key='operator_edit' type='link' onClick={() =>
          viewExamResult(record.ExamSessionId, record.ExamId)}>
          查看详情
        </Button>,
        <Button key='intelligent_analysis' type='link' onClick={() =>
          // todo: 传参
          viewIntelligentAnalysis(record)}>
          AI学情分析
        </Button>,
      ],
      search: false,
    },
  ]
  return <ProTable
    style={{ marginTop: '.3rem' }}
    rowKey={"ExamSessionId"}
    actionRef={examTableRef}
    cardBordered
    pagination={{
      ...pageState,
      defaultPageSize: 10,
      showQuickJumper: true,
    }}
    columns={columns}
    request={tableFilter}
  />
}

export default connect(({ dispatch, examManage, user }) => ({
  dispatch,
  examResultList: examManage.examResultList,
  adminSchoolId: user.adminSchoolId
}))(ExamResultList)