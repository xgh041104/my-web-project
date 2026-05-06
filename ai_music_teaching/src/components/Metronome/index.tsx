import {
  useState,
  useImperativeHandle,
  forwardRef,
  ReactNode,
  useEffect,
} from 'react';
import { Button } from 'antd';
import {
  DashboardOutlined,
  SoundOutlined,
  CloseCircleOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import AnalogMetronome from './AnalogMetronome';
import CircleMetronome from './CircleMetronome';

export interface MetronomeRef {
  show: () => void;
}

export interface ModeItem {
  name: string;
  title: string;
  icon: ReactNode;
  description: string;
  component: ReactNode;
}

export type ModeName = 'analog' | 'circle';

const Metronome = forwardRef<MetronomeRef>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ModeName>('analog');
  // 使用useState确保组件重新渲染
  const [activeComponent, setActiveComponent] = useState<ReactNode | null>(null);

  const modeList: ModeItem[] = [
    {
      name: 'analog',
      title: '模拟节拍器',
      icon: <DashboardOutlined />,
      description: '经典的摆针式节拍器，视觉效果与传统机械节拍器相似',
      component: <AnalogMetronome />,
    },
    {
      name: 'circle',
      title: '圆形节拍器',
      icon: <SoundOutlined />,
      description: '最简单的节拍器，只有声音反馈，无任何视觉元素',
      component: <CircleMetronome />, // 暂时复用，实际应该用Simple组件
    },
  ];

  // 监听模式变化，更新activeComponent
  useEffect(() => {
    const currentMode = modeList.find((item) => item.name === mode);
    if (currentMode) {
      setActiveComponent(currentMode.component);
    }
  }, [mode]);

  // 显示组件时同时设置挂载状态
  useImperativeHandle(ref, () => ({
    show() {
      setVisible(true);
      setMounted(true);
    },
  }));

  // 最小化功能 - 隐藏界面但保持组件挂载
  const handleMinimize = () => {
    setVisible(false);
  };

  // 关闭功能 - 完全卸载组件
  const handleClose = () => {
    setVisible(false);
    setMounted(false);
  };

  // 如果组件未挂载，不渲染任何内容
  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '80vw',
        height: '90vh',
        marginLeft: '10vw',
        marginTop: '5vh',
        backgroundColor: '#1f1f1f',
        color: '#f0f0f0',
        zIndex: 9999,
        display: visible ? 'flex' : 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0.2rem',
        backgroundImage: 'linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)',
        overflow: 'hidden',
        borderRadius: '0.1rem',
        boxShadow: '0 0 0.2rem rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '12rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '0 0 0.1rem 0',
        flexShrink: 0
      }}>
        <h1 style={{
          fontSize: '0.2rem',
          margin: 0,
          color: '#f0f0f0',
          fontWeight: 'bold'
        }}>
          乐智课堂 - 节拍器
        </h1>
        <div style={{ display: 'flex', gap: '0.1rem' }}>
          <Button
            type="primary"
            icon={<MinusOutlined />}
            onClick={handleMinimize}
            size="small"
            style={{ backgroundColor: '#1890ff', width: '2rem', height: '0.3rem' }}
          >
            最小化
          </Button>
          <Button
            type="primary"
            style={{ width: '2rem', height: '0.3rem' }}
            icon={<CloseCircleOutlined />}
            onClick={handleClose}
            danger
            size="small"
          >
            关闭
          </Button>
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '12rem',
        marginBottom: '0.1rem',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '0.1rem',
        padding: '0.12rem',
        boxShadow: '0 0.04rem 0.12rem rgba(0,0,0,0.5)',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '0.16rem',
          marginBottom: '0.1rem',
          color: '#1890ff'
        }}>
          选择节拍器类型
        </h2>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '0.1rem'
        }}>
          {modeList.map((item) => (
            <div
              key={item.name}
              onClick={() => setMode(item.name as ModeName)}
              style={{
                flex: '1',
                minWidth: '1.5rem',
                maxWidth: '5rem',
                padding: '0.1rem',
                backgroundColor: item.name === mode ? 'rgba(24, 144, 255, 0.2)' : 'rgba(0,0,0,0.2)',
                borderRadius: '0.06rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: item.name === mode ? '1px solid #1890ff' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '0.24rem',
                marginBottom: '0.05rem',
                color: item.name === mode ? '#1890ff' : '#a0a0a0'
              }}>
                {item.icon}
              </div>
              <h3 style={{
                margin: '0.03rem 0',
                color: item.name === mode ? '#1890ff' : '#f0f0f0',
                fontSize: '0.14rem'
              }}>
                {item.title}
              </h3>
              <p style={{
                color: '#a0a0a0',
                fontSize: '0.12rem',
                margin: 0,
                display: 'none'
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 节拍器主界面 */}
      <div style={{
        width: '100%',
        maxWidth: '12rem',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '0.1rem'
      }}>
        {activeComponent}
      </div>

      {/* 底部信息 */}
      <div style={{
        padding: '0.1rem',
        color: '#a0a0a0',
        fontSize: '0.12rem',
        width: '100%',
        maxWidth: '12rem',
        textAlign: 'center',
        margin: '0.1rem 0 0 0',
        flexShrink: 0
      }}>
        {new Date().getFullYear()}
      </div>
    </div>
  );
});

export default Metronome;