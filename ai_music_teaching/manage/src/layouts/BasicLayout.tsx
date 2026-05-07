import React from 'react';
import { Link, useLocation, useSelector } from '@umijs/max';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import defaultSettings from '../../config/defaultSettings';
import { getMenuData, getIcon } from './menu';
import { UserOutlined } from '@ant-design/icons';
import { AvatarDropdown, AvatarName, Footer } from '@/components';

const BasicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const userInfo = useSelector(state => (state as any).user.userInfo);

  // 将菜单数据转换为ProLayout需要的格式
  const convertMenuToProLayoutFormat = (menuItems: any[]): MenuDataItem[] => {
    return menuItems.map((item: any) => ({
      path: item.path,
      name: item.name,
      icon: getIcon(item.icon),
      children: item.routes ? convertMenuToProLayoutFormat(item.routes) : undefined
    }));
  };

  const proLayoutMenuData = convertMenuToProLayoutFormat(getMenuData(userInfo.userType));

  return (
    <ProLayout
      {...defaultSettings}
      location={{
        pathname: location.pathname,
      }}
      logo={false}
      route={{
        path: '/',
        routes: proLayoutMenuData
      }}
      itemRender={(route, params, routes) => {
        const first = routes.indexOf(route) === 0;
        return first ? (
          <Link to={route.path || ''}>{route.title}</Link>
        ) : (
          <span>{route.title}</span>
        );
      }}
      headerContentRender={() => null}
      avatarProps={{
        title: <AvatarName />,
        icon: <UserOutlined />,
        render: (_, avatarChildren) => {
          return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
        },
      }}
      menuItemRender={(menuItemProps, defaultDom) => {
        if (menuItemProps.isUrl || menuItemProps.children || !menuItemProps.path) {
          return defaultDom;
        }
        return (
          <Link to={menuItemProps.path}>
            {defaultDom}
          </Link>
        );
      }}
      footerRender={() => <Footer />}
    >
      {children}
    </ProLayout>
  );
};

export default BasicLayout;
