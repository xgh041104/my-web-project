import { message } from 'antd';
import api from 'api'
import { history } from 'umi';
import { pathToRegexp } from 'path-to-regexp'
import axios from 'axios';

const {
  GetExamBySchoolId, GetExamByExamId, AddExam, DelExam, EditExam, ExamCancel,
  AddExamSession, EditExamSession, DelExamSession, AddExamStudent, EditExamStudent,
  GetExamOverView, GetExamSessionResult,
  AddExamReset, GetExamResetByExamSessionId, GetCurrentExamSessionBKStudent,
  GetExamReViewBySchoolId, EditReViewExamByExamId,
  AddExamNotice, EditExamNotice, DelExamNotice, GetExamNoticeByExamId,
  AddExamBatchSessionStudent,
  GetStudentExamPaperOverAPI
} = api

const InstanceAxios = axios.create({
    baseURL: '/aisummary',
    timeout: 3000000, // 请求超时时间
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer CRVqMJlUrJlfZNCoLsOd:XbJoLmPesQfxtnlDUGoe',
    },
});


const pushToChat = async (payload) => {
    console.log('请求参数:', payload);
    try {
        const res = await InstanceAxios.post("/chat/completions", payload);
        console.log('响应数据:', res);
        if (res.status === 200) {
            return res.data;
        } else {
            message.error(res.data.message || "请求失败");
            return null;
        }
    } catch (error) {
        console.error('请求发生错误:', error);
        message.error("网络请求异常，请稍后重试");
        return null;
    }
};

