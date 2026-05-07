
import { message } from 'antd';
import api from 'api';
import { history } from 'umi';

const { GetTestPaperBySchoolId, GetTestPaperByTestPaperId, GetTestPaperByPaperId,
  AddTestPaper, EditTestPaper, DelTestPaper } = api;

export default {

  namespace: 'testPaper',

  state: {
    testPaperList: [],
    crtPaperInfo: null,
  },

  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/questionManage/testPaperList") {
          dispatch({ type: "QueryTestPaperList" });
          return;
        }
        if (pathname === "/questionManage/testPaperList/testPaperEditor") {
          if (state && state.paperId) {
            dispatch({ type: 'QueryTestPaper', payload: state.paperId });
          }
          return;
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      })
    },
  },

  effects: {

    *createTestPaper({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || !userInfo.schoolId) {
        console.log('未查询到教师所属学校');
        message.error('未查询到教师所属学校');
        return;
      }
      const result = yield call(AddTestPaper, {
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
        SchoolId: userInfo.schoolId,
        ...payload
      });
      if (result.code == 1) {
        // yield put({ type: 'queryQuestionList'});
        history.push("/questionManage/testPaperList");
        message.success("新增试卷成功");
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeTestPaper({ payload }, { call, put }) {
      const result = yield call(DelTestPaper, payload);
      if (result.code == 1) {
        yield put({ type: 'QueryTestPaperList' });
        message.success("删除试卷成功");
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyTestPaper({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || !userInfo.schoolId) {
        console.log('未查询到教师所属学校');
        message.error('未查询到教师所属学校');
        return;
      }
      const result = yield call(EditTestPaper, {
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
        SchoolId: userInfo.schoolId,
        ...payload
      });
      if (result.code == 1) {
        // yield put({ type: 'queryQuestionList'});
        history.push("/questionManage/testPaperList");
        message.success("修改试卷成功");
      }
      else {
        message.error(result.msg, 3);
      }
    },
    //编辑时使用
    *QueryTestPaper({ payload }, { call, put, select }) {  // eslint-disable-line
      if (!payload || payload < 1) {
        message.error("无效试卷 ID");
        return;
      }
      const result = yield call(GetTestPaperByPaperId, { TestPaperId: payload });
      if (result.code == 1) {
        yield put({ type: 'save', payload: { crtPaperInfo: result.data } })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *QueryTestPaperList(_, { call, put, select }) {  // eslint-disable-line
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || !userInfo.schoolId) {
        console.log('未查询到教师所属学校');
        message.error('未查询到教师所属学校');
        return;
      }
      const result = yield call(GetTestPaperBySchoolId, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'save', payload: { testPaperList: result.data, crtPaperInfo: null } })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    //预览时使用
    *queryTestPaperDetail({ payload, callback }, { call, put }) { //payload: TestPaperId
      const result = yield call(GetTestPaperByTestPaperId, { TestPaperId: payload.Id });
      if (result.code == 1) {
        callback?.(result.data);
      } else {
        message.error('拉取试卷详情出错：' + result.msg);
      }
    },
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },
};
