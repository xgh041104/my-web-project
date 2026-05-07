import { message } from 'antd';
import api from 'api';
import { check } from 'prettier';

const { GetQuestionByQuestionIdAPI, AddQuestionWrongAPI,
  GetTrainQuestionBySchoolId, GetSocietyQuestionByStudentId,
  AddOperPractice
} = api;

export default {
  namespace: 'trainingCenter',
  state: {
    questionList: [],
    questionDetail: {},
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/training") {
          dispatch({ type: 'queryQuestionList' });
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      })
    },
  },

  effects: {
    *queryQuestionList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin || !userInfo.schoolId) {
        return;
      }

      let result = null;
      if (userInfo.userType == 1) {//社会人士练习列表
        result = yield call(GetSocietyQuestionByStudentId, { StudentId: userInfo.userId });
      }
      else {
        result = yield call(GetTrainQuestionBySchoolId, { SchoolId: userInfo.schoolId });
      }

      if (result.code == 1) {
        yield put({ type: "updateState", payload: { questionList: result.data } });
      } else {
        message.error("拉取题目数据出错：" + result.msg);
      }
    },
    *queryQuestionDetail({ payload }, { call, put }) {  //payload: QuestionId
      const result = yield call(GetQuestionByQuestionIdAPI, { QuestionId: payload });
      if (result.code == 1) {
        yield put({ type: "updateState", payload: { questionDetail: result.data } });
      } else {
        message.error("拉取题目详情出错：" + String(payload) + result.msg);
      }
    },
    *addErrorQuestion({ payload }, { call }) {
      const result = yield call(AddQuestionWrongAPI, payload);
      if (result.code == 1) {
        message.success('错题集添加成功！');
      } else {
        message.error('错题集添加失败！');
      }
    },
    *addPracticeRecord({ payload }, { call, select }) {
      // 添加操作题目练习记录
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin || !userInfo.schoolId) {
        return;
      }
      const result = yield call(AddOperPractice, { ...payload, StudentId: userInfo.userId });
      if (result.code == 1) {
        // yield put({ type: 'updateState', payload: {:result.data} })
        message.info("已记录本次练习");
      }
      else {
        message.error(result.msg, 3)
      }

    }
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
