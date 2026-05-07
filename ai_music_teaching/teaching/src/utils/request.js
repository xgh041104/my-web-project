import axios from 'axios'
import { cloneDeep } from 'lodash'
const { parse, compile } = require("path-to-regexp")

import { message } from 'antd'

import { history } from 'umi';


window.cancelRequest = new Map()

export default function request(options) {
  let { data, url } = options
  const cloneData = cloneDeep(data)

  try {
    let domain = ''
    const urlMatch = url.match(/[a-zA-z]+:\/\/[^/]*/)
    if (urlMatch) {
      ;[domain] = urlMatch
      url = url.slice(domain.length)
    }

    const match = parse(url)
    url = compile(url)(data)

    for (const item of match) {
      if (item instanceof Object && item.name in cloneData) {
        delete cloneData[item.name]
      }
    }
    url = domain + url
  } catch (e) {
    message.error(e.message)
  }

  options.url = url
  // options.cancelToken = new CancelToken(cancel => {
  //   window.cancelRequest.set(Symbol(Date.now()), {
  //     pathname: window.location.pathname,
  //     cancel,
  //   })
  // })

  if (options.method.toUpperCase() === 'GET') {
    options.params = data
  }
  options.headers = { "Authorization": window.sessionStorage.getItem("token") }

  // formdata文件处理
  if (data && data.fileData) {
    const { fileData } = data;
    options.headers['Content-type'] = 'multipart/form-data'
    const formData = new FormData();
    fileData.forEach(f => {
      formData.append("files", f);
    });
    delete data.fileData;
    formData.append('data', JSON.stringify(data));
    options.data = formData;
  }
  // 上传进度处理
  if (data && data.hasOwnProperty('onUploadProgress')) {
    options.onUploadProgress = data.onUploadProgress;
    delete data.onUploadProgress;
  }

  return axios(options)
    .then(response => {
      const { statusText, status, data } = response

      if (data.code && data.code == 2005) {
        window.sessionStorage.setItem("token", "");
        history.push({ pathname: "/login" });
      }

      let result = {}
      if (typeof data === 'object') {
        result = data
        if (Array.isArray(data)) {
          result.list = data
        }
      } else {
        result.data = data
      }

      return Promise.resolve({
        success: true,
        message: statusText,
        statusCode: status,
        ...result,
      })
    })
    .catch(error => {
      const { response, message } = error

      let msg
      let statusCode

      if (response && response instanceof Object && response.status != 0) {
        const { data, statusText } = response
        statusCode = response.status
        msg = data.message || statusText
      } else {
        statusCode = 600
        msg = error.message || 'Network Error'
      }

      /* eslint-disable */
      return Promise.reject({
        success: false,
        statusCode,
        message: msg,
      })
    })
}
// 创建曲谱练习的 axios 实例
const axiosScorePractice = axios.create({
  baseURL: '/scorePractice/api',
  timeout: 5000, // 请求超时时间
});

// 请求拦截器（确保请求时 token 是最新的）
axiosScorePractice.interceptors.request.use(config => {
  const token = window.sessionStorage.getItem('accessToken');
  if (token) {
    config.headers['token'] = token; // 动态设置 token
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export { axiosScorePractice };
