import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import ProTable from '@ant-design/pro-table';
import { baseUrl } from 'urlList';
import { Typography, Layout, Image } from 'antd';
import { history } from 'umi';
import { LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import { connect } from 'dva'
import './index.css';

const { Title } = Typography;
const { Header, Content } = Layout;

function StudentExamScore({ dispatch, user }) {
  const [params, setParams] = useState({});

  const fetchStudentScores = async (fetchParams) => {

    const { current, pageSize, ...rest } = fetchParams;

    const transformedParams = {
      page: current,
      page_size: pageSize,
      ...Object.fromEntries(
        Object.entries(rest).map(([key, value]) => [
          key.replace(/(?!^)([A-Z])/g, '_$1').toLowerCase(),
          value,
        ])
      ),
    };

    // if (transformedParams.score && Array.isArray(transformedParams.score)) {
    //   transformedParams.min_score = score[0];
    //   transformedParams.max_score = score[1];
    // }

    const data = await new Promise((resolve, reject) => {
      dispatch({
        type: 'scoreQuery/queryExamResults',
        payload: transformedParams
        ,
        callback: (res) => {
          if (res.code == 1) {
            resolve(res.data);
          }
          else {
            reject(res.msg);
          }
        },
      });
    });

    return {
      data: data.Data || [],
      success: true,
      total: data.Total
    }

  };

  useEffect(() => {
    setParams({
      current: 1,
      pageSize: 10,
    });
  }, []);



  return (
    <Layout className="student-exam-layout">
      <Header className="student-exam-header">
        <div style={{ color: 'white', cursor: 'pointer', fontSize: '0.23rem' }} onClick={() => { history.push('/getGradesLogin'); dispatch({ type: 'user/logoutUser' }) }}>
          <LogoutOutlined style={{ marginRight: '10px' }} />退出登录</div>
      </Header>
      <Content className="student-exam-content">
        <PageContainer>
          <ProTable
            rowKey='Id'
            request={fetchStudentScores}
            columns={[
              {
                title: '学生姓名',
                dataIndex: 'TrueName',
              },
              {
                title: '准考证号',
                dataIndex: 'ExamNumber',
              },
              {
                title: '站点名称',
                dataIndex: 'StandName',
                search: false
              },
              {
                title: '开始考试时间',
                dataIndex: 'StartExamTime',
                search: false
              },
              {
                title: '结束时间',
                dataIndex: 'EndExamTime',
                search: false
              },
              {
                title: '考试状态',
                dataIndex: 'ScoreStatus',
                // filters: true,
                valueEnum: {
                  1: '及格',
                  2: '未及格',
                  3: '未考试'
                },
              },
              {
                title: '考试名称',
                dataIndex: 'TestPaperName',
              },
              {
                title: '课程名称',
                dataIndex: 'MajorName',
              },
            ]}
            pagination={{
              showQuickJumper: true,
              showSizeChanger: true,
              defaultPageSize: 10,
            }}
            search={{
              collapsed: false,
              collapseRender: false
            }}
            onChange={(pagination, filters, sorter, extra) => {
              setParams({ pagination, filters, sorter });
            }}
            size="large"
            bordered
          />
        </PageContainer>
      </Content>
    </Layout>
  );
}

export default connect(({ loading, dispatch, user }) => ({ loading, dispatch, user }))(StudentExamScore);
