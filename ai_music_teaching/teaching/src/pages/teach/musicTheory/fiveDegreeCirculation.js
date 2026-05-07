
import React, { useRef, useState, useEffect } from 'react';
import { baseUrl } from 'config'
import './fiveDegreeCirculation.css'
const FiveDegreeCirculation = ({ onData, activeRotation }) => {

  // 旋转角度的状态
  const [rotationAngle, setRotationAngle] = useState(0); // 当前的累积旋转角度
  const [isDragging, setIsDragging] = useState(false); // 当前是否在滑动
  const startAngleRef = useRef(0); // 拖动开始时的角度
  const prevAngleRef = useRef(0); // 累积角度的缓存
  const centerRef = useRef({ x: 0, y: 0 }); // 圆心位置

  // 获取事件的位置
  const getEventPosition = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      return { x: e.clientX, y: e.clientY };
    }
  };

  // 计算相对于中心点的角度
  const calculateAngle = (x, y) => {
    const { x: cx, y: cy } = centerRef.current;
    const deltaX = x - cx;
    const deltaY = y - cy;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const handleStart = (e) => {
    setIsDragging(true);
    const position = getEventPosition(e);
    const rect = e.target.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const startAngle = calculateAngle(position.x, position.y);
    startAngleRef.current = startAngle;
    prevAngleRef.current = rotationAngle; // 保存当前的累积旋转角度
  };

  const handleMove = (e) => {
    if (!isDragging) return;

    const position = getEventPosition(e);
    const currentAngle = calculateAngle(position.x, position.y);

    let angleDifference = currentAngle - startAngleRef.current;

    // 处理跨越180度时的角度变化，确保旋转方向保持一致
    if (angleDifference > 180) {
      angleDifference -= 360;
    } else if (angleDifference < -180) {
      angleDifference += 360;
    }

    // 更新累积的旋转角度
    const newAngle = prevAngleRef.current + angleDifference;
    const alignedAngle = Math.round(newAngle / 24) * 24; // 保持24度对齐

    setRotationAngle(alignedAngle);
    if (rotationAngle != alignedAngle) {  //确保一次只转一格，简化处理
      handleEnd();
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);


  // 旋转的时候切换状态
  useEffect(() => {
    onData(((rotationAngle % 360) + 360) % 360);
  }, [rotationAngle]);

  // 父组件按钮切换的时候使得内部文字旋转
  useEffect(() => {
    if (activeRotation) {
      setRotationAngle(activeRotation);
    }
  }, [activeRotation]);

  const prefix = baseUrl + "/image/teach/musicTheory";

  return (
    <>
      <div style={{
        width: '3.3rem',
        height: '3.3rem',
        position: 'absolute',
        top: '0',
        right: '-7%',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* 背景图片 */}
        <img
          src={prefix + '/circulationImage.png'}
          alt="背景图片加载错误"
          style={{
            width: 'auto',
            height: '3.2rem',
            objectFit: 'contain',  // 确保图像比例正确
            position: 'absolute',
            zIndex: 1,
          }}
          draggable="false"
        />

        {/* 中间内部的白色圆形 */}
        <div className="circle" style={{
          position: 'absolute',
          top: '49%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1.2rem',
          height: '1.2rem',
          zIndex: 2,
        }} draggable="false">
        </div>

        {/* 选项填充的菜单 */}
        <img src={prefix + '/optional.png'} style={{
          position: 'absolute',
          top: '20%',
          left: '49.5%',
          transform: 'translate(-50%, -50%)',
          height: 'auto', // 根据宽度自动调整
          width: '.75rem',
          zIndex: 2,
        }} draggable="false" />

        {/* 转盘中的文字，可以拖动旋转 */}
        <img
          src={prefix + '/circulationFont.png'}
          alt="文字加载错误"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
            cursor: 'grab',  // 显示抓取的图标
            width: '2.6rem',
            height: 'auto',
            transition: 'transform 0.5s ease',
            userSelect: 'none',
            zIndex: 3,  // 最高层级
          }}
          draggable="false"
          onMouseDown={handleStart}  // 鼠标事件
          onTouchStart={handleStart}  // 触摸事件
        />

        {/* 倒三角形 */}
        <div className="triangle" style={{
          position: 'absolute',
          top: '3%',
          left: '49.5%',
          transform: 'translateX(-50%)',
          zIndex: 3,
        }} draggable="false">
        </div>
      </div>
    </>
  );
};

export default FiveDegreeCirculation;
