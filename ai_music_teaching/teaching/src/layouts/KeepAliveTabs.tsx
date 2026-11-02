

import React, { useEffect, useState } from 'react'
import { Tabs } from 'antd';
// import styles from './primaryLayout.css';
import "./KeepAliveTabs.css";
import { useHistory, useLocation } from 'umi';
// import { BrowserRouterProps } from 'react-router-dom'
import MusicTheory from "@/pages/teach/musicTheory"
import Rhythm from "@/pages/teach/rhythm"
import SongMaker1 from "@/pages/teach/songMaker1"
import VideoSummary from '@/pages/teach/videoSummary';
import AIGeneration from '@/pages/teach/aiGeneration';
import CreateMusic from '@/pages/teach/aiCreateMusic';
import KnowledgeSolution from '@/pages/teach/knowledgeSolution';

// import pathRegexp from 'path-to-regexp';

type Props = { children: React.ReactNode }

interface TabProps {
  key: string; // 改变同一个tab内容时刷新key值
  title: string;
  pathname: string; // "/user/1"
  routePath: string; // "/user/:id"
  children: React.ReactNode;
  state: unknown;
}

function splitPathname(pathname: string): string[] {
  return pathname.split('/').filter(_ => _ !== "");
}

function getKey(): string {
  const newKey = new Date().getTime().toString();
  // console.log("newKey", newKey);
  return newKey;
}


const renderTabComponent = (routePath: string, defaultChild: React.ReactNode) => {
  switch (routePath) {
    case "/teach/bookTeach":
      return defaultChild;
    case "/teach/musicTheory":
      return <MusicTheory />;
    case "/teach/rhythm":
      return <Rhythm />;
    case "/teach/songMaker1":
      return <SongMaker1 />;
    case "/teach/aiCreateMusic":
      return <CreateMusic />;
    case "/teach/videoSummary":
      return <VideoSummary />;
    case "/teach/aiGeneration":
      return defaultChild || <AIGeneration />;
    case "/teach/knowledgeSolution":
      return <KnowledgeSolution />;
    default:
      return defaultChild;
  }
};

function KeepAliveTabs({ children }: Props) {
  const history = useHistory();
  const { pathname, state } = useLocation();
  const { moduleInfo } = state || {};

  

  const [tabItems, setTabItems] = useState<TabProps[]>([
    {
      key: getKey(),
      title: `课本教学`,
      pathname: "/teach/bookTeach",
      routePath: "/teach/bookTeach",
      children,
      state
    },
    {
      key: getKey() + 1,
      title: `乐理教学`,
      pathname: "/teach/musicTheory",
      routePath: "/teach/musicTheory",
      children: null,
      state
    },
    {
      key: getKey() + 2,
      title: `节奏教学`,
      pathname: "/teach/rhythm",
      routePath: "/teach/rhythm",
      children: null,
      state
    },
    {
      key: getKey() + 3,
      title: `旋律创编`,
      pathname: "/teach/songMaker1",
      routePath: "/teach/songMaker1",
      children: null,
      state
    },
    {
      key: getKey() + 4,
      title: `AI谱曲`,
      pathname: "/teach/aiCreateMusic",
      routePath: "/teach/aiCreateMusic",
      children: null,
      state
    },
    {
      key: getKey() + 5,
      title: `视频总结`,
      pathname: "/teach/videoSummary",
      routePath: "/teach/videoSummary",
      children: null,
      state
    },
    {
      key: getKey() + 6,
      title: `生成教案`,
      pathname: "/teach/aiGeneration/generateOverview/syllabusGeneration",
      routePath: "/teach/aiGeneration",
      children: null,
      state
    },
    {
      key: getKey() + 7,
      title: `知识问答`,
      pathname: "/teach/knowledgeSolution",
      routePath: "/teach/knowledgeSolution",
      children: null,
      state
    },
  ])

  const [activeKey, setActiveKey] = useState("/teach/bookTeach");

  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>(() => {
    const current = pathname && pathname.startsWith('/teach/') ? pathname : '/teach/bookTeach';
    return { [current]: true, '/teach/bookTeach': true };
  });

  useEffect(() => {
    if (activeKey) {
      setVisitedTabs(prev => prev[activeKey] ? prev : { ...prev, [activeKey]: true });
    }
  }, [activeKey]);


  useEffect(() => {
    const pathList = splitPathname(pathname);
    if (pathList.length === 0) {
      // "/","/login"等特殊页面已提前判断            
      return;
    }
    if (pathList.length === 1) {
      setActiveKey(`/${pathList[0]}`);
      return;
    }

    if (pathList.length > 1) {
      const newRoutePath = `/${pathList[0]}/${pathList[1]}`;
      const targetTabIndex = tabItems.findIndex((item) => item.routePath === newRoutePath)
      // console.log("当前路径", targetTabIndex)
      if (targetTabIndex !== -1) {
        // tab已存在，刷新tab内容
        const targetTab = tabItems[targetTabIndex];
        // 刷新tab内容
        setTabItems(prev => {
          prev.splice(targetTabIndex, 1,
            {
              key: getKey(),
              children,
              pathname,
              routePath: targetTab.routePath,
              title: moduleInfo?.moduleName || targetTab.title,
              state
            });
          return [...prev];
        });
        console.log('刷新tab内容');
      }
      console.log("newPath", newRoutePath);
      setActiveKey(newRoutePath);
    }
  }, [pathname])

  const tabPanes = React.useMemo(() => {
    return tabItems.map((p: TabProps) => {
      const isVisited = visitedTabs[p.routePath];
      return (
        <Tabs.TabPane tab={p.title} key={p.routePath} >
          <div key={p.key} style={{
            width: '100vw',
            margin: 'auto',
          }}>
            {isVisited ? renderTabComponent(p.routePath, p.children) : null}
          </div>
        </Tabs.TabPane >
      );
    });
  }, [tabItems, visitedTabs])

  // 切换tab
  const changeTab = (routePath: string) => {
    const targetTab = tabItems.find(item => item.routePath === routePath);
    console.log("当前路由路径", routePath, targetTab);
    if (!targetTab) {
      return;
    }
    history.push({ pathname: targetTab.pathname || targetTab.routePath, state: targetTab.state });
    // setActiveKey(routePath); // 更新 activeKey 为 pathname
  }

  return <Tabs
    hideAdd
    type="card"
    defaultActiveKey="teach/bookTeach"
    size={'large'}
    activeKey={activeKey}
    onChange={changeTab}
    className="menuTabs"
    tabPosition="bottom"
  >
    {tabPanes}
  </Tabs>
}

export default KeepAliveTabs;