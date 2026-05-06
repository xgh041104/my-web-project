import React, { useState } from 'react';
import { Button, Empty, Image } from 'antd';
import { history, connect, useDispatch } from 'umi';
import './index.css';
import { getFilePrefix, baseUrl } from '../../../utils/config';

function BookSheet({ title, bookList, pageSize, onSelectBook }) {

  const [pageIndex, setPageIndex] = useState(0);

  const nextPage = () => { setPageIndex(p => p + 1) }
  const prePage = () => { setPageIndex(p => p - 1) }

  let maxPages = 0, renderPage = [];
  if (bookList && bookList.length > 0) {
    maxPages = Math.ceil(bookList.length / pageSize);
    renderPage = bookList.slice(pageIndex * pageSize, pageIndex == maxPages - 1 ? bookList.length : (pageIndex + 1) * pageSize);
  }

  // console.log("current page:", pageIndex, "max page:", maxPages, bookList)

  const prefix = baseUrl + '/image/teach/bookTeach'


  return <div className={'bookSheet'}>
    <h1>{title}</h1>
    {bookList.length !== 0 ? <div className='bookSheetContain'>
      <Button disabled={pageIndex <= 0} onClick={prePage}>
        <Image src={prefix + '/arrowLeft.png'} preview={false} style={{ width: "1rem", marginLeft: '-.2rem', }} /></Button>
      <div className='bookSheetContent'
        onDragStart={() => { return false; }}
        onContextMenu={() => { return false; }}
        onSelect={() => { return false; }}
        onTouchStart={(e) => { return false; }}
        onMouseDown={(e) => { return false; }}
      >
        {renderPage.map(b => <div key={'book' + b.courseId} className='bookFace' onClick={() => onSelectBook(b)}>
          <img
            style={{ width: '100%', height: '26vh', borderRadius: '5px' }}
            src={(b.filePath) ? (getFilePrefix() + b.filePath) : (baseUrl + '/image/musicbk.jpg')}
          />
          <h2 style={{ fontSize: '0.25rem', fontWeight: '400', textAlign: 'center' }}>{b.courseTitle}</h2>
        </div>
        )}
      </div>
      <Button disabled={pageIndex >= maxPages - 1} onClick={nextPage}>
        <Image src={prefix + '/arrowRight.png'} preview={false} style={{ width: "1rem", }} /></Button>
    </div> : <Empty style={{ width: '80vw', height: '35vh' }} />}
  </div>
}

function BookTeach({ courseList }) {
  let publicCourse = [];
  let schoolCourse = [];

  const dispatch = useDispatch();

  //查询到的课程列表，如果是管理员则全部归类为公共课程，如果是老师用户，则查询到的都算是校本课程
  courseList?.forEach(course => {
    if (course.courseType !== 0) {
      schoolCourse.push(course);
    }
    else {
      publicCourse.push(course);
    }
  })

  const selectBook = (book) => {
    dispatch({
      type: "global/setCourseInfo",
      payload: {
        courseId: book.courseId,
        courseTitle: book.courseTitle,
      },
    })

    history.push({
      pathname: 'bookTeach/catalog',
      state: {
        courseInfo: book
      }
    });
  }

  return <div style={{ display: 'flex', flexDirection: 'column' }}>
    <BookSheet title={"学校教材"} bookList={schoolCourse} pageSize={5} onSelectBook={selectBook} />
    <BookSheet title={"公共教材"} bookList={publicCourse} pageSize={5} onSelectBook={selectBook} />
  </div >
}

export default connect(({ course }) => ({
  courseList: course.courseList,
}))(BookTeach) 