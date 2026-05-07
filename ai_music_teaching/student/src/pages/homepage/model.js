import { cloneDeep } from 'lodash';
import { message } from 'antd';
import api from 'api';
import { history } from 'umi'

const {
  GetNotice5API, QuertStudentPlan, AddQuestionRecord,
  QueryPlanCourseProgress, QueryPlanExamProgress, QueryPlanTrainProgress
} = api;

export default {
  namespace: 'homePageSpace',
  state: {
    noticeList: [],
    planList: [],
    planDetailList: []
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname.toLowerCase() === "/homepage") {
          // 屏蔽首页
          // dispatch({ type: 'queryHomePage' });
          // dispatch({ type: 'fetchPlanList' });
          dispatch({ type: "disableHomePage" });
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      })
    },
  },

  effects: {

    *disableHomePage(_, { select }) {
      // 查询用户登陆状态
      const { isLogin } = yield select(_ => _.user.userInfo)
      if (isLogin) {
        history.push("/mycenter");
      }
      else {
        history.push("login");
      }
    },
    *addPlanPracticeRecord({ payload }, { call, put }) {
      const result = yield call(AddQuestionRecord, payload.practiceList);
      if (result.code === 1) {
        yield put({ type: 'fetchPlanPractice', payload: { PlanId: payload.planId, StudentId: payload.studentId } })
      }
      else {
        message.error("上传计划练习记录错误:" + result.msg, 3);
      }
    },

    *fetchPlanCourse({ payload }, { call, put }) {
      const result = yield call(QueryPlanCourseProgress, payload);
      if (result.code === 1) {
        yield put({ type: 'updateDetail', payload: { PlanId: payload.PlanId, planCourseInfo: result.data } })
      }
      else {
        message.error("查询计划课程错误:" + result.msg, 3)
      }
    },
    *fetchPlanPractice({ payload }, { call, put }) {
      const result = yield call(QueryPlanTrainProgress, payload);
      if (result.code === 1) {
        yield put({ type: 'updateDetail', payload: { PlanId: payload.PlanId, planPractice: result.data } })
      }
      else {
        message.error("查询计划练习错误:" + result.msg, 3)
      }
    },
    *fetchPlanExam({ payload }, { call, put }) {
      const result = yield call(QueryPlanExamProgress, payload);
      if (result.code === 1) {
        yield put({ type: 'updateDetail', payload: { PlanId: payload.PlanId, planExam: result.data } })
      }
      else {
        message.error("查询计划考试错误:" + result.msg, 3)
      }
    },
    *fetchPlanList(_, { select, call, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin) {
        message.error("用户未登录,无法查询计划列表！");
        return;
      }
      const result = yield call(QuertStudentPlan, { StudentId: userInfo.userId });
      if (result.code === 1) {
        yield put({ type: 'updateState', payload: { planList: result.data } })
      }
      else {
        message.error("查询计划列表错误:" + result.msg, 3)
      }
    },
    //查询全部Notice
    *queryHomePage(_, { call, put }) {
      const result = yield call(GetNotice5API);
      // console.log("queryHomePage:",result);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { noticeList: result.data } });
      } else {
        message.error("公告查询错误：" + result.msg, 3);
      }
    },
  },

  reducers: {
    updateDetail(state, { payload }) {
      let originPlanDetailList = cloneDeep(state.planDetailList);
      let planDetailIndex = originPlanDetailList.findIndex(p => p.PlanId === payload.PlanId)
      if (planDetailIndex === -1) {
        originPlanDetailList.push(payload);
      }
      else {
        let planDetail = originPlanDetailList[planDetailIndex];
        planDetail = { ...planDetail, ...payload }
        originPlanDetailList.splice(planDetailIndex, 1, planDetail);
      }
      // console.log("new plan detail list:", JSON.stringify(originPlanDetailList));
      return {
        ...state,
        planDetailList: originPlanDetailList
      }
    },
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