export default {
  namespace: 'examManage',
  state: {
    examList: [],
    crtExamInfo: {},
    examResultList: [],
    examResultDetail: {},
    resetExamList: [],
    examReviewList: [],
    crtNotice: null,
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/examManage/examList") {
          dispatch({ type: "queryExamList" })
          return;
        }
        if (pathname === "/examManage/examEditor") {
          if (state && state.ExamId) {
            dispatch({ type: 'queryExam', payload: { ExamId: state.ExamId } });
          }
          return;
        }
        // examResultList
        if (pathname === "/examManage/examResultList") {
          dispatch({ type: "queryExamResultList" })
          return;
        }
        if (pathname === "/examManage/examResultDetail") {
          if (state && state.ExamId) {
            dispatch({ type: 'queryExamResult', payload: { ExamSessionId: state.ExamSessionId, ExamId: state.ExamId } });
          }
          return;
        }
        if (pathToRegexp('/examReview').exec(pathname)) {
          dispatch({ type: "queryExamReviewList" })
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
    *createExam({ payload }, { call, select, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      // if (!userInfo.isLogin || userInfo.userType != 1) {
      //     console.log("教师未登录无法添加考试!")
      //     message.error("教师未登录无法添加考试!")
      //     return;
      // }
      const result = yield call(AddExam, {
        ...payload, SchoolId: userInfo.schoolId, TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId
      });
      if (result.code == 1) {
        const examInfo = JSON.parse(result.data) || {};////"data": "{\"ExamId\":3}"
        if (examInfo && examInfo.ExamId) {
          yield put({ type: 'updateState', payload: { crtExamInfo: { Id: examInfo.ExamId } } })
          message.success("添加考试成功");
          return;
        }
        // callback();
        message.error("获取考试ID失败");

      }
      else {
        console.log("添加考试失败", result.msg);
        message.error(result.msg, 3)
        // Unknown column 'TeacherId' in 'field list'
      }
    },
    *removeExam({ payload }, { call, put }) {
      const result = yield call(DelExam, { ExamId: payload });
      if (result.code == 1) {
        yield put({ type: 'queryExamList' })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *copyNewExam({ payload }, { call, put }) {
      const result = yield call(ExamCancel, { ExamId: payload });
      if (result.code == 1) {
        yield put({ type: 'queryExamList' })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *modifyExam({ payload }, { call, select, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || !userInfo.schoolId) {
        console.log('未查询到教师所属学校');
        message.error('未查询到教师所属学校');
        return;
      }
      const result = yield call(EditExam, {
        SchoolId: userInfo.schoolId,
        ...payload
      });
      if (result.code == 1) {
        // yield put({ type: 'queryQuestionList' });
        // history.push("/questionManage/questionList");
        message.success("修改考试信息成功");
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryExam({ payload }, { call, put }) {
      const result = yield call(GetExamByExamId, payload);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { crtExamInfo: result.data } })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *queryExamList({ }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      // if (!userInfo.isLogin || userInfo.userType != 1) {
      //     console.log("教师未登录无法查询考试列表!")
      //     message.error("教师未登录无法查询考试列表!")
      //     return;
      // }
      const result = yield call(GetExamBySchoolId, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { examList: result.data, crtExamInfo: {} } })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *createExamSession({ payload }, { call, select, put }) {
      const result = yield call(AddExamSession, payload);
      if (result.code == 1) {
        yield put({ type: 'queryExam', payload: { ExamId: payload.ExamId } })
        message.success("添加考试场次成功")
      }
      else {
        console.log("添加考试场次失败", result.msg)
        message.error(result.msg, 3)
      }
    },
    *removeExamSession({ payload }, { call, put }) {
      const result = yield call(DelExamSession, payload);
      if (result.code == 1) {
        message.success("删除考试场次成功");
        yield put({ type: "queryExam", payload: { ExamId: payload.ExamId } })
      }
      else {
        console.log("删除考试场次失败", result.msg)
        message.error(result.msg, 3)
      }
    },
    *modifyExamSession({ payload }, { call, select, put }) {
      const result = yield call(EditExamSession, payload);
      if (result.code == 1) {
        yield put({ type: 'queryExam', payload: { ExamId: payload.ExamId } })
        message.success("修改考试场次成功");
      }
      else {
        console.log("修改考试场次失败", result.msg)
        message.error(result.msg, 3);
      }
    },
    *createExamStudent({ payload }, { call, select, put }) {
      const result = yield call(AddExamStudent, payload);
      if (result.code == 1) {
        yield put({ type: 'queryExam', payload: { ExamId: payload.ExamId } })
        message.success("添加考生成功")
      }
      else {
        console.log("添加考生失败", result.msg)
        message.error(result.msg, 3)
      }
    },
    *modifyExamStudent({ payload }, { call, select, put }) {
      const result = yield call(EditExamStudent, payload);
      if (result.code == 1) {
        yield put({ type: 'queryExam', payload: { ExamId: payload.ExamId } })
        message.success("修改考生成功");
      }
      else {
        console.log("修改考生失败", result.msg)
        message.error(result.msg, 3);
      }
    },
    *createResetExam({ payload }, { call, select, put }) {
      const result = yield call(AddExamReset, payload);
      if (result.code == 1) {
        // yield put({ type: 'queryExam', payload: { ExamId: payload.ExamId } })
        // history.push("/examManage/examList");
        yield put({ type: 'qeuryResetExamList', payload: { ExamSessionId: payload.OldExamSessionId } })
        message.success("添加补考成功")
      }
      else {
        console.log("添加补考失败", result.msg);
        message.error(result.msg, 3)
      }
    },
    *queryExamResult({ payload }, { call, put }) {
      const result = yield call(GetExamSessionResult, payload);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { examResultDetail: result.data } });
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryExamResultList({ }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      // if (!userInfo.isLogin || userInfo.userType != 1) {
      //     console.log("教师未登录无法查询考试结果列表!");
      //     message.error("教师未登录无法查询考试结果列表!");
      //     return;
      // }
      const result = yield call(GetExamOverView, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { examResultList: result.data } });
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *qeuryResetExamStudents({ payload, callback }, { call, put }) {
      const result = yield call(GetCurrentExamSessionBKStudent, payload);
      if (result.code == 1) {
        callback(result.data);
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *qeuryResetExamList({ payload }, { call, put }) {
      const result = yield call(GetExamResetByExamSessionId, payload);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { resetExamList: result.data } });
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryExamReviewList({ }, { select, call, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      const result = yield call(GetExamReViewBySchoolId, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { examReviewList: result.data } })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *approvalExam({ payload }, { call, put }) {
      const result = yield call(EditReViewExamByExamId, payload);
      if (result.code == 1) {
        message.success("审核提交成功!");
        yield put({ type: 'queryExamReviewList' })
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *createExamNotice({ payload, callback }, { call, select, put }) {
      const result = yield call(AddExamNotice, payload);
      if (result.code == 1) {
        // yield put({ type: 'queryExamList', payload: { ExamId: payload.ExamId } })
        message.success("添加考试通知成功");
        callback();
      }
      else {
        console.log("添加考试通知失败", result.msg)
        message.error(result.msg, 3)
      }
    },
    *removeExamNotice({ payload, callback }, { call, put }) {
      const result = yield call(DelExamNotice, payload);
      if (result.code == 1) {
        message.success("删除考试通知成功");
        callback()
      }
      else {
        console.log("删除考试通知失败", result.msg)
        message.error("删除考试通知失败:" + result.msg, 3)
      }
    },
    *modifyExamNotice({ payload }, { call, select, put }) {
      const result = yield call(EditExamNotice, payload);
      if (result.code == 1) {
        // yield put({ type: 'queryExam', payload: { ExamId: payload.ExamId } })
        message.success("修改考试通知成功");
      }
      else {
        console.log("修改考试通知失败", result.msg)
        message.error(result.msg, 3);
      }
    },
    *queryExamNotice({ payload }, { call, put }) {
      const result = yield call(GetExamNoticeByExamId, payload);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { crtNotice: result.data } })
      }
      else {
        // message.error(result.msg, 3)
        yield put({ type: 'updateState', payload: { crtNotice: null } })
      }
    },
    *importExamStudents({ payload, callback }, { call, select }) {
      // const userInfo = yield select(_ => _.user.userInfo);
      try {
        let result = null;

        // else if (payload.studentType === "social") {
        result = yield call(AddExamBatchSessionStudent, { fileData: payload.fileData });
        // }
        callback(result)
        // if (result.code == 1) {
        //     // yield put({ type: 'updateState', payload: {importedStudentList: result.data } })
        //     callback(result)
        // }
        // else {
        //     message.error(result.msg, 3)
        // }
      }
      catch (e) {
        callback({ code: 0, msg: e.message })
      }
    },
    *queryExamFinishDetail({ payload, callback }, { call, put, select }) {
      console.log("queryExamFinishDetail", payload);
      const result = yield call(GetStudentExamPaperOverAPI,
        { StudentId: payload.StudentId, ExamId: payload.ExamId, ExamSessionId: payload.ExamSessionId });
      if (result.code == 1) {
        callback(result.data);
      } else {
        message.error("查询考试答题数据详情失败:" + result.msg);
      }
    },
    *aiSummary({ payload, callback }, { call, put }) {
      const res = yield call(pushToChat, payload);
      if (res) {
        callback(res);
      } else {
        message.error("提交失败！");
      }
    }

  },
  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
};
