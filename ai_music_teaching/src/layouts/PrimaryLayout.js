import React, { useState, useEffect, useContext, useCallback } from 'react';
import { connect } from 'dva';
import { Layout, Divider, Space, Button, Image, Modal, Typography, Popover } from 'antd';
import { QuestionCircleFilled } from '@ant-design/icons';
import ArcMenu from '@/components/ArcMenu';

import { history, useLocation } from 'umi';
import KeepAliveTabs from './KeepAliveTabs';
import styles from './primaryLayout.css';
import useLocalDateTime from '@/hooks/useLocalDateTime';
import { getFilePrefix, baseUrl } from '../utils/config';
import './primaryLayout.css'
// import TopToolbar from '../components/TopToolbar';
import { ArcMenuContext } from "@/hooks/useArcMenuContext";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function TimeDisplay() {
  const dateString = useLocalDateTime();
  return <div>{dateString}</div>;
}

function splitPathname(pathname) {
  return pathname.split('/').filter(_ => _ !== "");
}

function PrimaryLayout({ user, children, dispatch }) {
  const [visiblePopover, setVisiblePopover] = useState(false);
  const [arcMenuFn, setArcMenuFn] = useState({});
  const location = useLocation();

  const { userInfo } = user;
  const pathList = splitPathname(location.pathname);

  const prefix = baseUrl + '/image/menu';
  const width = '.5rem';

  const togglePopover = () => setVisiblePopover(prev => !prev);

  return (
    <ArcMenuContext.Provider value={{ setMenuFn: setArcMenuFn }}>
      <Button style={{
        position: 'absolute',
        right: '6%',
        bottom: '0%',
        width: '1.2rem',
        height: '.45rem',
        fontSize: '.2rem',
        fontWeight: '600',
        zIndex: '9999',
      }}
        onClick={() => {
          history.push('/login')
        }}>
        回到首页
      </Button>
      <Layout>
        <Content className={styles.content} draggable='false'>
          <div className={styles.headInfo}>
            <Space style={{ marginRight: '0' }}>
              <TimeDisplay />
              <ArcMenu {...arcMenuFn} />
            </Space>
          </div>
          <KeepAliveTabs>{children}</KeepAliveTabs>
        </Content>
      </Layout>
    </ArcMenuContext.Provider>
  );
}

export default connect(({ user }) => ({
  user,
}))(PrimaryLayout);