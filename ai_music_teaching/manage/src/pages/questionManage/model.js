import { message } from 'antd';
import api from 'api';
import { history } from 'umi';

const { AddQuestion, EditQuestion, DelQuestion, GetQuestionBySchoolId, GetExamQuestionBySchoolId,
  GetQuestionByQuestionId, GetQuestionExeclData, MatchAddQuestion,
  GetOperPracticeByQuestionId, Compile
} = api;

export default {
  namespace: 'questionManage',
  state: {
    questionList: [],
    crtQuestionInfo: null,
    lastPage: 1,
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/questionManage/questionList") {
          dispatch({ type: 'queryQuestionList', payload: 0 });// payload=0查询所有题目
          return;
        }
        if (pathname === "/questionManage/questionEditor") {
          if (state && state.QuestionId) {
            dispatch({ type: 'queryQuestion', payload: { QuestionId: state.QuestionId } });
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
    *createQuestion({ payload, callback }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      const result = yield call(AddQuestion, {
        SchoolId: userInfo.schoolId,
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,

        ...payload
      });
      if (result.code == 1) {
        // yield put({ type: 'queryQuestionList'});
        history.push("/questionManage/questionList");
        message.success("新增题目成功!");
      }
      else {
        message.error("新增题目失败：" + result.msg, 3);
      }
      callback();
    },
    *removeQuestion({ payload }, { call, put }) {
      const result = yield call(DelQuestion, payload);
      if (result.code == 1) {
        // yield put({ type: 'queryQuestionList' });
        history.push("/questionManage/questionList");
        message.success("删除题目成功");
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyQuestion({ payload }, { call, select, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || !userInfo.schoolId) {
        console.log('未查询到教师所属学校');
        message.error('未查询到教师所属学校');
        return;
      }
      const result = yield call(EditQuestion, {
        SchoolId: userInfo.schoolId,
        ...payload
      });
      if (result.code == 1) {
        // yield put({ type: 'queryQuestionList' });
        history.push("/questionManage/questionList");
        message.success("修改题目成功");
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryQuestion({ payload, callback }, { call, put }) {
      const result = yield call(GetQuestionByQuestionId, payload);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { crtQuestionInfo: result.data } });
        callback?.(result.data);
      }
      else {
        message.error("查询题目失败：" + result.msg, 3)
      }
    },
    *queryQuestionList({ payload }, { call, select, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      const GetQuestionList = [GetQuestionBySchoolId, GetExamQuestionBySchoolId
        // , GetTrainQuestionBySchoolId
      ]
      const result = yield call(GetQuestionList[payload], { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { questionList: result.data, crtQuestionInfo: null } })
      }
      else {
        message.error("查询题目失败：" + result.msg, 3)
      }
    },
    *parseQuestionData({ payload, callback }, { call, put }) {
      const result = yield call(GetQuestionExeclData, payload);
      callback(result);
    },
    *importQuestionData({ payload, callback }, { call, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || !userInfo.userId) {
        console.log('教师未登录');
        return;
      }
      const addQuestionData = payload.map(row => {
        const { courseInfo, ...otherData } = row;
        return {
          ...otherData,
          // QuestionContent: JSON.stringify(QuestionContent),
          SchoolId: userInfo.schoolId,
          TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
          CourseId: courseInfo && Array.isArray(courseInfo) && courseInfo.length > 2 && courseInfo[2] || 0
        }
      })
      const result = yield call(MatchAddQuestion, addQuestionData);
      callback(result);
      // if (result.code == 1) {
      //     yield put({ type: 'updateState', payload: {:result.data} })
      // }
      // else {
      //     message.error(result.msg, 3)
      // }
    },
    *queryQuestionRecord({ payload, callback }, { call }) {
      const result = yield call(GetOperPracticeByQuestionId, payload);
      if (result.code == 1) {
        // yield put({ type: 'updateState', payload: { crtQuestionInfo: result.data } });
        callback?.(result.data);
      }
      else {
        message.error(result.msg, 3)
      }
    },

    *runCode({ payload, callback }, { call }) {
      const result = yield call(Compile, payload);
      callback?.(result);
    },
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
