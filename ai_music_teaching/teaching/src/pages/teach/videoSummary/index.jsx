import React, { useState, useMemo } from 'react';
import { history } from 'umi';
import { connect } from 'dva';
import { Table, Input, DatePicker, Space, Pagination } from 'antd';
import { SearchOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import styles from './index.less';

const HistoryRecord = (props) => {
  const { dispatch } = props;
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { bookList } = props;

  const historyData = bookList || [];

  // 过滤数据
  const filteredData = useMemo(() => {
    let filtered = historyData || [];

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(item =>
        item.bookName && item.bookName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 日期过滤
    if (selectedDate) {
      const selectedDateStr = selectedDate.format('YYYY-MM-DD');
      filtered = filtered.filter(item => {
        const itemDate = moment(item.updateAt).format('YYYY-MM-DD');
        return itemDate === selectedDateStr;
      });
    }

    // 默认按更新时间降序排列（最新的在前）
    if (filtered && filtered.length > 0) {
      filtered.sort((a, b) => {
        const timeA = moment(a.updateAt, 'YYYY-MM-DD HH:mm:ss').valueOf();
        const timeB = moment(b.updateAt, 'YYYY-MM-DD HH:mm:ss').valueOf();
        return timeB - timeA; // 降序排列
      });
    }

    return filtered;
  }, [historyData, searchText, selectedDate]);

  // 计算当前页显示的数据
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const handleView = (record) => {
    history.push(`/teach/videoSummary/detail`, {
      bookId: record.bookId,
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date ? moment(date) : null);
  };

  // 分页变更处理
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 表格列定义
  const columns = [{
    title: '序号',
    dataIndex: 'bookId',
    key: 'bookId',
    width: 80,
    align: 'center',
  }, {
    title: '课本名称',
    dataIndex: 'bookName',
    key: 'bookName',
    width: 200,
  }, {
    title: '课程视频数量',
    dataIndex: 'courseCount',
    key: 'courseCount',
    width: 150,
    sorter: (a, b) => a.courseCount - b.courseCount
  }, {
    title: '最后更新时间',
    dataIndex: 'updateAt',
    key: 'updateAt',
    width: 200,
    render: (text) => moment(text, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm'),
    sorter: (a, b) => new Date(a.updateAt) - new Date(b.updateAt)
  }, {
    title: '操作',
    key: 'action',
    width: 120,
    align: 'center',
    render: (_, record) => (
      <Space size="middle">
        <a onClick={() => handleView(record)} style={{ color: '#1890ff' }}><EyeOutlined /> 查看</a>
      </Space>
    ),
  }];

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>课程历史记录</h1>
        </div>

        {/* 搜索和筛选区域 */}
        <div className={styles.filterSection}>
          <Space size="middle" className={styles.filterControls}>
            <Input
              placeholder="搜索课本名称"
              prefix={<SearchOutlined style={{ fontSize: 15 }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={styles.searchInput}
              allowClear
            />
            <DatePicker
              onChange={handleDateChange}
              value={selectedDate}
              format="YYYY-MM-DD"
              placeholder="选择日期"
              style={{
                width: '10vw',
                height: '3.5vh'
              }}
              suffixIcon={<CalendarOutlined style={{ fontSize: 15 }} />}
              allowClear
            />
          </Space>
        </div>

        {/* 表格 */}
        <div className={styles.tableContainer}>
          <Table
            columns={columns}
            dataSource={currentData}
            rowKey="bookId"
            pagination={false}
            className={styles.historyTable}
          />

          {/* 分页组件 */}
          <div className={styles.paginationContainer}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
              style={{ position: "fixed", bottom: "12vh", left: "50%", transform: "translateX(-50%)", width: "auto" }}
              onChange={handlePageChange}
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`}
              className={styles.pagination}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(({ videoSummary }) => ({
  bookList: videoSummary.bookList,
}))(HistoryRecord);