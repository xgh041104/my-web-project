export default {
  namespace: 'global',
  state: {
    inSession: false,//用于控制书本详情页上课按钮与工具的点击录屏后的下课按钮不同时显示
    // courseId: -1,
    // courseTitle: '',
  },
  reducers: {
    setInSession(state, { payload }) {
      return { ...state, inSession: payload };
    },
    // setCourseInfo(state, { payload }) {
    //   return { ...state, courseId: payload.courseId, courseTitle: payload.courseTitle }
    // }
  },
};
