import { history } from 'umi';
import { message } from 'antd';
import api, { AddCheatWarning } from 'api';
import { pathToRegexp } from 'path-to-regexp'
import { filePrefix, setFilePrefix } from 'urlList';
import base64ToBlob from 'utils/image2blob';
import { delay } from 'redux-saga';
import dayjs from 'dayjs'

const { LoginStudentAPI, GetHttpUrl, UploadStudentRemainImg, GetSystemTimeAPI } = api

export default {
  namespace: 'login',
  state: { errorMsg: { message: null, timeStamp: 0 } },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathToRegexp("/login").exec(pathname)) {
          try {
            const userInfoStr = window.sessionStorage.getItem("userInfo");
            if (userInfoStr) {
              const userInfo = JSON.parse(userInfoStr);
              if (userInfo && userInfo.isLogin) {
                history.push({ pathname: '/exam' });
                return;
              }
            }
          } catch (e) {
            console.error("Auto-redirect check failed:", e);
          }
          // 如果是登录页面，则查询文件服务器地址
          dispatch({ type: 'queryFileAddr' });
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      });
    }
  },
  effects: {
    *loginStudent({ payload, callback }, { put, call, select }) {
      try {
        // console.log(payload)
        const data = yield call(LoginStudentAPI, payload)
        if (data.code === 1) {
          // 判定考生有效考试时间
          const timeRange = data.data?.ExamTimeRange?.split(',').map(item => dayjs.unix(parseInt(item))) || null;
          const { data: currentTime } = yield call(GetSystemTimeAPI);
          if (timeRange && timeRange.length === 2 && dayjs(currentTime).isValid()
            && (dayjs(currentTime).isBefore(timeRange[0]) || dayjs(currentTime).isAfter(timeRange[1]))) {
            yield put({ type: "errorHandle", payload: "当前时间不在考试时间范围内" });
            return;
          }

          yield put({
            type: "user/updateUser",
            payload: {
              userInfo: {
                isLogin: true, userName: data.data.TrueName,
                userId: data.data.Id, userType: data.data.StudentType,
                account: data.data.StudentAccount, password: data.data.StudentPwd,
                schoolId: data.data.SchoolId,
              },
              token: data.token,
              IDImage: data.data.IDImage
            }
          });
          history.push({ pathname: '/exam' });
          message.success("登录成功！", 3);
        } else {
          yield put({ type: "errorHandle", payload: data.msg });
        }
      } catch (err) {
        console.error(err);
        yield put({ type: "errorHandle", payload: err.message || "未知错误！" });
      }
      finally {
        callback?.({ loading: false });
      }
    },
    *queryFileAddr({ }, { call }) {
      const result = yield call(GetHttpUrl)
      if (result.code === 1) {
        if (result.data.StaticResourcesType != 1 && result.data.OSShttp && result.data.OSShttp !== "") {
          setFilePrefix(result.data.OSShttp)
          // console.log('修改文件服务器地址成功', filePrefix());
          return;
        }
        // console.log('未使用oss地址', result.data.OSShttp, result.data.StaticResourcesType, result.msg);
      }
      else {
        console.warn('获取文件服务器地址失败', result.msg);
      }
    },
  },

  reducers: {
    errorHandle(_, { payload: message }) {
      return { errorMsg: { message, timeStamp: Date.now() } }
    }
  }
};
