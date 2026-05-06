import { message } from 'antd';
import api from 'api';

import { pathToRegexp } from 'path-to-regexp';

const { queryCourse, addCourse, editCourse, delCourse,
  queryChapterList, addChapter, editChapter, delChapter,
  querySectionList, addSection, editSection, delSection,
  editerUploadFile, querySectionBySectionId, queryCourseCategoryTree,
  queryCourseDirectory
} = api;


export default {

  namespace: 'course',

  state: {
    courseClassify: [],
    courseDirectory: {},
    crtCourseInfo: {},
    crtSection: {},
  },

  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line
      return history.listen(({ pathname, state }) => {
        if (pathname === '/teach/bookTeach') {
          dispatch({ type: 'fetchCourseList' });
          // dispatch({ type: 'fetchCourseClassify' });
          return;
        }

        if (pathToRegexp('/teach/bookTeach', [], { end: false }).exec(pathname)) {
          if (!state || (!state.courseInfo && !state.sectionId)) {
            history.push({ pathname: "/teach/bookTeach" });
            return;
          }

          if (pathname === '/teach/bookTeach/catalog') {
            dispatch({ type: "updateState", payload: { crtCourseInfo: state.courseInfo } })
            dispatch({ type: 'fetchCourseDirectory', payload: { courseId: state.courseInfo.courseId } });
            return;
          }
          if (pathname === '/teach/bookTeach/bookPage') {
            dispatch({ type: 'fetchSectionDetail', payload: { sectionId: state.sectionId } });
            return;
          }
        }
      })
    },
  },

  effects: {
    * fetchCourseList({ }, { call, put, select }) {
      const { userType, userId, schoolId } = yield select(_ => _.user.userInfo);
      let queryParam = { schoolId: 0 }
      if (userType === 2) { // 用户
        queryParam = { schoolId: schoolId || 0, lecturerCommonUserId: userId };
      }
      else { // 管理员
        queryParam = { schoolId: schoolId || 0 };
      }
      const result = yield call(queryCourse, queryParam);
      if (result.code === 0) {
        yield put({ type: 'updateState', payload: { courseList: result.data } })
      }
      else {
        message.error(result.message, 3)
      }
    },
    *fetchCourseClassify(action, { call, put, select }) {  // eslint-disable-line
      const courseClassify = yield select(_ => _.courseClassify);
      if (courseClassify && courseClassify.length) {
        return;
      }
      const { schoolId } = select(_ => _.user.userInfo);
      const result = yield call(queryCourseCategoryTree, { schoolId: schoolId || 0 });
      if (result.code === 0) {
        yield put({ type: 'updateState', payload: { courseClassify: result.data } })
      }
      else {
        message.error(result.message, 3)
      }
    },
    *fetchCourseDirectory({ payload }, { call, put }) {
      const result = yield call(queryCourseDirectory, payload);
      if (result.code === 0) {
        yield put({ type: 'updateState', payload: { courseDirectory: result.data } });
        message.success("获取课本目录成功！");
      }
      else {
        result.msg && message.error("获取课程详情数据失败:" + result.msg);
      }
    },
    // queryChapterList, addChapter, editChapter, delChapter 
    * fetchChapterList({ payload }, { call, put }) {
      const result = yield call(queryChapterList, payload);
      if (result.code === 0) {
        yield put({ type: 'updateState', payload: { chapterList: result.data } })
      }
      else {
        message.error(result.message, 3)
      }
    },

    * fetchSectionDetail({ payload, callback }, { call, put, select }) {
      const result = yield call(querySectionBySectionId, payload);
      if (result.code === 0) {
        //如果是图片课，且section中的图片数量是奇数，则需要从下一个section多取一张图片出来
        const data = result.data;
        if (data?.sectionType == 2 && (data?.fileContent?.length % 2 != 0)) {
          const crtSectionId = data.sectionId;

          const directory = yield select(_ => _.course.courseDirectory);
          const chapterArr = directory.chapterArr;
          if (chapterArr && chapterArr instanceof Array) {
            var isCurrent = false; //遍历过程，先找到current section，再找下一个有图片的section
            // chapterArr.forEach((item, index) => {
            for (let item of chapterArr) {
              const sectionArr = item.sectionArr;
              if (sectionArr && sectionArr instanceof Array) {
                // sectionArr.forEach((section, order) => {
                for (let section of sectionArr) {
                  if (isCurrent == false) {
                    if (section.sectionId == crtSectionId) {
                      isCurrent = true;
                    }
                  } else {
                    const nextSectionId = section.sectionId;
                    const nextResult = yield call(querySectionBySectionId, { sectionId: nextSectionId });
                    if (nextResult.code === 0) {
                      const nextData = nextResult.data;
                      if (nextData?.fileContent && nextData?.fileContent?.length > 0) {
                        isCurrent = false; //找到了下一个有书页的再重置状态
                        const nextPage1st = nextData.fileContent[0];
                        data?.fileContent?.push(nextPage1st); //将下一个的第一页文件，放到本次的data数据
                      }
                    }
                  }
                }
              }
            }
          }
        }

        //TODO：上一段循环完之后，仍然是奇数页的话，即需要补一个空白页防错

        //将当前使用的section记录到local storage
        yield put({ type: 'setBookRecord', payload: { crtSection: data } });

        yield put({ type: 'updateState', payload: { crtSection: data } })
        message.success("获取书本页面成功！");
      }
      else {
        message.error(result.message, 3)
      }
    },
    //目录中，显示附件列表
    * fetchSectionAnnexList({ payload, callback }, { call }) {
      const result = yield call(querySectionBySectionId, payload);
      if (result.code === 0) {
        if (result.data?.fileAnnex) {
          callback(result.data?.fileAnnex);
        }
      }
    },
    //进入书页后，记录当前的书本记录到local storage
    * setBookRecord({ payload }, { select }) {
      const { courseDirectory, crtCourseInfo } = yield select(_ => _.course);
      const newData = {
        courseId: courseDirectory.courseId,
        courseTitle: courseDirectory.courseTitle,
        filePath: courseDirectory.filePath,
        courseCategoryName: courseDirectory.courseCategoryName,
        sectionId: payload.crtSection.sectionId,
        sectionTitle: payload.crtSection.sectionTitle,
        time: new Date().toISOString().slice(0, 10),
        crtCourseInfo: crtCourseInfo,
      };

      window.localStorage.setItem("bookRecord", JSON.stringify(newData));
    },
    * nextOrPreviousClass({ payload, callback }, { select }) {
      //payload： isNext, true表示为下一课，false表示上一课
      const { courseDirectory, crtSection } = yield select(_ => _.course);
      const crtSectionId = crtSection.sectionId;

      var targetSectionId = -1;

      const chapterArr = courseDirectory.chapterArr;
      if (chapterArr && chapterArr instanceof Array) {
        var isCurrent = false; //遍历过程，先找到current section，再找目标的section
        var previousSection = null; //记录上一个section
        for (let item of chapterArr) {
          const sectionArr = item.sectionArr;
          if (sectionArr && sectionArr instanceof Array) {
            for (let section of sectionArr) {
              if (isCurrent == false) {
                if (section.sectionId == crtSectionId) {
                  isCurrent = true;
                  if (payload.isNext == false) { //如果是上一课，找到当前课即可callback并退出
                    if (!previousSection) {
                      message.warn('本课程是第一课，无法上一课操作！');
                      return;
                    }

                    targetSectionId = previousSection.sectionId
                    break;
                  } else {
                    continue;
                  }
                }
              } else { //找到下一课，即可callback并退出
                const nextSectionId = section.sectionId;
                isCurrent = false; //找到了后的再重置状态

                targetSectionId = nextSectionId;
                break;
              }

              if (isCurrent == false && payload.isNext == false) {
                previousSection = section;
              }
            }

            if (targetSectionId > 0) {
              break;
            }
          }
        }
      }
      callback(targetSectionId);
    },
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    }
  },
};

