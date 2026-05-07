import React from 'react';
import * as Icons from '@ant-design/icons';

// 约定式路由下的菜单项结构定义
export interface MenuItem {
  name: string;
  icon?: React.ReactNode;
  path: string;
  routes?: MenuItem[];
}

// 图标映射函数，将字符串转换为图标组件
export const getIcon = (iconName: string | undefined): React.ReactNode => {
  if (!iconName) return null;

  const IconComponent = (Icons as any)[iconName];
  if (IconComponent) {
    return React.createElement(IconComponent);
  }
  return null;
};

export const isShowLayout = (path: string): boolean => {
  const routes = ['login', 'getGradesLogin', 'scoreQuery', '403', '500'].map(route => `/${route}`);
  return !routes.includes(path);
};

// 约定式路由下的菜单配置
export const getMenuData = (userType: number): MenuItem[] => {
  // 定义菜单数据，按照之前routes.ts的结构但使用约定式路由的方式
  const teacherMenuData: MenuItem[] = [
    {
      name: '个人信息',
      icon: 'UserOutlined',
      path: '/selfInfo',
    },
    {
      name: '学生管理',
      icon: 'UsergroupAddOutlined',
      path: '/studentManage',
      routes: [
        // { name: '学院列表', path: '/studentManage/collegeList' },
        // { name: '专业列表', path: '/studentManage/majorList' },
        { name: '班级列表', path: '/studentManage/classList' },
        // { name: '导入学生照片', path: '/studentManage/studentImage' },
        { name: '学生列表', path: '/studentManage/studentList' },
      ],
    },
    // {
    //   name: '课程管理',
    //   icon: 'BookOutlined',
    //   path: '/lessonManage',
    //   routes: [
    //     { name: '课程列表', path: '/lessonManage/lessonList' },
    //   ],
    // },
    {
      name: '题库管理',
      icon: 'AppstoreOutlined',
      path: '/questionManage',
      routes: [
        { name: '题目导入', path: '/questionManage/questionImport' },
        { name: '题目列表', path: '/questionManage/questionList' },
        { name: '试卷列表', path: '/questionManage/testPaperList' },
      ],
    },
    {
      name: '考试管理',
      icon: 'ScheduleOutlined',
      path: '/examManage',
      routes: [
        { name: '考试列表', path: '/examManage/examList' },
        { name: '成绩记录表', path: '/examManage/examResultList' },
        { name: '考试审核', path: '/examManage/examReview' },
      ],
    },
  ];

  const adminMenuData = [
    {
      name: '个人信息',
      icon: 'UserOutlined',
      path: '/selfInfo',
    },
    {
      name: '教师列表',
      icon: 'TeamOutlined',
      path: '/teachermanage/teacherlist',
    },
    {
      name: '学生管理',
      icon: 'UsergroupAddOutlined',
      path: '/studentManage',
      routes: [
        // { name: '学院列表', path: '/studentManage/collegeList' },
        // { name: '专业列表', path: '/studentManage/majorList' },
        { name: '班级列表', path: '/studentManage/classList' },
        // { name: '导入学生照片', path: '/studentManage/studentImage' },
        { name: '学生列表', path: '/studentManage/studentList' },
      ],
    },
    // {
    //   name: '课程管理',
    //   icon: 'BookOutlined',
    //   path: '/lessonManage',
    //   routes: [
    //     { name: '课程列表', path: '/lessonManage/lessonList' },
    //   ],
    // },
    // {
    //   name: '题库管理',
    //   icon: 'AppstoreOutlined',
    //   path: '/questionManage',
    //   routes: [
    //     { name: '题目导入', path: '/questionManage/questionImport' },
    //     { name: '题目列表', path: '/questionManage/questionList' },
    //     { name: '试卷列表', path: '/questionManage/testPaperList' },
    //   ],
    // },
    // {
    //   name: '考试管理',
    //   icon: 'ScheduleOutlined',
    //   path: '/examManage',
    //   routes: [
    //     { name: '考试列表', path: '/examManage/examList' },
    //     { name: '成绩记录表', path: '/examManage/examResultList' },
    //   ],
    // },
  ]
  switch (userType) {
    case 0:
      return adminMenuData;
    case 1:
      return teacherMenuData;
    default:
      return [];
  }


};

export default getMenuData;
