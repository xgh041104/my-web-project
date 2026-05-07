import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { cloneDeep } from 'lodash';
const { parse, compile } = require('path-to-regexp');
import { message } from 'antd';
import { history } from '@umijs/max';

declare global {
  interface Window {
    cancelRequest: Map<symbol, { pathname: string; cancel: () => void }>;
  }
}
window.cancelRequest = new Map<symbol, { pathname: string; cancel: () => void }>();

interface RequestOptions extends AxiosRequestConfig {
  data?: any;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
}

interface Result {
  success: boolean;
  message: string;
  statusCode: number;
  list?: any[];
  [key: string]: any;
}

export default function request(options: RequestOptions): Promise<Result> {
  let { data, url } = options;
  const cloneData = cloneDeep(data);

  try {
    let domain = '';
    const urlMatch = url.match(/[a-zA-z]+:\/\/[^/]*/);
    if (urlMatch) {
      [domain] = urlMatch;
      url = url.slice(domain.length);
    }

    const match = parse(url);
    url = compile(url)(data);

    for (const item of match) {
      if (typeof item === 'object' && 'name' in item && item.name in cloneData) {
        delete cloneData[item.name];
      }
    }
    url = domain + url;
  } catch (e: any) {
    message.error(e.message);
  }

  options.url = url;

  if (options.method?.toUpperCase() === 'GET') {
    options.params = data;
  }

  options.headers = {
    ...options.headers,
    Authorization: window.sessionStorage.getItem('token') || '',
  };

  // formdata文件处理
  if (data && data.fileData) {
    const { fileData } = data;
    options.headers['Content-Type'] = 'multipart/form-data';
    const formData = new FormData();
    fileData.forEach((f: File) => {
      formData.append('files', f);
    });
    delete data.fileData;
    formData.append('data', JSON.stringify(data));
    options.data = formData;
  }

  // 上传进度处理
  if (data && Object.prototype.hasOwnProperty.call(data, 'onUploadProgress')) {
    options.onUploadProgress = data.onUploadProgress;
    delete data.onUploadProgress;
  }

  return axios(options)
    .then((response: AxiosResponse) => {
      const { statusText, status, data } = response;

      if (data.code && data.code === 2005) {
        window.sessionStorage.setItem('token', '');
        history.push({ pathname: '/login' });
      }

      let result: Result = {
        success: true,
        message: data.msg || statusText,
        statusCode: status,
      };

      if (typeof data === 'object') {
        Object.assign(result, data);
        if (Array.isArray(data)) {
          result.list = data;
        }
      } else {
        (result as any).data = data;
      }

      return Promise.resolve(result);
    })
    .catch((error: AxiosError) => {
      const response = error.response;
      let msg = '';
      let statusCode = 0;

      if (response && typeof response === 'object' && response.status !== 0) {
        console.log(response);
        const { data, statusText, status } = response;
        statusCode = status;
        msg = (data as any).msg || (data as any).message || statusText;
      } else {
        statusCode = 600;
        msg = error.message || 'Network Error';
      }

      return Promise.reject({
        success: false,
        statusCode,
        message: msg,
      });
    });
}
