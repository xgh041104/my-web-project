import { history } from 'umi'
import api from 'api'
import { setFilePrefix, filePrefix } from 'urlList'
import { pathToRegexp } from 'path-to-regexp'
// import {setUserInfo} from '@/models/user'
// import { setIsLogin } from '../../models/user';

const { LoginAdmin, LoginTeacher, GetHttpUrl, LoginStandUser } = api

export default {
  namespace: 'login',
  state: { errorMsg: { message: null, timeStamp: 0 } },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = (pathname) => {
        if (pathToRegexp("/login").exec(pathname)) {
          dispatch({ type: 'logout' });
          dispatch({ type: 'queryFileAddr' });
        }
      }
      check(history.location.pathname);
      return history.listen(({ location: { pathname } }) => {
        check(pathname);
      })
    },
  },
  effects: {
    *loginAdmin({ payload }, { put, call }) {
      try {
        const result = yield call(LoginAdmin, payload);
        if (result.code === 1) {
          yield put({
            type: "user/updateUser",
            payload: {
              userInfo: {
                isLogin: true, userName: result.data.AdminName,
                userId: result.data.Id, userType: 0, account: result.data.AdminAccount, schoolId: 0
              },
              token: result.token
            }
          });
          history.push('/selfInfo');
          yield put({ type: "schoolInfo/querySchoolList" })
        } else {
          yield put({ type: "errorHandle", payload: result.msg || "未知错误！" });
        }
      } catch (err) {
        console.error(err);
        yield put({ type: "errorHandle", payload: err.message || "未知错误！" });
      }
    },
    *loginTeacher({ payload }, { put, call }) {
      try {
        const result = yield call(LoginTeacher, payload)
        if (result.code === 1) {
          yield put({
            type: "user/updateUser",
            payload: {
              userInfo: {
                isLogin: true, userName: result.data.TeacherName,
                userId: result.data.TeacherId, userType: 1,
                userSex: result.data.Sex, account: result.data.TeacherAccount,
                schoolId: result.data.SchoolId,
                phoneNumber: result.data.PhoneNumber,
                email: result.data.Email,
                title: result.data.TeacherTitle
              },
              token: result.token
            }
          });
          yield put({ type: "schoolInfo/querySchoolList" })
          history.push('/selfInfo');
        } else {
          yield put({ type: "errorHandle", payload: result.msg || "未知错误！" });
        }
      } catch (err) {
        console.error(err);
        yield put({ type: "errorHandle", payload: err.message || "未知错误！" });
      }
    },
    *logout(_, { put, call }) {
      yield put({ type: 'user/logoutUser' });
    },
    *queryFileAddr({ }, { call }) {
      const result = yield call(GetHttpUrl)
      if (result.code === 1) {
        if (result.data.StaticResourcesType != 1 && result.data.OSShttp && result.data.OSShttp !== "") {
          setFilePrefix(result.data.OSShttp)
          console.log('修改文件服务器地址成功', filePrefix());
          return;
        }
        console.warn('无效文件服务器地址', result.data.OSShttp, result.data.StaticResourcesType, result.msg);
      }
      else {
        console.warn('获取文件服务器地址失败', result.msg);
      }
    },
    *loginStandUser({ payload }, { put, call }) {
      try {
        const result = yield call(LoginStandUser, payload)
        if (result.code === 1) {
          yield put({
            type: "user/updateUser",
            payload: {
              userInfo: {
                isLogin: true, userName: result.data.StandName,
                userId: result.data.StandId, userType: 2,
                userSex: result.data.Sex, account: result.data.StandAccount,
                schoolId: result.data.SchoolId,
                phoneNumber: result.data.PhoneNumber,
                email: result.data.Email,
                title: result.data.StandTitle
              },
              token: result.token
            }
          });
          history.push('/scoreQuery');
        } else {
          yield put({ type: "errorHandle", payload: result.msg || "未知错误！" });
        }
      } catch (err) {
        console.error(err);
        yield put({ type: "errorHandle", payload: err.message || "未知错误！" });
      }
    },
  },
  reducers: {
    errorHandle(_, { payload: message }) {
      return { errorMsg: { message, timeStamp: Date.now() } }
    }
  }
};
