import { message } from 'antd';
import api from 'api'

const { SchoolList, AddSchool, DelSchool, EditSchool } = api

export default {
  namespace: 'schoolInfo',
  state: {
    schoolList: []
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/schoolManage") {
          dispatch({ type: 'querySchoolList' })
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      })
    },
  },

  effects: {
    *querySchoolList({ callback }, { call, put }) {  // eslint-disable-line
      const result = yield call(SchoolList);
      if (result.code == 1) {
        let firstSchoolId = 0;
        if (result.data?.length > 0) {
          firstSchoolId = result.data[0]?.Id;
        }
        yield put({
          type: 'updateState', payload: {
            schoolList: result.data,
          }
        });
        yield put({ type: "user/adminChangeSchool", payload: firstSchoolId }); //添加了管理员登录后默认schoolId设置的功能
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *createSchool({ payload }, { call, put }) {
      const result = yield call(AddSchool, payload);
      if (result.code == 1) {
        yield put({ type: 'querySchoolList' })
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeSchool({ payload }, { call, put }) {
      const result = yield call(DelSchool, { Id: payload });
      if (result.code == 1) {
        yield put({ type: 'querySchoolList' })
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifySchool({ payload }, { call, put }) {
      console.log('modify school', payload);
      const result = yield call(EditSchool, payload);
      if (result.code == 1) {
        yield put({ type: 'querySchoolList' })
      }
      else {
        message.error(result.msg, 3);
      }
    },
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
};
