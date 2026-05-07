import { message } from 'antd';
import { history } from 'umi';
import api from 'api';

const { modifyTeacherAPI, modifyTeacherPWDAPI, modifyStudentAPI, modifyStudentPWDAPI } = api

export default {
  namespace: 'user',
  state: {
    userInfo: {
      isLogin: false,
      userName: "",
      account: "",
      userId: -1,
      userType: -1,  //用户类型，-1：未登录或未知用户，0：管理员，1：老师， 2：学生……
      userSex: -1,
    },
    token: "",
    pathname: "",
    adminSchoolId: undefined
  },
  subscriptions: {
    // 只在第一次访问或者刷新浏览器时才触发此函数
    setup({ history, dispatch }) {
      const check = ({pathname,state}) => {
        dispatch({ type: "updatePathname", payload: pathname });
        if (pathname == "/scoreQuery" || pathname == "/getGradesLogin") return;
        dispatch({ type: 'query', payload: pathname });
      }
      check(history.location);
      return history.listen(({location}) => {
        check(location);
      });
    },
  },
  effects: {
    *query({ payload }, { select, put }) {
      try {
        let userInfo = null;
        // 先从sessionStorage获取userInfo
        const userInfoStr = window.sessionStorage.getItem("userInfo");
        if (userInfoStr) {
          userInfo = JSON.parse(userInfoStr, userInfo);
          //这里在重复刷新的时候，会读取缓存值，而state中值并未改变
          yield put({ type: "syncUser", payload: { userInfo: userInfo } });
        }
        else {
          // 或从state里获取userInfo
          userInfo = yield select(_ => _.user.userInfo);
        }
        // console.log("get user info: " + JSON.stringify(userInfo))
        if (!userInfo || !userInfo.isLogin) {
          history.push({ pathname: '/login' });
          return;
        }

      } catch (error) {
        console.error(error);
      }
    },
    *modifyUserInfo({ payload }, { select, call, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("用户未登录！", 5)
        return;
      }
      const userReuqests = {
        1: {
          method: modifyTeacherAPI,
          params: {
            "Id": userInfo.userId,
            "Teacher_Name": payload.userName,
            "Sex": payload.sex
          }
        },
        2: {
          method: modifyStudentAPI,
          params: {
            Id: userInfo.userId,
            "Student_Name": payload.userName,
            "Sex": payload.sex,
            "Student_Pwd": "",
            "Class_Id": userInfo.userClassId,
          }
        }
      }
      const result = yield call(userReuqests[userInfo.userType].method, userReuqests[userInfo.userType].params);
      if (result.code == 1) {
        message.success("修改信息成功!", 3);
        // yield put({ type: "queryStudentsInfo", payload: currentClassId });
        yield put({
          type: "updateUser", payload: {
            userInfo: { ...userInfo, userName: payload.userName, userSex: payload.sex }
          }
        });
      } else {
        message.error("修改信息失败：" + result.msg, 3);
      }
    },
    *modifyUserPassword({ payload }, { select, call, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("用户未登录！", 5)
        return;
      }

      const userReuqests = {
        1: {
          method: modifyTeacherPWDAPI,
          params: {
            "Id": userInfo.userId,
            "Teacher_Pwd": payload,
          }
        },
        2: {
          method: modifyStudentPWDAPI,
          params: {
            "Id": userInfo.userId,
            "Student_Pwd": payload,
          }
        }
      }
      const result = yield call(userReuqests[userInfo.userId].method, userReuqests[userInfo.userId].params);
      if (result.code == 1) {
        message.success("修改密码成功!", 3);
        // yield put({ type: "queryStudentsInfo", payload: currentClassId });
      } else {
        message.error("修改密码失败：" + result.msg, 3);
      }
    },
    *adminChangeSchool({ payload }, { select, call, put }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("用户未登录！", 5)
        return;
      }
      yield put({
        type: "updateUser", payload: {
          userInfo: {
            ...userInfo,
            schoolId: payload // schoolId放到userInfo中可以调用老师的相关接口
          },
          adminSchoolId: payload // 额外记录schoolId
        }
      })
      // history.go(0)
    }
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
    logoutUser(state, { }) {
      //退出登录时，清空state和storage
      const initInfo = {
        userInfo: {
          isLogin: false,
          userName: "",
          account: "",
          userId: -1,
          userType: -1, //0:admin 1:teacher
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
  }
}
