import React, { useState, useEffect, useRef } from 'react';
import { Select, Button, Switch, Space } from "antd";
import { CloseOutlined, SwapOutlined, DeleteOutlined } from '@ant-design/icons'
import './index.css'
function Paint({ closePaint }) {
  const [eraserStatus, setEraserStatus] = useState(false);
  const [currentTool, setCurrentTool] = useState('brush');
  const [currentColor, setCurrentColor] = useState('#000');
  const [lineWidth, setLineWidth] = useState('8');
  const [eraserWidth, setEraserWidth] = useState('50');

  const floatButtonRef = useRef(null);
  const fullscreenRef = useRef(null);
  const canvasRef = useRef(null);
  const onEraserCircle = useRef(null);
  const ctx = useRef(null);

  var prevImageData = null;

  useEffect(() => {
    // 画布元素加载完毕
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d', { willReadFrequently: true });
      build();
    }

  }, []); // 无依赖项 在挂载后执行

  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = document.documentElement.clientHeight;

  const state = {
    initPos: null,
  }

  const setCanvasLineWidth = (width) => {
    ctx.current.lineWidth = width;
  }

  const setCanvasStyle = (color) => {
    ctx.current.strokeStyle = color;
    ctx.current.fillStyle = color;
  }

  const build = () => {
    setCanvasStyle(currentColor);
    setCanvasLineWidth(lineWidth)
    ctx.current.lineCap = 'round';
    ctx.current.lineJoin = 'round';
  }

  const handleChangeBrush = (toolType) => {
    setCurrentTool(toolType);
    setLineWidth(lineWidth);
    setCanvasLineWidth(lineWidth);
    setEraserCircleVisible(false);
    setEraserStatus(false);
  }

  const handleChangeValue = (event) => {
    const color = event.target.value;
    setCanvasStyle(color);
    setCanvasLineWidth(lineWidth);
    setCurrentColor(color);
    setEraserCircleVisible(false);
    setEraserStatus(false);
  }

  const handleChangeLineWidth = (width) => {
    setEraserCircleVisible(false);
    setLineWidth(width);
    setCanvasLineWidth(width);
  }

  const handleClearAll = () => {
    clearAll();
  }

  const handleUseEraser = (value) => {
    const lineWidth = value ? value : eraserWidth;
    setCanvasLineWidth(lineWidth);
    setEraserSize(lineWidth);
    setEraserWidth(lineWidth);
    setEraserStatus(true);
    onEraserCircle.current.style.display = 'none';
  }

  const handleDrawing = (e) => {

    // 获取当前坐标
    const x1 = e.touches ? e.touches[0].clientX : e.clientX;
    const y1 = e.touches ? e.touches[0].clientY : e.clientY;

    // 修改当前指针状态
    canvasRef.current.style.cursor = 'pointer';

    prevImageData = ctx.current.getImageData(0, 0, canvasRef.current?.width, canvasRef.current?.height);

    state.initPos = { x1, y1 };

    // 橡皮模式
    if (eraserStatus) {
      ctx.current.clearRect(x1 - eraserWidth / 2, y1 - eraserWidth / 2, eraserWidth, eraserWidth);
    } else { // 绘图模式
      if (currentTool === 'brush') {
        drawPoint(x1, y1);
      }
    }

    canvasRef.current?.addEventListener('mousemove', handleCanvasMove, false);
    canvasRef.current?.addEventListener('touchmove', handleCanvasMove, false);
    canvasRef.current?.addEventListener('mouseup', handleCanvasUp, false);
    canvasRef.current?.addEventListener('touchend', handleCanvasUp, false);

    if (eraserStatus) {
      setEraserCircleVisible(true);
      setEraserPosition(x1, y1);
      onEraserCircle.current.addEventListener('mouseup', handleEraserCircleUp, false);
      onEraserCircle.current.addEventListener('touchend', handleEraserCircleUp, false);
    }
  }

  const handleCanvasMove = (e) => {
    const x2 = e.touches ? e.touches[0].clientX : e.clientX;
    const y2 = e.touches ? e.touches[0].clientY : e.clientY;


    // 绘图模式
    if (!eraserStatus) {
      if (currentTool === 'brush') {
        drawLine({ ...state.initPos, x2, y2 });
      } else {
        drawGraph({ ...state.initPos, x2, y2 });
      }
    } else { // 橡皮模式
      ctx.current.clearRect(x2 - eraserWidth / 2, y2 - eraserWidth / 2, eraserWidth, eraserWidth);
      setEraserPosition(x2, y2);
    }

    if (currentTool === 'brush' || eraserStatus) {
      state.initPos = { x1: x2, y1: y2 };
    }

  }

  // 切换背景的颜色的样式
  const handleDisplayBackground = () => {
    if (fullscreenRef.current.classList.contains('canvasBackground')) {
      fullscreenRef.current.classList.remove('canvasBackground');
    } else {
      fullscreenRef.current.classList.add('canvasBackground');
    }
  }

  const handleCanvasUp = () => {
    // 从画布上抬起笔后恢复默认样式
    canvasRef.current.style.cursor = 'default';
    canvasRef.current?.removeEventListener('mousemove', handleCanvasMove, false);
    canvasRef.current?.removeEventListener('touchmove', handleCanvasMove, false);
    canvasRef.current?.removeEventListener('mouseup', handleCanvasUp, false);
    canvasRef.current?.removeEventListener('touchend', handleCanvasUp, false);
  }

  const handleEraserCircleUp = () => {
    setEraserCircleVisible(false);
    onEraserCircle.current.removeEventListener('mouseup', handleEraserCircleUp, false);
    onEraserCircle.current.removeEventListener('touchend', handleEraserCircleUp, false);
    handleCanvasUp();
  }

  const drawPoint = (x, y) => {
    if (!ctx.current) {
      return;
    }
    ctx.current.beginPath();
    ctx.current.arc(x, y, lineWidth / 2, 0, 2 * Math.PI, false);
    ctx.current.fill();
  }

  const drawLine = ({ x1, y1, x2, y2 }) => {
    if (!ctx.current) {
      return;
    }
    ctx.current.beginPath();
    ctx.current.moveTo(x1, y1);
    ctx.current.lineTo(x2, y2);
    ctx.current.stroke();
  }

  const handleStartFloatButton = (e) => {
    let isDragging = true;
    // 获取当前按钮的对齐位置
    const btnStartX = floatButtonRef.current.offsetLeft;
    const btnStartY = floatButtonRef.current.offsetTop;
    // 获取鼠标指针的点击触发位置
    const startClientX = e.touches ? e.touches[0].clientX : e.clientX;
    const startClientY = e.touches ? e.touches[0].clientY : e.clientY;
    const handleMoveFloatButton = (e) => {
      // startX: 当前按钮和左边的距离 startY: 当前按钮和上边的距离
      // 当前按钮正确位置： 上一次被校正的位置 + 鼠标指针自身偏移的位置
      if (isDragging) {
        const currentX = btnStartX + e.clientX - startClientX;
        const currentY = btnStartY + e.clientY - startClientY;
        floatButtonRef.current.style.left = `${currentX}px`;
        floatButtonRef.current.style.top = `${currentY}px`;
      }
    }

    const handleUpFloatButton = () => {
      // 关闭浮动按钮的拖动按钮
      isDragging = false;
      document.removeEventListener('mousemove', handleMoveFloatButton, false);
      document.removeEventListener('touchmove', handleMoveFloatButton, false);
      document.removeEventListener('mouseup', handleUpFloatButton, false);
      document.removeEventListener('touchend', handleUpFloatButton, false);
    }

    document.addEventListener('mousemove', handleMoveFloatButton, false);
    document.addEventListener('touchmove', handleMoveFloatButton, false);
    document.addEventListener('mouseup', handleUpFloatButton, false);
    document.addEventListener('touchend', handleUpFloatButton, false);
  }

  const drawGraph = ({ x1, y1, x2, y2 }) => {
    if (!ctx.current) {
      return;
    }
    ctx.current.putImageData(prevImageData, 0, 0);
    if (currentTool === 'line') {
      ctx.current.beginPath();
      ctx.current.moveTo(x1, y1);
      ctx.current.lineTo(x2, y2);
      ctx.current.stroke();
    } else if (currentTool === 'rect') {
      ctx.current.beginPath();
      ctx.current.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.current.stroke();
    } else if (currentTool === 'circle') {
      ctx.current.beginPath();
      ctx.current.ellipse(x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1), 0, 0, 2 * Math.PI);
      ctx.current.stroke();
    }
  }

  const clearAll = () => {
    ctx.current.clearRect(0, 0, canvasRef.current?.offsetWidth, canvasRef.current?.offsetHeight);
  }

  const setEraserCircleVisible = (visible) => {
    if (onEraserCircle.current) {
      onEraserCircle.current.style.display = visible ? 'block' : 'none';
    } else {
      onEraserCircle.current.style.display = 'none';
    }
  };

  const setEraserSize = (size) => {
    if (onEraserCircle.current) {
      onEraserCircle.current.style.width = size + 'px';
      onEraserCircle.current.style.height = size + 'px';
    }
  };

  const setEraserPosition = (x, y) => {
    if (onEraserCircle.current) {
      onEraserCircle.current.style.left = x - onEraserCircle.current.offsetWidth / 2 + 'px';
      onEraserCircle.current.style.top = y - onEraserCircle.current.offsetHeight / 2 + 'px';
    }
  }

  // 工具类型
  const tools = [
    { value: 'brush', label: '涂鸦' },
    { value: 'line', label: '直线' },
    { value: 'rect', label: '矩形' },
    { value: 'circle', label: '椭圆' },
  ];

  // 笔画大小设置
  const brushSize = [
    { value: '3', label: '小' },
    { value: '5', label: '较小' },
    { value: '8', label: '正常' },
    { value: '12', label: '较大' },
    { value: '15', label: '大' },
  ];

  // 橡皮大小设置
  const eraserSize = [
    { value: '20', label: '小' },
    { value: '30', label: '较小' },
    { value: '50', label: '正常' },
    { value: '80', label: '较大' },
    { value: '120', label: '大' },
  ]

  return (<>
    {/* 默认透明背景 */}
    <div ref={fullscreenRef} className="fullscreen">
      {/* todo：上面一排三个、下面一排三个， 关闭放到右上角去，调整间距
          使用弹性盒子： 一排三个 两排盒子
          X 按钮根据toolbar来内部进行定位
      */}
      <div className="tool-bar floatButton"
        ref={floatButtonRef}
        onMouseDown={handleStartFloatButton}
        onTouchStart={handleStartFloatButton}
      >

        {/* todo：整到右上角去 */}
        <div style={{
          position: 'absolute',
          borderRadius: '0 .2rem 0 0',
          borderColor: 'transparent',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          width: '.5rem',
          height: '.5rem',
          textAlign: 'center',
          top: '.1rem',
          right: '-.05rem',
        }} onClick={() => {
          clearAll(); // 关闭时先清空画布，以防下次打开内容复现
          canvasRef.current?.removeEventListener('mousemove', handleCanvasMove, false);
          canvasRef.current?.removeEventListener('touchmove', handleCanvasMove, false);
          canvasRef.current?.removeEventListener('mouseup', handleCanvasUp, false);
          canvasRef.current?.removeEventListener('touchend', handleCanvasUp, false);
          closePaint();
        }}
        ><CloseOutlined style={{ fontSize: '.25rem' }} /></div>

        {/* 第一行元素 */}
        <div className="first-row">
          <Space size={'large'}>
            <span>
              画笔类型：
              <Select
                defaultValue="brush"
                style={{ width: 120 }}
                value={currentTool}
                onChange={handleChangeBrush}
                options={tools}
              />
            </span>
            <span>
              画笔颜色：
              <input type="color"
                label="画笔颜色"
                value={currentColor}
                onClick={handleChangeValue}
                onInput={handleChangeValue}
              />
            </span>
            <span>
              画笔粗细：
              <Select
                value={lineWidth}
                style={{ width: 120 }}
                onChange={handleChangeLineWidth}
                options={brushSize}
              />
            </span>
          </Space>
        </div>


        {/* 第二行元素 */}
        <div className="second-row">
          <Space size={'large'}>
            <Button className="btnStyle" onClick={handleDisplayBackground} icon={<SwapOutlined />}>切换背景</Button>
            <Button className="btnStyle" onClick={handleClearAll} icon={<DeleteOutlined />}>清空画布</Button>
            {/* <button onClick={() => { handleUseEraser(); }}>橡皮擦</button> */}
            <Switch checkedChildren='退出橡皮擦'
              unCheckedChildren='打开橡皮擦'
              onChange={(checked) => {
                if (checked) {
                  handleUseEraser();
                } else {
                  handleChangeBrush(currentTool);
                }
              }}
            />
            <span>
              橡皮大小：
              <Select
                value={eraserWidth}
                style={{ width: 120 }}
                onChange={handleUseEraser}
                options={eraserSize}
              />
            </span>
          </Space>
        </div>

      </div>

      <span ref={onEraserCircle} className="eraser-circle"></span>

      <canvas ref={canvasRef}
        width={clientWidth}
        height={clientHeight}
        onMouseDown={handleDrawing}
        onTouchStart={handleDrawing}
      ></canvas>

    </div>
  </>
  );
}

export default Paint;