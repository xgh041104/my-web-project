import React, { useState, useEffect, useRef } from 'react';
import './index.css';  // 确保 CSS 文件被正确导入
import { ToolOutlined } from '@ant-design/icons'
import { Button, Image, message, Modal } from 'antd'
import { CameraFilled, CloseOutlined } from '@ant-design/icons';
import { baseUrl } from 'config';
import Piano from '../Piano';
import Paint from '@/components/Paint';
import CameraRecorder from '../Camera';
import { midiSound, setInputCallback } from '../midiIO/midisound';
import { history, useSelector } from 'umi';
import Metronome from '../Metronome';
import RecorderControlled from '@/components/RecorderControlled';

function ArcMenu(props) {
  const path = history.location.pathname;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [start, setStart] = useState({ X: 0, Y: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPiano, setShowPiano] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPaint, setShowPaint] = useState(false);
  const [showRecorderControlled, setShowRecorderControlled] = useState(false);
  const inSession = useSelector(state => state.global.inSession);

  const pianoRef = useRef();
  const isDraggingRef = useRef();
  const metronome = useRef();

  // 处理半透明小窗口的显示与隐藏  
  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const openPiano = () => {
    setShowPiano(true);
  }

  const openCamera = () => {
    setShowCamera(true)
  }
  const closeCamera = () => {
    setShowCamera(false);
  }
  const openPaint = () => {
    setShowPaint(true)
  }
  const closePaint = () => {
    setShowPaint(false);
  }

  const openRecorderControlled = () => {
    setShowRecorderControlled(true);
  }

  const closeRecorderControlled = () => {
    setShowRecorderControlled(false);
  }

  useEffect(() => {
    midiSound.switchID(12, 1); //本模块维护MIDI 12 channel
    setInputCallback(12, midiInputDeviceMsg); //注册接收midiinput消息
    return () => {
      setInputCallback(12, midiInputDeviceMsg, true); //卸载时，取消函数callback注册
    }
  }, []);

  const midiInputDeviceMsg = (noteId, isOn) => {
    // console.log('bookPage midiInputDeviceMsg', noteId, isOn);
    pianoRef?.current.changeNote(noteId, isOn);
  }

  const prefix = baseUrl + '/image/teach/bookTeach/bookPage'


  const getMenuItem = () => {
    let menu = [];
    let commonList = [
      {
        key: "keyboard",
        name: "钢琴键盘",
        icon: <Image src={prefix + '/keyboard.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: openPiano
      },
      {
        key: "camera",
        name: "指法展示",
        icon: <Image src={prefix + '/camera.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: openCamera
      },
      {
        key: "paint",
        name: "标注工具",
        icon: <Image src={prefix + '/paint.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: openPaint
      },
    ]
    const menuList = [
      {
        key: "verticalRight",
        name: "上一课",
        icon: <Image src={prefix + '/verticalRight.png'} preview={false} style={{ width: "1.8vw", pointerEvents: "none", userSelect: "none" }} />,
        function: props.previousClass
      },
      {
        key: "musicDict",
        name: "音乐词典",
        icon: <Image src={prefix + '/musicDict.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: props.openDictSearchModal,
      },
      {
        key: "verticalLeft",
        name: "下一课",
        icon: <Image src={prefix + '/verticalLeft.png'} preview={false} style={{ width: "1.8vw", pointerEvents: "none", userSelect: "none" }} />,
        function: props.nextClass
      },
      {
        key: "musicSearch",
        name: "歌曲查找",
        icon: <Image src={prefix + '/musicSearch.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: props.openSongSearchModal
      },
      {
        key: "myData",
        name: "我的资源",
        icon: <Image src={prefix + '/myData.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: () => message.info("数据库内无个人资源！")
      },
      {
        key: "publicFolder",
        name: "公共课件",
        icon: <Image src={prefix + '/publicFolder.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: props.openFileAnnexModal
      },
    ];
    const lastList = [
      {
        key: "metronome",
        name: "节拍器",
        icon: <Image src={'/image/ArcMenu/metronome.png'} preview={false} style={{ width: "2vw", pointerEvents: "none", userSelect: "none" }} />,
        function: () => { metronome.current.show() }
      },
      !inSession && {
        key: "recorderControlled",
        name: "课程录屏",
        icon: <CameraFilled style={{ fontSize: ".5rem", pointerEvents: "none", userSelect: "none" }} />,
        function: openRecorderControlled
      },
    ]
    menu = [...commonList]
    if (path === '/teach/bookTeach/bookPage') {
      menu.push(...menuList)
    }
    menu.push(...lastList)
    return menu;
  }

  const menuItems = getMenuItem()


  const toggleMenu = () => {
    if (isMenuVisible) {
      setIsModalVisible(true);
    }
    setIsMenuVisible(!isMenuVisible);
  };

  // 在这里处理动态菜单项布局
  useEffect(() => {
    if (!isMenuVisible) return;

    const menu = document.querySelector('.menu-items');
    const nodes = Array.from(menu.children);
    const visibleCount = 3;
    const radius = 110;

    nodes.forEach(node => {
      node.style.display = 'none';  // 先隐藏所有菜单项
    });

    for (let i = 0; i < visibleCount; i++) {
      const index = (startIndex + i) % menuItems.length;
      const angle = 45 * (i + 2);
      const x = radius * Math.cos(angle * Math.PI / 180);
      const y = -radius * Math.sin(angle * Math.PI / 180);
      nodes[index].style.display = 'flex';
      nodes[index].style.transform = `translate(${x}px, ${y}px)`;
    }
  }, [isMenuVisible, startIndex]);

  // 处理触摸和鼠标事件
  const handleStart = ({ clientX, clientY }) => {
    setStart({ X: clientX, Y: clientY });
    isDraggingRef.current = true;
  };

  const handleMove = ({ clientX, clientY }) => {
    if (!isDraggingRef.current) return;
    const deltaY = clientY - start.Y;
    const deltaX = clientX - start.X;
    if (Math.abs(deltaY) > 30 || Math.abs(deltaX) > 30) {
      setStartIndex(prevIndex => (deltaY < 0 || deltaX < 0 ? prevIndex + 1 : prevIndex - 1 + menuItems.length) % menuItems.length);
      setStart({ X: clientX, Y: clientY });
    }
  };

  const handleEnd = () => {
    isDraggingRef.current = false;
  };

  const screenPianoChangeNote = (noteId, isOn) => {
    pianoRef?.current.changeNote(noteId, isOn);
    midiSound.changeNote(noteId, isOn, 12);
  }

  const renderModal = () => (
    <Modal
      className='arcMenu-modal'
      open={isModalVisible}
      centered={true}
      footer={null} closable={false}
      maskClosable={true}
      maskStyle={{
        backgroundColor: 'transparent',
      }}
      onCancel={handleModalClose}
      style={{
        width: '100%',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.6rem 0',

        justifyContent: 'center',
      }}>
        {menuItems.map((item, index) => (
          <div key={`model-${item.key}`}
            style={{
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => {
              item.function();
              handleModalClose();
            }}>
            {item.icon}
            {item.name}
          </div>
        ))}
      </div>
    </Modal>
  );

  return (<>
    <div>
      {renderModal()}
      <div
        className="floating-button"
        style={{ backgroundColor: isMenuVisible ? 'rgba(250, 91, 57, 0.7)' : undefined }}
        onClick={toggleMenu}
      >
        <ToolOutlined style={{ fontSize: '.3rem' }} />
        <span style={{ fontSize: '.12rem' }}>{isMenuVisible ? '全部工具栏' : '工具栏'}</span>
      </div>
      <div className={'menu'}      > {/*`menu ${isMenuVisible ? 'show' : ''}`*/}
        <div className="menu-items"
          onTouchStart={(e) => { handleStart(e.touches[0]); }}
          onTouchMove={(e) => { handleMove(e.touches[0]); }}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => { handleStart(e); }}
          onMouseMove={(e) => { isDraggingRef.current && handleMove(e); }}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          draggable="false">
          {menuItems.map((item, index) => (
            <div key={item.key} className="menu-item" draggable="false"
              onClick={item?.function}>
              {item.icon}
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div
      style={{
        marginRight: '70px',
        position: 'fixed', top: 0, right: 0,
        width: '90vw', height: '100vh', zIndex: 499,
        display: (showCamera) ? ('block') : ('none'),
      }}
    >
      {(showCamera) && <CameraRecorder width={'100%'} height={'100%'} closeCamera={closeCamera} openPiano={openPiano} />}
    </div>
    {
      showPaint && <Paint closePaint={closePaint} />
    }
    {
      showRecorderControlled && <RecorderControlled closeRecorderControlled={closeRecorderControlled} />
    }
    <Metronome ref={metronome} />
    <div
      style={{
        width: '90vw',
        display: (showPiano) ? ('block') : ('none'),
        position: 'fixed',
        bottom: '0', right: '0',
        textAlign: 'right',
        zIndex: 500,
      }}
    >
      <Button icon={<CloseOutlined />}
        style={{
          borderTopLeftRadius: '50%', borderTopRightRadius: '50%',
          display: 'inline-block',
          marginRight: '.1rem'
        }}
        onClick={() => setShowPiano(false)}
      />
      <div style={{ marginRight: '150px', }}>
        <Piano
          notePlay={(id, isOn) => screenPianoChangeNote(id, isOn)}
          ref={pianoRef}
        />
      </div>
    </div>
  </>
  );
}

export default ArcMenu;