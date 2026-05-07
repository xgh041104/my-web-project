/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/login',
    component: './login/index',
    layout: false,
  },
  {
    path: '/getGradesLogin',
    name: '成绩查询',
    component: './getGradesLogin/index',
    layout: false,
  },
  {
    path: '/scoreQuery',
    name: '成绩查询',
    component: './scoreQuery/index',
    layout: false,
  },
  {
    path: '/',
    component: '@/layouts/BasicLayout',
    routes: [
      {
        path: '/',
        redirect: '/homePage',
      },
      {
        name: '首页',
        icon: 'HomeOutlined',
        path: '/homePage',
        component: './homePage/index',
      },
      {
        path: '/selfInfo',
        name: '个人信息',
        icon: 'UserOutlined',
        component: './selfInfo',
      },
      {
        name: '学校管理',
        icon: 'BankOutlined',
        path: '/schoolManage',
        component: './schoolManage/index',
      },
      {
        path: '/teachermanage/teacherlist',
        component: './teachermanage/teacherlist',
        name: '教师列表',
        icon: 'TeamOutlined',
      },
      {
        name: '学生管理',
        path: '/studentManage',
        icon: 'UsergroupAddOutlined',
        routes: [
          {
            name: '学院列表',
            path: '/studentManage/collegeList',
            component: './studentManage/collegeList',
          },
          {
            name: '专业列表',
            path: '/studentManage/majorList',
            component: './studentManage/majorList',
          },
          {
            name: '班级列表',
            path: '/studentManage/classList',
            component: './studentManage/classList',
          },
          {
            name: '导入学生照片',
            path: '/studentManage/studentImage',
            component: './studentManage/studentImage',
          },
          {
            name: '学生导入',
            icon: 'ImportOutlined',
            path: '/studentManage/studentImport',
            component: './studentManage/studentImport',
          },
          {
            name: '学生列表',
            path: '/studentManage/studentList',
            component: './studentManage/studentList',
          },
        ],
      },
      {
        name: '课程管理',
        icon: 'BookOutlined',
        path: '/lessonManage',
        routes: [
          {
            path: '/lessonManage/chapterList',
            component: './lessonManage/chapterList',
            name: '章节列表',
          },
          {
            path: '/lessonManage/editlesson',
            component: './lessonManage/editlesson',
            name: '编辑课程',
          },
          {
            name: '课程列表',
            path: '/lessonManage/lessonList',
            component: './lessonManage/lessonList',
          },
        ],
      },
      {
        path: '/questionManage',
        name: '题库管理',
        icon: 'AppstoreOutlined',
        routes: [
          {
            name: '练习记录',
            path: '/questionManage/practiceRecordList',
            component: './questionManage/practiceRecordList',
          },
          {
            path: '/questionManage/questionEditor',
            component: './questionManage/questionEditor',
            name: '题目编辑',
          },
          {
            name: '题目导入',
            path: '/questionManage/questionImport',
            component: './questionManage/questionImport',
          },
          {
            name: '题目列表',
            icon: 'OrderedListOutlined',
            path: '/questionManage/questionList',
            component: './questionManage/questionList',
          },
          {
            name: '试卷列表',
            path: '/questionManage/testPaperList',
            component: './questionManage/testPaperList/index',
          },
          {
            path: '/questionManage/testPaperList/testPaperEditor',
            component: './questionManage/testPaperList/testPaperEditor',
            name: '试卷编辑',
          },
        ],
      },
      {
        path: '/examManage',
        name: '考试管理',
        icon: 'ScheduleOutlined',
        routes: [
          {
            name: "考试列表",
            path: '/examManage/examList',
            component: './examManage/examList',
          },
          {
            name: "成绩记录表",
            path: '/examManage/examResultList',
            component: './examManage/examResultList',
          },
          {
            name: "考试审核",
            path: '/examManage/examReview',
            component: './examManage/examReview',
          },
        ],
      },
      {
        path: '/noticemanage',
        name: '通知管理',
        icon: 'NotificationOutlined',
        routes: [
          {
            path: '/noticemanage/noticeList',
            component: './noticemanage/noticeList',
            name: '通知列表',
          },
          {
            path: '/noticemanage/noticecard',
            component: './noticemanage/noticecard',
            name: '通知卡片',
          },
        ],
      },
      {
        path: '*',
        component: './404',
      },
    ],
  },
];

