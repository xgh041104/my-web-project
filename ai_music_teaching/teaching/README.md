# 项目名称
知行挑战杯AI音乐教学系统项目，基于原有音乐大师的部分功能开发
# 使用教程
### 安装
安装和配置好git和nvm中的node.js后下载本项目
`git clone https://e.coding.net/g-ixbj6844/2025-tiaozhanbei/ai_music_teaching.git`

> 注意：
> 推荐node.js v16; 
> 需清理本地用nodejs安装的全局的umi;

下载完成后在项目文件夹执行下面命令:
``` bash
yarn intall # 下载所需模块包
yarn start # 运行项目
```
**推荐使用yarn进行包管理**

运行结果如下：
``` bash
 App running at:
  - Local:   http://localhost:8000 (copied to clipboard)
  - Network: http://192.168.9.1:8000
```
此项目`run start`后会默认是8000端口,如果8000端口被占用后会使用'8001',以此类推

在浏览器输入 http://localhost:8000 即可见到主页面


### 约定式路由
本项目使用umi的约定式路由,即在src/pages下新建的文件或文件夹,umi会分析目录拿到路由配置会自动生成路由
比如以下文件结构：
``` bash
ai_music_teaching  # 我们的项目名称
  ├── config # 项目配置文件
  ├── mock   # 测试数据存放处
  ├── public # 静态资源存放路径
  └── src    # 源代码文件
    ├── layouts # 布局组件
    ├── routes # 路由配置
    ├── services # 服务层
    ├── utils # 工具函数
    ├── models # 全局状态管理
    ├── components # 全局组件
    └── pages # 页面组件, 主要在这里面些业务代码
      ├── study    # 首页路由
      └── teach # 业务代码部分
        ├── bookTeach # 课本教学
        ├── musicTheory # 乐理教学
        ├── pptGenerator # 生成教案
        ├── recorderControlled # 录制音频测试文件
        ├── rhythm # 节奏教学
        ├── songMaker1 # 旋律创编
        └── videoPlayer # 用户

```
会得到以下路由配置:
```
[
  { exact: true, path: '/', component: '@/pages/index' },
  { exact: true, path: '/login', component: '@/pages/login' },
]
```
需要注意满足以下任意规则的文件不会被注册为路由:
> - 以 . 或 _ 开头的文件或目录
> - 以 d.ts 结尾的类型定义文件
> - 以 test.ts、spec.ts、e2e.ts 结尾的测试文件（适用于 .js、.jsx 和 .tsx 文件）
> - components 和 component 目录
> - utils 和 util 目录
> - 不是 .js、.jsx、.ts 或 .tsx 文件
> - 文件内容不包含 JSX 元素


### 新建页面
 根据业务需要再pages页面下创建文件或文件夹即可创建新的路由页面,此处以`products`页面为示例进行说明

 在pages页面下建立products文件夹,在文件夹创新建index.js文件,在index.js文件中创建`Products`组件:
 ``` js
import React from 'react';

const Products = (props) => (
  <h2>产品列表</h2>
);

export default Products;
 ```

此时即可在浏览器中访问此页面路由:`http://localhost:8000/products`

访问此路由时,右侧菜单栏没有看`products`对应的菜单。需要修改菜单栏数据
在`src/layouts/PrimaryLayout.js:45`中找到
` const pages = [{ key: "homePage",label: "首页",},...`
在`pages`数组中添加一项我们的页面对象`{key:"products", label: "产品"}`保存后再次访问上面的路由地址,即可看到在左侧菜单栏看到我们新配置的页面

### 新建组件

在product文件夹中新建一个ProductList组件,这样就能在不同的地方显示产品列表了。
新建[`_productList.js`](./src/pages/product/_productList.js) 文件
注意此处_productList.js文件只作为页面里的子组件渲染,不需要作为页面路由,所以需要再文件名称前带 _ 符号
再将ProductList组件在product页面渲染
``` js
import ProductList from './_productList';
const Products = () =>{
    return (
        <div>
            <h2>产品列表</h2>
            <ProductList />
        </div>);
};
```

### 新建页面Model
umi里面集成了dva,dva 通过 model 的概念把一个领域的模型管理起来，包含同步更新 `state` 的 `reducers`，处理异步逻辑的 `effects`，订阅数据源的 `subscriptions`.
此处我们先定义`namespace`、`state`、`reducers`
``` js
export default {
  namespace: 'products',
  state: [],
  reducers: {
    'delete'(state, { payload: id }) {
      return state.filter(item => item.id !== id);
    },
  },
};
```
>这个 model 里：
>- namespace 表示在全局 state 上的 key
>- state 是初始值，在这里是空数组
>- reducers 等同于 redux 里的 reducer，接收 
>- action，同步更新 state



### 将组件和Model连接
(umi)dva 提供了 connect 方法。如果你熟悉 redux，这个 connect 就是 react-redux 的 connect 。

编辑 products/index.js，替换为以下内容
``` js
import React from 'react';
import { connect } from 'dva';
import ProductList from '../components/ProductList';

const Products = ({ dispatch, products }) => {
  function handleDelete(id) {
    dispatch({
      type: 'products/delete',
      payload: id,
    });
  }
  return (
    <div>
      <h2>List of Products</h2>
      <ProductList onDelete={handleDelete} products={products} />
    </div>
  );
};

// export default Products;
export default connect(({ products }) => ({
  products,
}))(Products);
```
此时就可以看到在products页面点击`删除`时可以删除对应的数据条目。
其他具体的操作可以看此项目中的products示例页面代码。

### 处理外部请求
