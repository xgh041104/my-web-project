import { resolve } from "path";

export default {
  theme: {
    "primary-color": "#1890ff",
  },
  // experimentalDecorators:['connect'],
  antd: {},
  dva: {},
  // routes:[] 使用约定式路由
  alias: {
    api: resolve(__dirname, "../src/services/"),
    components: resolve(__dirname, "../src/components"),
    config: resolve(__dirname, "../src/utils/config"),
    utils: resolve(__dirname, "../src/utils"),
  },

  // base: '/studyexamstudent/',
  // publicPath:'/studyexamstudent/',
  mock: {},
  //  mfsu: {} //yang 20221122屏蔽，此后如有必要再打开

  // // proxy 配置仅在 dev 时生效,使用mock时关闭代理
  proxy: {
    "/musicDict": {
      // 标识需要进行转换的请求的url     音乐词典原始接口
      target: "http://www.bk.rymusic.art", // 服务端域名
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/musicDict": "" },
    },
    "/newDict": {
      // 标识需要进行转换的请求的url     音乐词典新接口
      target: "http://47.120.65.190", // 服务端域名
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/newDict": "" },
    },
    "/musicBox": {
      //音乐百宝箱、赏析库
      target: "http://catkin.rymusic.net", // 服务端域名
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/musicBox": "" },
    },
    "/scorePractice": {
      //乐谱练习接口请求
      target: " https://faberc-api.rymusic.net", // 服务端域名
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/scorePractice": "" },
    },
    "/scoreStatic": {
      //乐谱练习静态文件
      target: " https://faber-static.rymusic.net", // 服务端域名
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/scoreStatic": "" },
    },
    "/chatbot": {
      //聊天机器人接口请求
      target: "https://spark-api-open.xf-yun.com/v2", // 服务端域名
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/chatbot": "" },
    },
    "/docmee": {
      // 文多多接口请求
      target: "https://open.docmee.cn/api",
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/docmee": "" },
    },
    "/musicTeaching": {
      target: "https://musicteaching-admin.onrender.com",
      changeOrigin: true, // 允许域名进行转换
      pathRewrite: { "^/musicTeaching": "" },
    },
  },
  // devServer: {
  //   port:"8000",
  //   host:"0.0.0.0",
  //   https: true,
  //   writeToDisk:true,
  // },
};
