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
      const { macAddress, registry, teacherInfo } = yield select(_ => _.user);
      const loginParams = teacherInfo 
        ? { ...payload, teacherId: teacherInfo.teacherId, accessToken: teacherInfo.accessToken } 
        : { ...payload, hostMAC: macAddress, serialNum: payload.serialNum || registry };

      try {
        // 并行发起登录与获取曲谱Token，将耗时从串行相加缩减为单次往返
        const [loginRes, tokenRes] = yield Promise.all([
          loginUser(loginParams),
          getToken().catch(err => {
            console.warn("曲谱token非关键接口获取异常:", err);
            return { data: { code: 200, data: { token: "" } } };
          })
        ]);

        const result = loginRes;
        console.log("登陆返回结果:", result);

        if (!result || result.code !== 0) {
          yield put({ type: "errorHandle", payload: result ? result.message : "登录失败" });
          return;
        }

        if (tokenRes?.data?.data?.token) {
          window.sessionStorage.setItem("accessToken", tokenRes.data.data.token);
        }

        const { schoolId, ...resultData } = result.data || {};
        if (payload.remember) {
          window.localStorage.setItem("userInfo", JSON.stringify({ userAccount: payload.userAccount, userPwd: payload.userPwd }));
        } else {
          window.localStorage.removeItem("userInfo");
        }

        // 同步直接存入 sessionStorage，消除异步 put 的竞态导致后续页面请求拿不到 token
        window.sessionStorage.setItem("token", result.token || "");
        window.sessionStorage.setItem("userInfo", JSON.stringify({ ...resultData, schoolId: schoolId || 0 }));

        yield put({
          type: "user/updateUser",
          payload: {
            userInfo: { ...resultData, schoolId: schoolId || 0 },
            token: result.token
          }
        });

        if (!registry && window?.electronAPI) {
          window.electronAPI?.send("set-registry", payload.serialNum);
          window.electronAPI?.send('get-registry');
          window.electronAPI?.receive('registry-value', (data, event) => {
            if (data) {
              dispatch({ type: "user/updateRegistry", payload: data });
            }
          });
        }

        history.push("/teach/bookTeach");
        if (!teacherInfo && result.data) {
          const userInfo = {
            serialNum: payload.serialNum || registry,
            teacherId: result.data.userId,
            accessToken: result.data.accessToken
          };
          window?.electronAPI?.send('teacher-login', userInfo);
        }
        message.success("登录成功！", 1);
      } catch (e) {
        yield put({ type: "errorHandle", payload: e.message });
        return;
      }
    },
  },
  reducers: {
    errorHandle(_, { payload: message }) {
      return { errorMsg: { message, timeStamp: Date.now() } }
    }
  }
};