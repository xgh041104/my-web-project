import { AvatarDropdown, AvatarName, Footer } from '@/components';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { UserOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { Reducer } from 'redux';
const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/login';

// 保存原来的 push

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

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    title: '',
    logo: () => null,
    headerTitleOnclick: true,
    onMenuHeaderClick: null,
    actionsRender: () => [],
    avatarProps: {
      title: <AvatarName />,
      icon: <UserOutlined />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>
          {avatarChildren}
        </AvatarDropdown>;
      },
    },
    // 自定义菜单渲染
    // 自定义 404 页面
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        // history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {

      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState: any) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },

    ...initialState?.settings,
  };
};
interface Action {
  type: string;
  [key: string]: any;
}

export const dva = {
  config: {
    // onAction: createLogger(),
    onError(e: Error) {
      console.error(e.message);
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
