export default {
  // 全局功能性函数
  GetHttpUrl: '/GetHttpUrl',
  GetSystemTimeAPI: 'GET /GetTime',
  CompileCode: 'POST /compile',

  //↓↓↓↓↓↓↓↓↓↓用户相关
  LoginStudentAPI: 'POST /LoginStudent',
  GetStudentInfoByID: 'GET /GetStudentViewById',
  UploadStudentRemainImg: 'POST /UploadStudentRemainImg', // 留存用户第一次登陆照片
  //↑↑↑↑↑↑↑↑↑↑↑↑用户相关

  //↓↓↓↓↓↓↓↓↓↓课程相关
  GetCurrentStudyCourseAPI: 'GET /GetCurrentStudyCourse', //StudentId
  GetCourseDetailsAPI: 'GET /CourseDetails',  //StudentId & CourseId
  GetChapterByIdAPI: 'GET /GetChapterById',   //ChapterId 章节详情
  StudyPlanUploadAPI: 'POST /StudyPlanUpload',  //上传学习进度
  //↑↑↑↑↑↑↑↑↑↑课程相关

  //↓↓↓↓↓↓↓↓↓↓考试相关
  GetStudentExamInfoAPI: 'GET /GetStudentExamInfo',//StudentId=6
  GetStudentExamDetailsAPI: 'GET /GetStudentExamDetails',//StudentId=6&ExamId=1&ExamSessionId=2
  ExamStudentSumitAPI: 'POST /ExamStudentSumit',
  GetStudentExamPaperOverAPI: 'GET /GetStudentExamPaperOver',//StudentId=6&ExamSessionId=1&ExamId=1
  UploadExamImage: "POST /UploadExamImage", // 上传考试图片
  GetExamNoticeByExamId: "/GetExamNoticeByExamId", //获取考试通知
  //↑↑↑↑↑↑↑↑↑↑考试相关

  //↓↓↓↓↓↓↓↓↓↓题目相关
  GetQuestionBySchoolIdAPI: 'GET /GetQuestionBySchoolId', //SchoolId
  GetTrainQuestionBySchoolId: 'GET /GetTrainQuestionBySchoolId',
  GetSocietyQuestionByStudentId: '/GetSocietyQuestionByStudentId',
  GetQuestionByQuestionIdAPI: 'GET /GetQuestionByQuestionId',//QuestionId
  AddQuestionWrongAPI: 'POST /AddQuestionWrong',
  DelQuestionWrongAPI: 'POST /DelQuestionWrong',
  GetQuestionWrongByStudentIdAPI: 'GET /GetQuestionWrongByStudentId', //StudentId=1
  AddOperPractice: 'POST /AddOperPractice', // 上传练习记录
  //↑↑↑↑↑↑↑↑↑↑题目相关

  //↓↓↓↓↓↓↓↓↓↓公告相关
  GetNotice5API: 'GET /NoticeList',
  GetNoticeAllAPI: 'GET /NoticeListAll',
  GetNoticeByIDAPI: 'GET /GetNoticeById',
  //↑↑↑↑↑↑↑↑↑↑公告相关

  // 学习考试计划相关接口
  AddQuestionRecord: 'POST /AddQuestionRecord',// 计划内训练提交提交
  QuertStudentPlan: '/QuertStudentPlan',//学生所有关联的学习计划
  QueryPlanCourseProgress: '/QueryPlanCourseProgress',//查询计划内课程进度
  QueryPlanExamProgress: '/QueryPlanExamProgress', // 查询计划内考试进度
  QueryPlanTrainProgress: '/QueryPlanTrainProgress' // 查询计划内训练进度

}
