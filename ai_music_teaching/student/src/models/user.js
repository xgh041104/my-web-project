import api from 'api';

const { GetSystemTimeAPI } = api

export default {
  namespace: 'user',
  state: {
    userInfo: {
      isLogin: false,
      userName: "",
      account: "",
      userId: -1,
      userType: -1, //社会考生2  或在校生1
    },
    token: "",
    pathname: "",
  },
  subscriptions: {
    // 只在第一次访问或者刷新浏览器时才触发此函数
    setup({ history, dispatch }, error) {
      const check = ({ pathname, state }) => {
        console.log("用户切换路径", pathname);
        dispatch({ type: "updatePathname", payload: pathname });
        if (pathname === "/") {
          history.push({ pathname: '/login' });
        }
      }
      check(history.location);
      history.listen(({ location }) => {
        check(location);
      });
      // console.log("查询用户信息");
      dispatch({ type: 'query', payload: history.location.pathname });
    },
  },
  effects: {
    *query({ payload }, { select, put }) {
      try {
        let userInfo = null;
        const userInfoStr = window.sessionStorage.getItem("userInfo");
        if (userInfoStr) {
          userInfo = JSON.parse(userInfoStr, userInfo);
          yield put({ type: "syncUser", payload: { userInfo: userInfo } });
        }
        else {
          // 或从state里获取userInfo
          userInfo = yield select(_ => _.user.userInfo);
        }

      } catch (error) {
        console.error(error);
      }
    },
    *logout({ }, { put }) {
      yield put({ type: "logoutUser" });
    },

    *querySystemTime({ callback }, { call, put }) {
      const result = yield call(GetSystemTimeAPI);
      if (result.success) {
        const sysTime = result.data.replace(/-/g, "/");
        const sysDate = new Date(sysTime);
        // const cDate = new Date();
        // if (Math.abs(parseInt(sysDate - cDate)) > 60000) {
        // yield put({ type: 'updateState', payload: { offsetTime: parseInt(sysDate - cDate) } });
        // }
        callback(sysDate);
      }
    },
  },
  reducers: {
    updateUser(state, { payload }) {
      // 将user信息存入sessionStorage
      window.sessionStorage.setItem("userInfo", JSON.stringify(payload.userInfo));
      if (payload.token) {
        window.sessionStorage.setItem("token", payload.token);
      }
      return {
        ...state,
        ...payload
      }
    },
    logoutUser(state, { }) {
      //退出登录时，清空state和storage
      const initInfo = {
        userInfo: {
          isLogin: false,
          userName: "",
          account: "",
          userId: -1,
          userType: -1, //社会考生2  或在校生1
        },
        token: "",
      };
      window.sessionStorage.setItem("userInfo", JSON.stringify(initInfo.userInfo));
      window.sessionStorage.setItem("token", initInfo.token);
      return {
        ...state,
        ...initInfo
      }
    },
    syncUser(state, { payload }) {
      //将读到的登录用户信息，写回到state中
      return {
        ...state,
        ...payload
      }
    },
    updatePathname(state, { payload: pathname }) {
      return {
        ...state,
        pathname
      }
    },
  }
}
