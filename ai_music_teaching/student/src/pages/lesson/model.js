import { message } from 'antd';
import api from 'api';

const { GetCurrentStudyCourseAPI, GetCourseDetailsAPI, GetChapterByIdAPI, StudyPlanUploadAPI } = api;

export default {
  namespace: 'lessonCenter',
  state: {
    lessonList: [],
    lessonDetail: {},
    chapterDetail: {},
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/lesson") {
          dispatch({ type: 'queryLessonList' });
        } else if (pathname === "/lesson/lessondetail") {
          if (state.CourseId) {
            dispatch({ type: 'queryLessonDetail', payload: state.CourseId });
          }
        } else if (pathname === "/lesson/studypage") {
          if (state && state.ChapterId) {
            dispatch({ type: 'queryChapterDetail', payload: state.ChapterId });
          }
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location)
      })
    },
  },

  effects: {
    *queryLessonList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin) {
        message.error("未登录，请先登录！", 3);
        return;
      }

      const result = yield call(GetCurrentStudyCourseAPI, { StudentId: userInfo.userId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { lessonList: result.data } });
      } else {
        message.error("请求我的课程失败，" + result.msg, 3);
      }
    },
    *queryLessonDetail({ payload }, { call, put, select }) { //payload: CourseId
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin) {
        message.error("未登录，请先登录！", 3);
        return;
      }

      const result = yield call(GetCourseDetailsAPI, { StudentId: userInfo.userId, CourseId: payload });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { lessonDetail: result.data } });
      } else {
        message.error("查询课程详情失败，" + result.msg, 3);
      }
    },
    *queryChapterDetail({ payload }, { call, put }) { //payload: ChapterId
      const result = yield call(GetChapterByIdAPI, { ChapterId: payload });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { chapterDetail: result.data } });
      } else {
        message.error("查询章节详情失败，" + result.msg, 3);
      }
    },
    *uploadStudyProgress({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      const result = yield call(StudyPlanUploadAPI, { ...payload, StudentId: userInfo.userId });
      if (result.code == 1) {
        message.success('学习进度上传成功');
      } else {
        message.error("查询章节详情失败，" + result.msg, 3);
      }
    },
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
