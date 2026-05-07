import { message } from 'antd';
import api from 'api';

const {
  GetCourseListByTeacherIdAPI, GetCollegeBySchoolId, GetMajorByCollegeId,
  AddCourseAPI, EditCourseAPI, EditCourseFileAPI,
  GetClassStudentsBySchoolIdAPI, GetCourseClassRelationByIdAPI, EditClassRelationAPI, DelCourseAPI, CourseCancel,
  GetChapterByCourseId, GetChapterById, AddChapter, EditChapter, DelChapter,
  UploadChapterVideoFile, UploadChapterFile, UpdateChapterOrder,
  GetCouresStudyPlanByCourseId
} = api;

export default {
  namespace: 'lessonManage',
  state: {
    lessonList: [],
    lessonDetail: {},
    collegeList: [],
    majorList: [],
    crtCourse: { name: "", ID: null, status: 0 },
    chapterList: [],
    classStudentList: [],
    courseRelation: {},
    attachFilePath: "",
    lessonProgressData: [],
    lessonListLastPage: 1
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      const check = ({ pathname, state }) => {
        if (pathname === "/lessonManage/lessonList") {
          dispatch({ type: 'queryLessonList' });
          dispatch({ type: 'queryDefaultCollege' });
        }
        else if (pathname === "/lessonManage/editlesson") {
          console.log("state:", state);
          if (state && state.lessonId) {
            dispatch({ type: 'queryCourseDetail', payload: state.lessonId });
          }
        }
        else if (pathname === "/lessonManage/chapterList") {
          if (state && state.courseId) {
            dispatch({ type: 'queryChapterList', payload: state });
          }
          else {
            const timerId = setTimeout(() => {
              // 直接调用history.push不会触发history.listen的回调函数
              history.push("/lessonManage/lessonList")
              clearTimeout(timerId);
            }, 0);
          }
        }
      }
      check(history.location);
      return history.listen(({ location }) => {
        check(location);
      })
    }
  },
  effects: {
    *queryLessonList(_, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin) {
        console.log("queryLessonList teacher unlogin")
        return;
      }
      const result = yield call(GetCourseListByTeacherIdAPI, {
        TeacherId: userInfo.userType != 1 ? "0" : userInfo.userId, //管理员则用teacherId 0，查所有
      });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { lessonList: result.data } });
      } else {
        message.error(result.msg, 3);
      }
    },
    *queryCourseDetail({ payload }, { call, put, select }) { //payload: lessonId
      const lessonList = yield select(_ => _.lessonManage.lessonList);
      const userInfo = yield select(_ => _.user.userInfo);
      const adminSchoolId = yield select(_ => _.user.adminSchoolId);
      const detail = lessonList?.filter((item) => {
        return (item.Id == payload);
      })
      if (detail.length == 1) {
        yield put({ type: 'updateState', payload: { lessonDetail: detail[0] } });
        yield put({ type: 'queryClassStudentList', payload: (userInfo.userType == 1) ? (userInfo.schoolId) : (adminSchoolId) });
        yield put({ type: 'queryCourseRelation', payload });
        yield put({ type: 'queryMajorByCollegeId', payload: detail[0].CollegeId })
      } else {
        message.error("课程编辑详情为空或获取数据出错", 3);
      }
    },
    *queryCourseRelation({ payload }, { call, put, select }) { //payload: CourseId
      const result = yield call(GetCourseClassRelationByIdAPI, { CourseId: payload });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { courseRelation: result.data } });
      } else {
        message.error(result.msg, 3);
      }
    },
    *editCourseRelation({ payload }, { call, put }) {
      const result = yield call(EditClassRelationAPI, payload);
      if (result.code == 1) {
        // yield put({ type: 'queryCourseDetail' }, payload.Id);
        message.success("修改关系完成");
      } else {
        message.error(result.msg, 3);
      }
    },
    *queryDefaultCollege(_, { put, select }) { //用登录的教师schoolId查询
      const userInfo = yield select(_ => _.user.userInfo);
      const adminSchoolId = yield select(_ => _.user.adminSchoolId);
      if (userInfo.isLogin) {
        yield put({ type: 'queryCollegeBySchoolId', payload: (userInfo.userType == 1) ? (userInfo.schoolId) : (adminSchoolId) });
      }
    },
    *queryCollegeBySchoolId({ payload }, { call, put, select }) {
      const result = yield call(GetCollegeBySchoolId, { SchoolId: payload });
      if (result.code == 1) {
        if (!result.data) { //data为空时，需要手动置空，因为后面有数组操作，如果不置空[]，数组操作会报错
          yield put({ type: 'updateState', payload: { collegeList: [] } });
          return;
        }
        yield put({ type: 'updateState', payload: { collegeList: result.data } });

      } else {
        message.error(result.msg, 3);
      }
    },
    *queryMajorByCollegeId({ payload }, { call, put }) {
      const result = yield call(GetMajorByCollegeId, { CollegeId: payload });
      if (result.code == 1) {
        if (!result.data) {//data为空时，需要手动置空，因为后面有数组操作，如果不置空[]，数组操作会报错
          yield put({ type: 'updateState', payload: { majorList: [] } });
          return;
        }
        yield put({ type: 'updateState', payload: { majorList: result.data } });

      } else {
        message.error(result.msg, 3);
      }
    },
    *teacherAddLesson({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      // if (userInfo.userType != 1 || !userInfo.isLogin) {
      //     return;
      // }
      if (!userInfo) {
        console.log('未查询到用户信息');

        return;
      }
      const data = {
        ...payload,
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
        SchoolId: userInfo.schoolId,
      }
      const result = yield call(AddCourseAPI, data);
      if (result.code == 1) {
        yield put({ type: 'queryLessonList' })
        message.success("新建完成");
      } else {
        message.error(result.msg, 3);
      }
    },
    *editLessonInfo({ payload }, { call, put, select }) {
      const userInfo = yield select(_ => _.user.userInfo);
      if (!userInfo.isLogin) {
        return;
      }
      const data = {
        ...payload,
        TeacherId: userInfo.userType != 1 ? 0 : userInfo.userId,
        SchoolId: userInfo.schoolId,
      }
      const result = yield call(EditCourseAPI, data);
      if (result.code == 1) {
        message.success("修改基本信息完成");
      } else {
        message.error(result.msg, 3);
      }
    },
    *deleteLesson({ payload }, { call, put }) {
      const result = yield call(DelCourseAPI, payload);
      if (result.code == 1) {
        message.success("删除课程成功");
        yield put({ type: 'queryLessonList' });
      } else {
        message.error(result.msg, 3);
      }
    },
    *copyNewLesson({ payload }, { call, put }) {
      const result = yield call(CourseCancel, payload);
      if (result.code == 1) {
        message.success("复制课程成功");
        yield put({ type: 'queryLessonList' });
      } else {
        message.error(result.msg, 3);
      }
    },
    *teacherAddLessonImage({ payload }, { call, put, }) {
      const result = yield call(EditCourseFileAPI, payload);
      if (result.code == 1) {
        message.success("图片更新完成");
      } else {
        message.error(result.msg, 3);
      }
    },
    *queryClassStudentList({ payload }, { call, put, select }) { //payload: SchoolId
      const result = yield call(GetClassStudentsBySchoolIdAPI, { SchoolId: payload });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { classStudentList: result.data } });
      } else {
        message.error(result.msg, 3);
      }
    },

    *createChapter({ payload, callback }, { call, put }) {
      if (payload.ChapterType !== "0" && payload.ChapterType != "1") {
        message.error("无效课程类型！", 5);
        console.warn("无效课程类型");
        return;
      }
      callback({ statusText: "正在上传课程信息", statusCode: 1 });
      let result = yield call(AddChapter, {
        "ChapterName": payload.ChapterName,
        "CourseId": payload.CourseId,
        "ChapterType": payload.ChapterType,
        "ChapterContent": payload.ChapterType == "1" ? "" : payload.ChapterRichText,
        fileData: !payload.FileInfo ? [] : payload.FileInfo.map((item) => {
          return item.originFileObj;
        }),
        onUploadProgress: payload.onUploadProgress
      });
      if (result.code == 1) {
        if (payload.ChapterType == "1" && payload.ChapterVideoContent) {// 视频课上传视频
          const newChapter = JSON.parse(result.data)
          if (!newChapter) {
            console.warn("获取新建视频课ID失败");
            console.log('上传视频课失败');
            message.error("上传视频课失败");
          }
          else {
            callback({ statusText: "正在上传视频课", statusCode: 2 });
            result = yield call(UploadChapterVideoFile, {
              "ChapterId": newChapter.ChapterId,
              "fileData": [payload.ChapterVideoContent],
              "onUploadProgress": payload.onUploadProgress
            });
            callback({ statusText: "上传视频课完成", statusCode: 0 });
            if (result.code == 1) {
              console.log('上传视频课成功');
              message.success("上传视频课成功");
            }
            else {
              console.log('上传视频课失败');
              message.error("上传视频课失败");
            }
          }
          callback({ statusText: "上传视频课完成", statusCode: 0 });
          yield put({ type: 'queryChapterList' });
          return;
        }
        callback({ statusText: "上传图文课完成", statusCode: 0 });
        yield put({ type: 'queryChapterList' });
        console.log('新增图文课成功');
        message.success("新增图文课成功");
      }
      else {
        console.log('新增章节失败');
        message.error("新增章节失败");
      }
    },
    * removeChapter({ payload }, { call, put }) {
      const result = yield call(DelChapter, { ChapterId: payload });
      if (result.code == 1) {
        console.log('删除章节成功');
        message.success("删除章节成功");
        yield put({ type: 'queryChapterList' })
      }
      else {
        console.log('删除章节失败', result);
        message.error(result.msg, 3)
      }
    },
    *modifyChapter({ payload, callback }, { call, put }) {
      if (payload.ChapterType !== "0" && payload.ChapterType != "1") {
        message.error("无效课程类型！", 5);
        console.warn("无效课程类型");
        return;
      }
      callback({ statusText: "正在上传课程", statusCode: 1 });
      let result = yield call(EditChapter, {
        "Id": payload.Id,
        "ChapterName": payload.ChapterName,
        "CourseId": payload.CourseId,
        "ChapterType": payload.ChapterType,
        "RemoveFile": payload.RemoveFile,
        "ChapterContent": payload.ChapterType === "0" ? payload.ChapterRichText :
          (payload.isRMVideo ? "-1" : ""),
        fileData: !payload.FileInfo ? [] : payload.FileInfo.map((item) => {
          return item.originFileObj;
        }),
        onUploadProgress: payload.onUploadProgress
      });
      if (result.code == 1) {
        if ((payload.isRMVideo && !payload.ChapterVideoContent) || payload.ChapterType == "0") {
          callback({ statusText: "修改课程章节完成", statusCode: 0 });
          yield put({ type: 'queryChapterList' });
          console.log('修改课程章节成功');
          message.success("修改课程章节成功");
          return;
        }
        if (payload.ChapterType == "1" && payload.ChapterVideoContent) {// 视频课上传视频
          callback({ statusText: "正在上传视频课", statusCode: 2 });
          result = yield call(UploadChapterVideoFile, {
            "ChapterId": payload.Id,
            "fileData": [payload.ChapterVideoContent],
            "onUploadProgress": payload.onUploadProgress
          });
          callback({ statusText: "上传视频课完成", statusCode: 0 });
          if (result.code == 1) {
            console.log('修改课程章节成功');
            message.success("修改课程章节成功");
          }
          else {
            console.log('上传视频课失败');
            message.error("上传视频课失败");
          }
          yield put({ type: 'queryChapterList' });
          return;
        }
        callback({ statusText: "异常", statusCode: 0 });
        console.warn('修改课程章节异常');
        message.warning("修改课程章节异常");
        return;
      }
      callback({ statusText: "失败", statusCode: 0 });
      console.log('修改课程章节失败，' + result.msg);
      message.error("修改课程章节失败：" + result.msg);
    },
    * uploadChapterContentFile({ payload, callback }, { call, put, select }) {
      try {
        const userInfo = yield select(_ => _.user.userInfo);
        const result = yield call(UploadChapterFile, { SchoolId: userInfo.schoolId, ...payload });
        callback(result);
      } catch ({
        success,
        statusCode,
        message: msg,
      }) {
        callback({ code: 0, msg: JSON.stringify(message) + ", error code = " + statusCode });
      }
    },
    * queryChapter({ payload, callback }, { call, put, select }) {
      const result = yield call(GetChapterById, payload);
      if (result.code == 1) {
        // yield put({ type: 'updateState', payload: {"":result.data} })
        callback(result.data)
      }
      else {
        message.error(result.msg, 3)
      }
    },
    * queryChapterList({ payload }, { call, put, select }) {
      // let { courseId, courseName } = payload
      let courseId = null;
      let courseName = null;
      let courseStatus = 0;
      if (!payload) {
        const crtCourse = yield select(_ => _.lessonManage.crtCourse);
        courseId = crtCourse.ID;
        courseName = crtCourse.name;
        courseStatus = crtCourse.status;
      } else {
        ({ courseId, courseName, courseStatus } = payload)
      }
      if (!courseId) {
        console.log('无效课程ID');
        message.error('无效课程ID', 3);
        return;
      }
      const result = yield call(GetChapterByCourseId, { CourseId: courseId });
      if (result.code == 1) {
        yield put({ type: 'updateState', payload: { chapterList: result.data, crtCourse: { name: courseName, ID: courseId, status: courseStatus } } })
      }
      else {
        message.error(result.msg, 3);
      }
    },
    *queryCourseProgress({ payload, callback }, { call, put, select }) { //payload: lessonId
      const result = yield call(GetCouresStudyPlanByCourseId, payload);
      if (result.code == 1) {
        // yield put({ type: 'updateState', payload: {lessonProgressData:result.data} })
        callback(result.data);
      }
      else {
        message.error(result.msg, 3)
      }
    },
    *modifyChapterOrder({ payload }, { call, put, select }) {
      const result = yield call(UpdateChapterOrder, payload);
      if (result.code == 1) {
        // callback(result.data);
        yield put({ type: 'queryChapterList' });
        message.success('修改列表排序成功');
      }
      else {
        message.error('修改列表排序失败：' + result.msg, 3)
      }
    }
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
