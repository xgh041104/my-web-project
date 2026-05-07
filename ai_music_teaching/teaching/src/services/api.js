export default {
  // 在mock user.js中配置的本地接口
  loginUser: 'post /loginUser',

  // 课程分类接口
  queryCourseCategoryTree: "/currency/queryCourseCategoryTree",
  addCourseCategory: "post /backstage/addCourseCategory",
  editCourseCategory: "post /backstage/editCourseCategory",
  delCourseCategory: "post /backstage/delCourseCategory",
  // 课程列表接口
  queryCourse: "/currency/queryCourse",
  addCourse: "post /currency/addCourse",
  editCourse: "post /currency/editCourse",
  delCourse: "post /currency/delCourse",
  // 课程章节列表接口
  queryChapterList: "/currency/queryChapterByCourseId",
  addChapter: "post /currency/addChapter",
  delChapter: "post /currency/delChapter",
  editChapter: "post /currency/editChapter",
  // 课程小节列表接口
  querySectionList: "/currency/querySectionByChapterId",
  addSection: "post /currency/addSection",
  delSection: "post /currency/delSection",
  editSection: "post /currency/editSection",
  editerUploadFile: "post /currency/editerUploadFile",
  querySectionBySectionId: "/currency/querySectionBySectionId",
  //课程中心
  queryCourseDirectory: "get /currency/queryCourseDirectory",

  //资源中心
  queryResourceCategoryTree: "get /currency/queryResourceCategoryTree",
  queryResourceByResourceCategoryId: "get /currency/queryResourceByResourceCategoryId",
  //历史记录
  queryHistory: "get /musicTeaching/books",
}
