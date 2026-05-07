import { message } from 'antd';
import api from 'api';

const {
  SchoolList, GetTeacherListAPI, GetTeacherInfoByIdAPI,
  AddTeacherAPI, EditTeacherAPI, DeleteTeacherAPI, EditTeacherPassWordByIdAPI
} = api;

export default {
  namespace: 'teacherManage',
  state: {
    teacherList: [],
    schoolList: [],
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname }) => {
        if (pathname === '/teachermanage/teacherlist') {
          dispatch({
            type: 'queryTeacherList',
          });
          dispatch({
            type: 'querySchoolList',
          })
        }
      };
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      });
    },
  },

  effects: {
    *queryTeacherList(_, { call, put }) {
      const result = yield call(GetTeacherListAPI);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { teacherList: result.data } });
      } else {
        message.error('拉取老师用户列表出错', 3);
      }
    },
    *querySchoolList(_, { call, put }) {
      const result = yield call(SchoolList);
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { schoolList: result.data } });
      } else {
        message.error('拉取学校数据出错', 3);
      }
    },
    *addTeacher({ payload }, { call, put }) {
      const result = yield call(AddTeacherAPI, payload);
      if (result.code == 1) {
        message.success('新增老师成功!\r\n账号：' + payload.TeacherAccount + "\r\n密码：" + payload.TeacherPassword, 3);
        yield put({ type: 'queryTeacherList' });
      } else {
        message.error('添加老师出错', 3);
      }
    },
    *editTeacherInfo({ payload }, { call, put }) {
      const result = yield call(EditTeacherAPI, payload);
      if (result.code == 1) {
        message.success('编辑老师信息成功');
        yield put({ type: 'queryTeacherList' });
      } else {
        message.error('编辑老师出错', 3);
      }
    },
    *editPassword({ payload }, { call, put }) {
      const result = yield call(EditTeacherPassWordByIdAPI, payload);
      if (result.code == 1) {
        message.success('编辑老师密码成功');
        yield put({ type: 'queryTeacherList' });
      } else {
        message.error('编辑老师密码出错', 3);
      }
    },
    *deleteTeacher({ payload }, { call, put }) {
      const result = yield call(DeleteTeacherAPI, payload);
      if (result.code == 1) {
        message.success('删除老师信息成功');
        yield put({ type: 'queryTeacherList' });
      } else {
        message.error('删除老师出错', 3);
      }
    },
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
