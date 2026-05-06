import React, { useState } from 'react';
import { Button, Tabs, List, Space, Popover, message, Row, Col, Image } from 'antd';
import {
  CloseCircleOutlined, FilePdfFilled, FileExcelFilled,
  FileFilled, RightOutlined, DownOutlined, RollbackOutlined
} from '@ant-design/icons';
import { history, connect, useDispatch } from 'umi';
import { getFilePrefix, baseUrl } from 'config';

import Toolbox from './_toolbox'
import './catalog.css';

export function LessonCheckItem({ item }) {
  const dispatch = useDispatch();
  // console.log(item);
  const [open, setOpen] = useState(false);
  const [popoverContent, setPopoverContent] = useState(<Space style={{ textAlign: 'center' }}></Space>)

  const handleOpenChange = () => {
    //点击展开附件列表，先请求接口，请求到的数据构造popoverContent
    dispatch({
      type: 'course/fetchSectionAnnexList',
      payload: { sectionId: item.sectionId },
      callback: (annexList) => {
        console.log(annexList);
        setPopoverContent(
          <Space direction='vertical' style={{ textAlign: 'center' }}>
            {
              annexList.map((annex) => {
                return <Row>
                  <span>{annex.fileName}</span>
                </Row>
              })
            }
          </Space>
        );
      }
    });

    setOpen(open => !open);
  };

  //选中小节课程，直接打开书页展示
  const handleLessonSelect = () => {
    history.push({
      pathname: './bookPage', state: {
        sectionId: item.sectionId
      }
    });
  }
  // {
  //     "sectionId": 23,
  //     "chapterId": 1,
  //     "sectionTitle": "视频课测试",
  //     "sectionDesc": "视频课测试",
  //     "sectionType": 1,     //0 图文课 1视频课 2图片课 3 ppt课
  //     "sectionContent": "aaaa",
  //     "sectionOrder": 0
  // },

  return <Popover
    content={popoverContent}
    trigger="click"
    open={open}
    placement="bottomLeft"
  >
    <div style={{
      borderBottom: '2px solid #E1E1E1', width: '10rem', minHeight: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'auto'
    }}>
      <div style={{ fontSize: '.2rem', width: '3rem' }}
      // onClick={handleLessonSelect}
      >{item.sectionTitle}</div>
      <Button type='primary' style={{
        borderRadius: '0.15rem', height: '.4rem', fontSize: '.2rem', color: 'white',
        display: 'flex', alignItems: 'center'
      }} onClick={handleLessonSelect}>开始授课</Button>
      <div className='foldBtn' onClick={handleOpenChange}>
        {open ? <RightOutlined /> : <DownOutlined />}
      </div>
    </div>
  </Popover>
}

function Catalog({ courseDirectory }) {

  const back2Sheet = () => {
    history.push({ pathname: '../bookTeach' })
  }

  // const lessonList = [
  //     "第一课 玩具兵进行曲",
  //     "第二课 将近酒 杯莫停",
  //     "第三课 劝君更尽一杯酒",
  //     "第四课 千里江陵一日还",
  // ]
  // const tabItems = [
  //     {
  //         key: 1,
  //         label: '第一单元',
  //     },
  //     {
  //         key: 2,
  //         label: '第二单元',
  //     },
  //     {
  //         key: 3,
  //         label: '第三单元',
  //     },
  //     {
  //         key: 4,
  //         label: '第四单元',
  //     },
  // ]

  const prefix = baseUrl + '/image/teach/bookTeach/bookPage'

  // 筛选图片课
  const TARGET_SECTION_TYPE = 2;
  return <div>
    <div className='lessonContent'>
      <br />
      <br />
      <div className='face'>
        <img
          src={(courseDirectory.filePath) ? (getFilePrefix() + courseDirectory.filePath) : (baseUrl + '/image/musicbk.jpg')}
        ></img>
      </div>
      <div className='content' style={{ minHeight: '85vh' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.1rem'
        }}>
          <h1 style={{ marginLeft: '0', fontWeight: '500', fontSize: '.3rem' }}>课本目录</h1>
          <Button style={{ height: '.5rem', fontSize: '.2rem', borderRadius: '.2rem', color: '#6F6F6F' }} onClick={() => {
            if (window?.electronAPI) {
              window.electronAPI?.send("openUrl", 'http://47.120.65.190/subjectcoursemanage');
            } else {
              window.open('http://47.120.65.190/subjectcoursemanage', '_blank', '');
            }
          }}>编辑备课</Button>
        </div>
        <Tabs tabPosition='top' className='tabs' style={{ width: '55vw', marginLeft: '.2rem', height: '.4rem' }}>
          {courseDirectory.chapterArr?.map((chapter) =>
            <Tabs.TabPane tab={chapter.chapterTitle} key={'chapter' + chapter.chapterId}>
              <List dataSource={chapter?.sectionArr?.filter(
                s => s.sectionType === TARGET_SECTION_TYPE) || []}
                renderItem={(section) => {
                  // console.log(section);
                  return <List.Item key={'section' + section.sectionId}>
                    <LessonCheckItem item={section} />
                  </List.Item>
                }}
              />
            </Tabs.TabPane>)}
        </Tabs>
        <div onClick={back2Sheet} style={{
          backgroundColor: 'rgb(247, 160, 85)',
          width: '.6rem',
          height: '.6rem',
          borderRadius: '.15rem',
          bottom: '10vh',
          right: '-3vw',
          position: 'absolute',
          cursor: 'pointer',
        }}>
          <Image src={prefix + '/rollBack.png'} preview={false} style={{
            width: ".5rem",
            margin: ".1rem 0 0 .05rem",
            top: '.05rem',
            left: '.05rem',
          }} />
        </div>
      </div>
    </div>
  </div>
}

export default connect(({ course }) => ({
  courseDirectory: course.courseDirectory
}))(Catalog);

