# Ant Design Pro

This project is initialized with [Ant Design Pro](https://pro.ant.design). Follow is the quick guide for how to use.

## Environment Prepare

Install `node_modules`:

```bash
npm install
```

or

```bash
yarn
```

## Provided Scripts

Ant Design Pro provides some useful script to help you quick start and build with web project, code style check and test.

Scripts provided in `package.json`. It's safe to modify or add additional script:

### Start project

```bash
npm start
```

### Build project

```bash
npm run build
```

### Check code style

```bash
npm run lint
```

You can also use script to auto fix some lint error:

```bash
npm run lint:fix
```

### Test code

```bash
npm test
```

## More

You can view full document on our [official website](https://pro.ant.design). And welcome any feedback in our [github](https://github.com/ant-design/ant-design-pro).

## 约定式路由

除配置式路由外，Umi 也支持约定式路由。约定式路由也叫文件路由，就是不需要手写配置，文件系统即路由，通过目录和文件及其命名分析出路由配置。

如果没有 routes 配置，Umi 会进入约定式路由模式，然后分析 src/pages 目录拿到路由配置。

比如以下文件结构：
```
.
  └── pages
    ├── index.tsx
    └── users.tsx
```
会得到以下路由配置，
```
[
  { exact: true, path: '/', component: '@/pages/index' },
  { exact: true, path: '/users', component: '@/pages/users' },
]
```
需要注意的是，满足以下任意规则的文件不会被注册为路由，

- 以 . 或 _ 开头的文件或目录
- 以 d.ts 结尾的类型定义文件
- 以 test.ts、spec.ts、e2e.ts 结尾的测试文件（适用于.jsx和.tsx 文件）
- components 和 component 目录
- utils 和 util 目录
- 不是.jsx或.tsx 文件
- 文件内容不包含 JSX 元素

## 动态路由
约定 [] 包裹的文件或文件夹为动态路由。

比如：
```
src/pages/users/[id].tsx 会成为 /users/:id
src/pages/users/[id]/settings.tsx 会成为 /users/:id/settings
```
举个完整的例子，比如以下文件结构，
```
.
  └── pages
    └── [post]
      ├── index.tsx
      └── comments.tsx
    └── users
      └── [id].tsx
    └── index.tsx
```
会生成路由配置，
```
[
  { exact: true, path: '/', component: '@/pages/index' },
  { exact: true, path: '/users/:id', component: '@/pages/users/[id]' },
  { exact: true, path: '/:post/', component: '@/pages/[post]/index' },
  {
    exact: true,
    path: '/:post/comments',
    component: '@/pages/[post]/comments',
  },
];
```
## 动态可选路由
约定 [ $] 包裹的文件或文件夹为动态可选路由。

比如：
```
src/pages/users/[id$].tsx 会成为 /users/:id?
src/pages/users/[id$]/settings.tsx 会成为 /users/:id?/settings
```
举个完整的例子，比如以下文件结构，
```
.
  └── pages
    └── [post$]
      └── comments.tsx
    └── users
      └── [id$].tsx
    └── index.tsx
```
会生成路由配置，
```
[
  { exact: true, path: '/', component: '@/pages/index' },
  { exact: true, path: '/users/:id?', component: '@/pages/users/[id$]' },
  {
    exact: true,
    path: '/:post?/comments',
    component: '@/pages/[post$]/comments',
  },
];
```
嵌套路由
Umi 里约定目录下有 _layout.tsx 时会生成嵌套路由，以 _layout.tsx 为该目录的 layout。layout 文件需要返回一个 React 组件，并通过 props.children 渲染子组件。

比如以下目录结构，
```
.
└── pages
    └── users
        ├── _layout.tsx
        ├── index.tsx
        └── list.tsx
```
会生成路由，
```
[
  { exact: false, path: '/users', component: '@/pages/users/_layout',
    routes: [
      { exact: true, path: '/users', component: '@/pages/users/index' },
      { exact: true, path: '/users/list', component: '@/pages/users/list' },
    ]
  }
]
```
