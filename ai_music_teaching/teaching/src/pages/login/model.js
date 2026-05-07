import { history } from 'umi';
import { message } from 'antd';
import api from 'api';
import { pathToRegexp } from 'path-to-regexp';

const { loginUser, getToken } = api

export default {
  namespace: 'login',
  state: { errorMsg: { message: null, timeStamp: 0 } },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      return history.listen(({ pathname, state }) => {
        if (pathToRegexp("/login").exec(pathname)) {
          // dispatch({ type: "globalObject/cerateGlobalObject" });
        }
      })
    },
  },
  effects: {
    *userLogin({ payload, callback }, { put, call, select }) {
      let result = null;
      const { macAddress, registry, teacherInfo } = yield select(_ => _.user);
      try {
        result = yield call(loginUser, teacherInfo ? { ...payload, teacherId: teacherInfo.teacherId, accessToken: teacherInfo.accessToken } : { ...payload, hostMAC: macAddress, serialNum: payload.serialNum || registry });
      }
      catch (e) {
        yield put({ type: "errorHandle", payload: e.message })
        return;
      }
      console.log("登陆返回结果:", result);

      if (result.code !== 0) {
        yield put({ type: "errorHandle", payload: result.message })
      }
      else {
        // 获取token
        let res;
        try {
          res = yield call(getToken);
        }
        catch (e) {
          yield put({ type: "errorHandle", payload: e.message })
          return;
        }
        console.log("获取token返回结果:", res);
        if (res.data.code != 200) {
          yield put({ type: "errorHandle", payload: res.msg })
          return;
        }
        window.sessionStorage.setItem("accessToken", res.data.data.token);
        const { schoolId, ...resultData } = result.data;
        if (payload.remember) {
          window.localStorage.setItem("userInfo", JSON.stringify({ userAccount: payload.userAccount, userPwd: payload.userPwd }));
        } else {
          window.localStorage.removeItem("userInfo");
        }
        yield put({
          type: "user/updateUser",
          payload: {
            userInfo: { ...resultData, schoolId: schoolId || 0 },
            token: result.token
          }
        });

        if (!registry && window?.electronAPI) {
          window.electronAPI?.send("set-registry", payload.serialNum)
          window.electronAPI?.send('get-registry');
          window.electronAPI?.receive('registry-value', (data, event) => {
            if (data) {
              dispatch({ type: "user/updateRegistry", payload: data });
            }
          })
        }
        history.push("/teach/bookTeach");
        if (!teacherInfo) {
          const userInfo = {
            serialNum: payload.serialNum || registry,
            teacherId: result.data.userId,
            accessToken: result.data.accessToken
          }
          window?.electronAPI?.send('teacher-login', userInfo);
        }
        message.success("登录成功！", 1);
      }
    },
  },
  reducers: {
    errorHandle(_, { payload: message }) {
      return { errorMsg: { message, timeStamp: Date.now() } }
    }
  }
};