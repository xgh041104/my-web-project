// request.d.ts

import { AxiosRequestConfig } from 'axios';

declare global {
  interface Window {
    cancelRequest: Map<symbol, { pathname: string; cancel: () => void }>;
  }
}

export interface RequestOptions extends AxiosRequestConfig {
  data?: any;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
}

export interface Result {
  success: boolean;
  message: string;
  statusCode: number;
  list?: any[];
  [key: string]: any;
}

/**
 * 封装请求函数，基于axios，支持路径参数、文件上传、token自动携带等功能。
 * @param options 请求配置，继承AxiosRequestConfig并扩展data和url必填
 * @returns 返回一个Promise，resolve为Result类型的响应结果
 */
declare function request(options: RequestOptions): Promise<Result>;

export default request;
