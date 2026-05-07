import api from 'api';
import { history } from 'umi'


const { QueryStandExamResults } = api;

export default {

  namespace: 'scoreQuery',

  state: {},

  subscriptions: {
    setupHistory({ dispatch, history }) {
      const check = (pathname) => {
        if (pathname === "/scoreQuery") {
          dispatch({ type: "queryUserInfo" });
        }
      }
      check(history.location.pathname);
      // 监听路由变化
      return history.listen(({ location: { pathname, state } }) => {
        check(pathname);
      })
    }
  },


  effects: {
    *queryUserInfo(_, { put }) {
      let userInfo = null;
      // 先从sessionStorage获取userInfo
      const userInfoStr = window.sessionStorage.getItem("userInfo");
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr, userInfo);
        //这里在重复刷新的时候，会读取缓存值，而state中值并未改变
        // yield put({ type: "syncUser", payload: { userInfo } });
      }
      else {
        // 或从state里获取userInfo
        userInfo = yield select(_ => _.user.userInfo);
      }
      if (!userInfo || !userInfo.userId || userInfo.userId < 1) {
        yield put({ type: 'user/logoutUser' });
        history.push("/getGradesLogin");
      }
    },

    *queryExamResults({ payload, callback }, { call, select }) {  // eslint-disable-line
      // const { userId } = yield select(_ => _.user.userInfo);
      let userInfo = null;
      // 先从sessionStorage获取userInfo
      const userInfoStr = window.sessionStorage.getItem("userInfo");
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr, userInfo);
        //这里在重复刷新的时候，会读取缓存值，而state中值并未改变
        // yield put({ type: "syncUser", payload: { userInfo } });
      }
      else {
        // 或从state里获取userInfo
        userInfo = yield select(_ => _.user.userInfo);
      }
      const result = yield call(QueryStandExamResults, { ...payload, stand_id: userInfo.userId });
      callback(result);
    }

  }
};
