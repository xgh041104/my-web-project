import { message } from 'antd';
import api from 'api';
import axios from 'axios';

const {
  GetStudentExamInfoAPI,
  GetStudentExamDetailsAPI,
  ExamStudentSumitAPI,
  GetSystemTimeAPI,
  GetStudentExamPaperOverAPI,
  UploadExamImage,
  GetExamNoticeByExamId,
} = api;

const InstanceAxios = axios.create({
  baseURL: '/aisummary',
  timeout: 30000000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YyTNOgJAfqphdAwFOZaV:MlgWxAiwkbjOgVCmLiMv',
  },
});

const pushToChat = async (payload) => {
  console.log('请求参数:', payload);
  try {
    const res = await InstanceAxios.post('/chat/completions', payload);
    console.log('响应数据:', res);
    if (res.status === 200) {
      return res.data;
    } else {
      message.error(res.data.message || '请求失败');
      return null;
    }
  } catch (error) {
    console.error('请求发生错误:', error);
    message.error('网络请求异常，请稍后重试');
    return null;
  }
};

export default {
  namespace: 'examCenter',
  state: {
    examList: [],
    examDetail: {},
    offsetTime: 0, //本地与后台的时间差ms， 本地慢则时间为+，本地快则时间为-。
    crtNotice: null,
    captureEnable: false,
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {
      // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === '/exam') {
          dispatch({ type: 'queryExamList' });
          dispatch({ type: 'querySystemTime' });
        } else if (pathname === '/exam/exampage') {
          if (state) {
            dispatch({ type: 'queryExamDetail', payload: state });
            dispatch({ type: 'queryExamNotice', payload: state });
          }
        }
      };
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      });
    },
  },

  effects: {
    *queryExamList(_, { call, put, select }) {
      const userInfo = yield select((_) => _.user.userInfo);
      if (!userInfo.isLogin) {
        message.error('用户未登录,无法查询考试列表！');
        return;
      }

      const result = yield call(GetStudentExamInfoAPI, { StudentId: userInfo.userId });

      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { examList: result.data } });
      } else {
        message.error('拉取考试信息失败：' + result.msg, 3);
      }
    },
    *queryExamDetail({ payload }, { call, put, select }) {
      //payload:{ExamId/ExamSessionId}
      const userInfo = yield select((_) => _.user.userInfo);
      if (!userInfo.isLogin) {
        message.error('用户未登录，无法查询考试详情！');
        return;
      }
      const result = yield call(GetStudentExamDetailsAPI, {
        StudentId: userInfo.userId,
        ExamId: payload.ExamId,
        ExamSessionId: payload.ExamSessionId,
      });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { examDetail: { ...payload, ...result.data } } }); //从列表处传来了几个参数需要合并到detail对象中
        message.info('查询考试数据完成。');
      } else {
        message.error('查询考试数据失败：' + result.msg, 3);
      }
    },
    *uploadPaperScore({ payload, callback }, { call, put, select }) {
      const result = yield call(ExamStudentSumitAPI, payload);
      console.log('uploadPaperScore: ', payload, result);
      if (result.code == 1) {
        message.success('提交考试成绩成功！');
        callback();
      } else {
        message.error('提交考试信息失败：' + result.msg, 3);
      }
    },
    *queryExamFinishDetail({ payload, callback }, { call, put, select }) {
      const userInfo = yield select((_) => _.user.userInfo);
      if (!userInfo.isLogin) {
        message.error('用户未登录，无法查询考试详情！');
        return;
      }
      const result = yield call(GetStudentExamPaperOverAPI, {
        StudentId: userInfo.userId,
        ExamId: payload.ExamId,
        ExamSessionId: payload.ExamSessionId,
      });
      if (result.code == 1) {
        callback(result.data);
      } else {
        message.error('查询考试答题数据详情失败:' + result.msg);
      }
    },
    *querySystemTime(_, { call, put }) {
      const result = yield call(GetSystemTimeAPI);
      if (result.success) {
        const sysTime = result.data.replace(/-/g, '/');
        const sysDate = new Date(sysTime);
        const cDate = new Date();
        const offsetTime = sysDate.getTime() - cDate.getTime();
        if (Math.abs(offsetTime) > 60000) {
          // 大于一分钟就修正
          yield put({ type: 'updateState', payload: { offsetTime } });
        }
      }
    },
    *queryExamNotice({ payload }, { call, put }) {
      const result = yield call(GetExamNoticeByExamId, { ExamId: payload.ExamId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { crtNotice: result.data } });
      } else {
        // message.error(result.msg, 3)
        yield put({ type: 'updateState', payload: { crtNotice: null } });
      }
    },
    *aiSummary({ payload, callback }, { call, put }) {
      const res = yield call(pushToChat, payload);
      if (res) {
        callback(res);
      } else {
        message.error('提交失败！');
      }
    },
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
};
