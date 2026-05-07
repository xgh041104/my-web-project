import BasicLayout from './BasicLayout';
import { Outlet, useLocation } from '@umijs/max';
import { isShowLayout } from './menu';
import { SettingDrawer } from '@ant-design/pro-components';

// 在约定式路由下，layouts/index.tsx 会自动作为全局布局组件

const Layout: React.FC = () => {
  const location = useLocation();
  if (isShowLayout(location.pathname)) {
    return <BasicLayout><Outlet /></BasicLayout>;
  }
  return <><Outlet /></>;
};
export default Layout;
