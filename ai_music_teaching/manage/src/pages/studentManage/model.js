import api from 'api';
import { message } from 'antd';

const {
  GetCollegeListAll, GetMajorBySchoolId, GetClassBySchoolId,
  AddCollege, DelCollege, EditCollege, GetCollegeBySchoolId,
  AddStand, DelStand, EditStand, GetStandListBySchoolId,
  AddMajor, DelMajor, EditMajor, GetMajorByCollegeId,
  AddClass, DelClass, EditClass, GetClassByMajorId,
  AddStudent, DelStudent, EditStudent, GetStudentViewList, ReSetStudentPassWord, MatchDelStudent,
  MatchAddStudentIDImgAPI, MatchAddSocietyStudentExecl, GetStudentExeclData,
  MatchAddStudent
} = api;


export default {
  namespace: 'organizationInfo',

  state: {
    classList: [],
    standList: [],
    collegeList: [],
    majorList: [],
    studentList: [],
    importedStudentList: [],
    crtSchoolId: undefined,
    crtMajorId: -1,
    // crtClassId: -1,
    errorImages: [],
  },

  subscriptions: {
    setupHistory({ dispatch, history }) {
      const check = ({ pathname }) => {
        if (pathname === "/studentManage/majorList") {
          dispatch({ type: "queryMajorList" })
          return;
        }
        if (pathname === "/studentManage/collegeList") {
          dispatch({ type: "queryCollegeList" })
          return;
        }
        if (pathname === "/studentManage/classList") {
          dispatch({ type: "queryClassList" })
          return;
        }
        if (pathname === "/studentManage/studentList") {
          dispatch({ type: "queryStudentList" })
          dispatch({ type: "queryClassList" });
          return;
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      })
    }
  },

  effects: {
    // 学生列表
    *createStudent({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }

      // const crtSchoolId = yield select(_=>_.organizationInfo.crtSchoolId);
      // let SchoolId = crtSchoolId||userInfo.schoolId||1
      const result = yield call(AddStudent, {
        ...payload,
        SchoolId: userInfo.schoolId
      });
      if (result.code == 1) {
        yield put({ type: 'queryStudentList' })
        message.success("新增学生成功", 3);

      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeStudent({ payload }, { call, put }) {
      const result = yield call(DelStudent, { Id: payload });
      if (result.code == 1) {
        yield put({ type: 'queryStudentList' })
        message.success("删除学生成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *resetStudentPassword({ payload }, { call, put }) {
      const result = yield call(ReSetStudentPassWord, { Id: payload });
      if (result.code == 1) {
        yield put({ type: 'queryStudentList' });
        message.success("重置学生密码成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyStudent({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      // const crtSchoolId = yield select(_ => _.organizationInfo.crtSchoolId);
      // let SchoolId = crtSchoolId || userInfo.schoolId || 1
      const result = yield call(EditStudent, {
        ...payload,
        SchoolId: userInfo.schoolId
      });
      if (result.code == 1) {
        yield put({ type: 'queryStudentList' })
        message.success("修改学生成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryStudentList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const result = yield call(GetStudentViewList, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { studentList: result.data } })
      }
      else {
        message.error(result.msg, 3);
      }
    },

    // 批量删除
    *batchRemoveStudent({ payload, callback }, { call, put }) {
      const result = yield call(MatchDelStudent, { DelStudentIdArr: payload });
      if (result.code == 1) {
        yield put({ type: 'queryStudentList' });
        // message.success("批量删除学生成功", 3);
        callback(result);
      }
      else {
        callback(result);
      }
    },

    // 班级列表
    *createClass({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      // const crtMajorId = yield select(_ => _.organizationInfo.crtMajorId);
      // if (!crtMajorId || crtMajorId == -1) {
      //     message.error("未选中当前专业");
      //     return;
      // }
      // const { crtSchoolId, majorList } = yield select(_ => _.organizationInfo);
      // let SchoolId = crtSchoolId || userInfo.schoolId || 1
      const result = yield call(AddClass, {
        ...payload, SchoolId: userInfo.schoolId, TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
      });
      if (result.code == 1) {
        yield put({ type: 'queryClassList' })
        message.success("新建班级成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeClass({ payload }, { call, put }) {
      const result = yield call(DelClass, { Id: payload });
      if (result.code == 1) {
        yield put({ type: 'queryClassList' })
        message.success("删除班级成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyClass({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      // const crtSchoolId = yield select(_ => _.organizationInfo.crtSchoolId);
      // let SchoolId = crtSchoolId || userInfo.schoolId || 1
      console.log("modifyClass payload:", payload);
      const result = yield call(EditClass, {
        ...payload, // "ClassName":"珠宝专业2", "ClassId":2
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
        SchoolId: userInfo.schoolId,
      });
      if (result.code == 1) {
        yield put({ type: 'queryClassList' })
        message.success("修改班级成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryClassListByMajorId({ payload }, { call, put, select }) {  // eslint-disable-line
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      let newMajorId = 1;
      if (!payload || payload == -1) {
        const crtMajorId = yield select(_ => _.organizationInfo.crtMajorId);
        if (!crtMajorId || crtMajorId == -1) {
          message.error("未选中当前专业, 默认为第一个专业");
          yield put.resolve({ type: "queryMajorList" })
        }
        else {
          newMajorId = crtMajorId;
        }
      }
      else {
        newMajorId = payload;
      }
      const result = yield call(GetClassByMajorId, { MajorId: newMajorId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { classList: result.data, crtMajorId: newMajorId } })
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryClassList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const { majorList } = yield select(_ => _.organizationInfo);
      // let SchoolId = crtSchoolId||userInfo.schoolId||1
      let SchoolId = userInfo.schoolId
      const result = yield call(GetClassBySchoolId, { SchoolId });
      if (result.code == 1) {
        if (!majorList || majorList.length === 0) {
          yield put({ type: "queryMajorList" })
        }
        yield put({ type: 'updateState', payload: { classList: result.data } })
      }
      else {
        message.error(result.msg, 3);
      }
    },

    *createMajor({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      // const crtSchoolId = yield select(_ => _.organizationInfo.crtSchoolId);
      // let SchoolId = crtSchoolId || userInfo.schoolId || 1
      const result = yield call(AddMajor, {
        ...payload, SchoolId: userInfo.schoolId, TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
      });
      if (result.code == 1) {
        yield put({ type: 'queryMajorList' })
        message.success("新增专业成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeMajor({ payload }, { call, put }) {
      const result = yield call(DelMajor, { MajorId: payload });
      if (result.code == 1) {
        yield put({ type: 'queryMajorList' })
        message.success("删除专业成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyMajor({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      // const crtSchoolId = yield select(_ => _.organizationInfo.crtSchoolId);
      // let SchoolId = crtSchoolId || userInfo.schoolId || 1
      const result = yield call(EditMajor, {
        ...payload, // "MajorName":"珠宝专业2", "MajorId":2
        SchoolId: userInfo.schoolId,
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
      });
      if (result.code == 1) {
        yield put({ type: 'queryMajorList' })
        message.success("修改专业成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    // *queryMajorListByCollegeId({ payload }, { call, put, select }) {
    //     const userInfo = yield select(_ => _.user.userInfo);
    //     if (!userInfo) {
    //         message.error("未查询到用户信息", 3)// 3秒关闭
    //         return;
    //     }

    //     const result = yield call(GetMajorByCollegeId, { CollegeId: payload });
    //     if (result.code == 1) {
    //         yield put({ type: 'updateState', payload: { majorList: result.data} })
    //     }
    //     else {
    //         message.error(result.msg, 3);
    //     }
    // },
    *queryMajorList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const { crtSchoolId, collegeList } = yield select(_ => _.organizationInfo);
      // let SchoolId = crtSchoolId || userInfo.schoolId || 1
      const result = yield call(GetMajorBySchoolId, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        if (!collegeList || collegeList.length === 0) {
          yield put({ type: "queryCollegeList" });
        }
        yield put({ type: 'updateState', payload: { majorList: result.data } })
      }
      else {
        message.error(result.msg, 3);
      }
    },

    *createCollege({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const result = yield call(AddCollege, {
        ...payload, SchoolId: userInfo.schoolId, TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,

      });
      if (result.code == 1) {
        yield put({ type: 'queryCollegeList' })
        message.success("新增学院成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeCollege({ payload }, { call, put }) {
      const result = yield call(DelCollege, { Id: payload });
      if (result.code == 1) {
        yield put({ type: 'queryCollegeList' })
        message.success("删除学院成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyCollege({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      let SchoolId = userInfo.schoolId
      const result = yield call(EditCollege, { ...payload, SchoolId });
      if (result.code == 1) {
        yield put({ type: 'queryCollegeList' })
        message.success("修改学院成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryCollegeList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || userInfo.userType == undefined) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const result = yield call(GetCollegeBySchoolId, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { collegeList: result.data } })
      }
      else {
        message.error(result.msg, 3);
      }
    },

    *createStand({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const result = yield call(AddStand, {
        ...payload, SchoolId: userInfo.schoolId, TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,

      });
      if (result.code == 1) {
        yield put({ type: 'queryStandList' })
        message.success("新增站点成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *removeStand({ payload }, { call, put }) {
      const result = yield call(DelStand, { Id: payload });
      if (result.code == 1) {
        yield put({ type: 'queryStandList' })
        message.success("删除站点成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *modifyStand({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      let SchoolId = userInfo.schoolId
      const result = yield call(EditStand, { ...payload, SchoolId });
      if (result.code == 1) {
        yield put({ type: 'queryStandList' })
        message.success("修改站点成功", 3);
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryStandList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo || userInfo.userType == undefined) {
        message.error("未查询到用户信息", 3)// 3秒关闭
        return;
      }
      const result = yield call(GetStandListBySchoolId, { SchoolId: userInfo.schoolId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { standList: result.data } })
      }
      else {
        message.error(result.msg, 3);
      }
    },

    *importStudentImages({ payload }, { call, put }) {
      const result = yield call(MatchAddStudentIDImgAPI, payload);

      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { errorImages: result.data } });
        if (result.data.length == 0) {
          message.success('导入完成，没有错误信息！');
        } else {
          message.info('导入完成，存在错误信息，失败照片请查看错误信息显示区域！');
        }
      } else {
        message.error('导入学生照片失败：' + result.msg);
      }
    },
    *studentImport({ payload, callback }, { call, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      try {
        let result = null;
        if (payload.studentType === "school") {
          result = yield call(GetStudentExeclData, { fileData: payload.fileData, SchoolId: userInfo.schoolId });
        }
        else if (payload.studentType === "social") {
          result = yield call(MatchAddSocietyStudentExecl, { fileData: payload.fileData, SchoolId: userInfo.schoolId, standId: payload.standId });
        }
        if (result.code == 1) {
          // yield put({ type: 'updateState', payload: {importedStudentList: result.data } })
          callback(result)
        }
        else {
          message.error(result.msg, 3)
        }
      }
      catch (e) {
        callback({ code: 0, msg: e.message })
      }

    },
    *comfirmStudentImport({ payload, callback }, { call, select }) {
      const userInfo = yield select(_ => _.user.userInfo);

      const result = yield call(MatchAddStudent,
        payload
        // {
        //     SchoolId: userInfo.schoolId,
        //     TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
        //     StudentList: payload
        // }
      );
      if (result.code == 1) {
        // yield put({ type: 'updateState', payload: {importedStudentList: result.data } })
        callback(result)
      }
      else {
        message.error(result.msg, 3)
      }
    }
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
};
