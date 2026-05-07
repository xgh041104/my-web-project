import React, { useState, useRef, useEffect } from 'react';
import { ProTable, DragSortTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Popconfirm, message } from "antd";
import { connect, history } from 'umi';

import ChapterEditorModal from './_ChapterEditor';
import ChapterView from './_ChapterView';

function ChapterList({ dispatch, chapterList, crtCourse, loading }) {
  const [viewChapterInfo, setViewChapterInfo] = useState(null);

  const editorModal = useRef(null);
  const tableRef = useRef(null);

  const openEditorModal = ChapterId => {
    dispatch({
      type: "lessonManage/queryChapter", payload: { ChapterId },
      callback: (chapterInfo) => editorModal.current.openChapterEdit(chapterInfo)
    })
  }

  const openViewModal = ChapterId => {
    dispatch({
      type: "lessonManage/queryChapter", payload: { ChapterId },
      callback: (chapterInfo) => setViewChapterInfo(chapterInfo)
    })
  }

  const columns = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 60,
      // className: 'drag-visible',
    },
    // {
    //   title: '章节序号',
    //   dataIndex: 'ChapterOrder',
    //   sorter: (a, b) => a.ChapterOrder - b.ChapterOrder,
    //   search: false,
    //   render: (value, record, index, action) => {
    //     // console.log("ChapterOrder:",value, "rowInfo": record, index, action)
    //     return <span>第{index + 1}章</span>
    //   }
    // },
    {
      title: '章节名称',
      dataIndex: 'ChapterName',
      className: 'drag-visible',
    },
    {
      title: '章节类型',
      dataIndex: 'ChapterType',
      filters: true,
      onFilter: true,
      valueEnum: { "0": "图文课", "1": "视频课" },
      // render: (value) => ({ "0": "图文课", "1": "视频课" }[value])
    },
    // {
    //   title: '附件列表',
    //   dataIndex: 'attachedFiles',
    //   search: false,
    //   render: (text, record, someValue, action) => {
    //     console.log(text, record, someValue, action);
    //     // <Row justify={'start'}></Row>
    //     return React.createElement(Row, { gutter: [16, { xs: 8, sm: 16, md: 24, lg: 32 }] },
    //       record.attachedFiles.map((filename, index) => {
    //         // console.log('col key', "attachedFiles" + index);

    //         return <Col key={"attachedFiles" + index}>{filename}</Col>
    //       }))
    //   }
    // },
    {
      title: '操作',
      search: false,
      key: "operator",
      width: '2.5rem',
      render: (text, record, _, action) => {
        let operatorRenders = [<Button type='link' key={"operator_view"}
          onClick={() => { openViewModal(record.Id) }}
        >预览</Button>]
        if (crtCourse.status) {
          return operatorRenders;
        }
        else {
          operatorRenders.push(
            <Popconfirm
              key={"operator_del"}
              title="是否确认删除该项？"
              onConfirm={() => {
                dispatch({ type: "lessonManage/removeChapter", payload: record.Id });
              }}
              // onCancel={() => { message.error("取消删除") }}
              okText="删除"
              cancelText="取消"
            >
              <Button danger type='link'>删除</Button>
            </Popconfirm>
          )
          operatorRenders.push(<Button type='link' key={"operator_edit"} onClick={
            () => { openEditorModal(record.Id) }
          }>编辑</Button>)
          return operatorRenders;
        }
      }
    }
  ]

  // remoteData = chapterList;
  const orderRequest = (newDataSource) => {

    const neworder = newDataSource.map((item, index) => ({
      "ChapterOrder": [item.Id, index]
    }))


    dispatch({
      type: "lessonManage/modifyChapterOrder", payload: neworder,
      // callback: (chapterInfo) => setViewChapterInfo(chapterInfo)
    });
    
  }

  useEffect(() => {
    // componentDidUpdate
    tableRef.current?.reload()
  });

  // TODO: 章节排序
  const handleDragSortEnd = (
    newDataSource,
  ) => {
    // console.log('排序后的数据', beforeIndex,
    //   afterIndex, newDataSource);
    // setDataSource(newDataSource);
    orderRequest(newDataSource)
  };

  return <>
    <Button type='primary' onClick={() => history.push('/lessonManage/lessonList')}>返回课程列表</Button>
    <ChapterView chapterInfo={viewChapterInfo} setViewChapterInfo={setViewChapterInfo} />
    <ChapterEditorModal ref={editorModal} dispatch={dispatch} courseId={crtCourse.ID} loading={loading} />
    <DragSortTable
      actionRef={tableRef}
      toolBarRender={(action) => {
        // console.log("ProTable action", action);
        if (!crtCourse.status) {
          //新建按钮及弹窗
          return [
            <Button icon={<PlusOutlined />} type="primary" onClick={() => { editorModal.current.setIsOpen(true); }}>新建</Button>
            ,
          ]
        }
        else {
          // 课程开启状态下无法编辑
          return []
        }

      }}
      rowKey='Id'
      // defaultData={data} //默认数据，没有request也能显示
      pagination={{
        showQuickJumper: true,
      }}
      defaultData={chapterList}
      search={{}} //展示搜索表单
      cardBordered //边框样式
      headerTitle={<span>当前课程：<span style={{ fontWeight: 700 }}>{crtCourse.name}</span>{(crtCourse.status ? <span style={{ color: 'lightgreen' }}>(已开始,无法编辑)</span> : <span style={{ color: 'red' }}>(未开始)</span>)}</span>}
      //表格字段定义，哪些字段需要筛选、筛选类型定义都在其中，action也可添加在此
      columns={columns}
      dragSortKey="sort"
      onDragSortEnd={handleDragSortEnd}
      loading={loading.effects["lessonManage/modifyChapterOrder"]||loading.effects["lessonManage/queryChapterList"]}
      //数据筛选变化触发，params：搜索表单参数+分页参数；sort表头排序变动；filter表头筛选变动
      request={(params, sort, filter) => {
        return Promise.resolve({
          data: () => {
            return chapterList?.filter((item) => {
              let result = true;
              Object.entries(params).forEach(([key, value]) => {
                if (key == "current" || key == "pageSize") {
                  return;
                }
                const dataKey = key.replace("search", "")
                if (item.hasOwnProperty(dataKey)) {
                  result = (result && item[dataKey].indexOf(value) != -1)
                }
              })
              // console.log(`get ${JSON.stringify(params)} true name :`, item.TrueName, result);
              return result;
            });
          },
          success: true,
        });
      }}
    />
  </>
}

export default connect(({ loading, dispatch, lessonManage }) =>
  (({ loading, dispatch, chapterList: lessonManage.chapterList, crtCourse: lessonManage.crtCourse })))(ChapterList)
