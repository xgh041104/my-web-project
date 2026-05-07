import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { message } from 'antd';
import { Reducer } from 'redux';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/login';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<any> {

  //这里是初始化信息的逻辑，在这里改写原有的history.push方法
  type PushFn = (path: string, state?: any, ...args: any[]) => any;
  // 保存老 push
  const oldPush: PushFn = history.push.bind(history);
  (history.push as PushFn) = function (path: any, state?: any, ...args: any[]): any {
    if (typeof path === 'object') {
      return oldPush(path.pathname, path.state, ...args);
    }
    return oldPush(path, state, ...args);
  };


  const fetchUserInfo = async () => {
    // history.push(loginPath);
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (![loginPath, '/user/register', '/user/register-result'].includes(location.pathname)) {
    await fetchUserInfo();
    return {
      fetchUserInfo,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// 渲染之前运行
export async function render(oldRender: () => void) {
  oldRender();
}

export const request = {
  timeout: 1000000,
};

interface Action {
  type: string;
  [key: string]: any;
}

export const dva = {
  config: {
    // onAction: createLogger(),
    onError(e: Error) {
      message.error(e.message, 3);
    },
    onReducer:
      (appReducer: Reducer<any, Action>): Reducer<any, Action> =>
        (state, action) => {
          if (action.type === 'user/logoutUser') {
            // 清空所有 model 的 state
            return appReducer(undefined, action);
          }
          return appReducer(state, action);
        },
  },
};
