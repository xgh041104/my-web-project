import React, { useState, useEffect } from 'react';
import { Button, Image, message } from 'antd';
import { useHistory, useSelector, useDispatch, history, connect } from 'umi';
import './bookPage.css';
import { getFilePrefix } from 'config';
import FileAnnexModal from './_fileAnnex';
import DictSearchModal from '../../study/musicDict/_dictSearchModal';
import SongSearchModal from '../../study/musicBox/_songSearchModal';
import { baseUrl } from '../../../utils/config';
import { useArcMenuContext } from '@/hooks/useArcMenuContext';
import RecorderControlled from '@/components/RecorderControlled';

function PageSheet({ pageList, pageSize, crtCourseInfo }) {
  const [pageIndex, setPageIndex] = useState(0);
  const history = useHistory();

  let maxPages = 0, renderPage = [];
  if (pageList && pageList.length > 0) {
    maxPages = Math.ceil(pageList.length / pageSize);
    renderPage = pageList.slice(
      pageIndex * pageSize,
      pageIndex === maxPages - 1 ? pageList.length : (pageIndex + 1) * pageSize
    );
  }

  const nextPage = () => setPageIndex(p => p + 1);
  const prePage = () => setPageIndex(p => p - 1);

  const back2Catalog = () => {
    history.push({
      pathname: './catalog',
      state: {
        courseInfo: crtCourseInfo
      }
    });
  };

  const prefix = baseUrl + '/image/teach/bookTeach/bookPage';

  return (
    <div className='pageContain'>
      <Button disabled={pageIndex <= 0} onClick={prePage}>
        <Image src={prefix + '/arrowLeft.png'} preview={false} style={{ width: "1rem" }} />
      </Button>

      <div className='pages'>
        {renderPage.map(p => (
          <div key={p.sectionrelationId}>
            <img src={getFilePrefix() + p.filePath} draggable="false" />
          </div>
        ))}
      </div>

      <Button disabled={pageIndex >= maxPages - 1} onClick={nextPage}>
        <Image src={prefix + '/arrowRight.png'} preview={false} style={{ width: "1rem" }} />
      </Button>

      <div onClick={back2Catalog} style={{
        backgroundColor: 'rgb(247, 160, 85)',
        width: '0.5rem',
        height: '.5rem',
        borderRadius: '.1rem',
        position: 'absolute',
        cursor: 'pointer',
        bottom: '0',
        right: '0',
      }}>
        <img
          src={prefix + '/rollBack.png'}
          style={{ width: ".4rem", height: ".4rem", top: '.05rem', position: 'absolute', left: '.05rem' }}
        />
      </div>
    </div>
  );
}

function BookPage({ dispatch, crtSection, crtCourseInfo }) {
  const [fileAnnexModalStatus, setFileAnnexModalStatus] = useState(false);
  const [dictSearchModalStatus, setDictSearchModalStatus] = useState(false);
  const [songSearchModalStatus, setSongSearchModalStatus] = useState(false);

  const inSession = useSelector(state => state.global.inSession);
  const dispatchLocal = useDispatch();
  const [showInputModal, setShowInputModal] = useState(false); // 控制是否弹出“请输入主题”弹窗


  // const courseId = useSelector(state => state.global.courseId);
  // const courseTitle = useSelector(state => state.global.courseTitle);
  // console.log("当前课本", courseId, courseTitle, crtCourseInfo);

  // 解析课程id 和课程名字
  // const { courseId, courseTitle } = crtCourseInfo;

  // console.log("当前课程信息", courseId, courseTitle);


  const closeStyles = {
    width: "1.5rem",
    height: "0.8rem",
    borderRadius: '.2rem',
    fontWeight: '600',
    fontSize: '0.3rem',
    position: 'fixed',
    top: '10%',
    right: '4%',
    backgroundColor: '#00b894',
    borderColor: '#00b894',
    zIndex: 999
  };

  const { setMenuFn } = useArcMenuContext();

  // ✅ 提前定义要传入 setMenuFn 的函数，防止引用错误
  const openFileAnnexModal = () => setFileAnnexModalStatus(true);
  const openDictSearchModal = () => setDictSearchModalStatus(true);
  const openSongSearchModal = () => setSongSearchModalStatus(true);

  useEffect(() => {
    setMenuFn(() => ({
      nextClass,
      previousClass,
      openFileAnnexModal,
      openDictSearchModal,
      openSongSearchModal
    }));
  }, []);

  const nextClass = () => {
    dispatch({
      type: 'course/nextOrPreviousClass',
      payload: { isNext: true },
      callback: (nextSectionId) => {
        if (nextSectionId <= 0) {
          message.info('下一课找不到数据');
          return;
        }
        history.push({
          pathname: './bookPage',
          state: { sectionId: nextSectionId }
        });
      }
    });
  };

  const previousClass = () => {
    dispatch({
      type: 'course/nextOrPreviousClass',
      payload: { isNext: false },
      callback: (previousSectionId) => {
        if (previousSectionId <= 0) {
          message.info('上一课找不到数据');
          return;
        }
        history.push({
          pathname: './bookPage',
          state: { sectionId: previousSectionId }
        });
      }
    });
  };

  return (
    <>
      <PageSheet
        pageList={crtSection?.fileContent || []}
        pageSize={2}
        crtCourseInfo={crtCourseInfo}
      />

      <FileAnnexModal
        resourceDetail={crtSection?.fileAnnex}
        openDetailModal={fileAnnexModalStatus}
        closeDetailModal={() => setFileAnnexModalStatus(false)}
      />

      <DictSearchModal
        dispatch={dispatch}
        openSearchModal={dictSearchModalStatus}
        closeSearchModal={() => setDictSearchModalStatus(false)}
      />

      <SongSearchModal
        dispatch={dispatch}
        openSearchModal={songSearchModalStatus}
        closeSearchModal={() => setSongSearchModalStatus(false)}
      />

      {inSession ? (
        <RecorderControlled
          closeRecorderControlled={() => {
            dispatchLocal({ type: 'global/setInSession', payload: false });
            setShowInputModal(false);
          }}
          isBookTeach
          showInputModal={showInputModal}
          courseInfo={crtCourseInfo}
        />
      ) : (
        <Button
          type="primary"
          style={closeStyles}
          onClick={() => {
            dispatchLocal({ type: 'global/setInSession', payload: true });
            setShowInputModal(true);
          }}
        >
          上课
        </Button>
      )}

    </>
  );
}

export default connect(({ dispatch, course }) => ({
  dispatch,
  crtSection: course.crtSection,
  crtCourseInfo: course.crtCourseInfo
}))(BookPage);
