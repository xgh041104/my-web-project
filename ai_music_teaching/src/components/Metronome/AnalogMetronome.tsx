import { useEffect, useRef, useState } from 'react';
import { Slider, Spin } from 'antd';
import { useAudioContext } from '@/hooks/useAudioContext';

const AnalogMetronome: React.FC = () => {
    const [bpm, setBpm] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timerIDRef = useRef<number | null>(null);
    const nextNoteTimeRef = useRef(0);
    const pendulumAngleRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const normalBufferRef = useRef<AudioBuffer | null>(null);
    const accentBufferRef = useRef<AudioBuffer | null>(null);
    const firstBufferRef = useRef<AudioBuffer | null>(null);

    const { safelyInitAudioContext } = useAudioContext(
        audioCtxRef,
        normalBufferRef,
        accentBufferRef,
        firstBufferRef
    );

    // 绘制摆锤函数
    const drawPendulum = (angleRad: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height * 0.85);
        const armLength = (Math.min(canvas.width, canvas.height) / 2) * 1.3;

        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00A0A0';
        ctx.fill();

        ctx.rotate(angleRad);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00A0A0';
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -armLength);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -armLength, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#f8d38d';
        ctx.fill();

        ctx.restore();
    };

    // 动画摆锤
    const animatePendulum = () => {
        if (!isPlaying || !audioCtxRef.current) {
            // 停止播放时，确保摆锤恢复到中央位置
            pendulumAngleRef.current = 0;
            drawPendulum(0);
            return;
        }

        const now = audioCtxRef.current.currentTime;
        const secondsPerBeat = 60.0 / bpm;
        const period = secondsPerBeat * 2; // 完整一次摆动需要两拍

        // 使用固定的摆动幅度
        const maxAngleRad = (40 * Math.PI) / 180; // 固定40度摆动角度

        const phase = ((now % period) / period); // 0-1之间的相位
        const targetAngle = -maxAngleRad * Math.cos(2 * Math.PI * phase);

        // 记录之前的角度，用于检测穿过中心
        const prevAngle = pendulumAngleRef.current;

        // 平滑过渡
        const smoothing = 0.3;
        pendulumAngleRef.current = pendulumAngleRef.current + (targetAngle - pendulumAngleRef.current) * smoothing;

        // 检测摆锤是否从一侧穿过中央位置
        // 如果前一帧的角度和当前角度符号不同，表示摆锤穿过中央
        if ((prevAngle < 0 && pendulumAngleRef.current >= 0) ||
            (prevAngle > 0 && pendulumAngleRef.current <= 0)) {
            // 播放音效
            if (audioCtxRef.current && normalBufferRef.current) {
                const source = audioCtxRef.current.createBufferSource();
                source.buffer = normalBufferRef.current;
                source.connect(audioCtxRef.current.destination);
                source.start();
            }
        }

        // 绘制摆锤
        drawPendulum(pendulumAngleRef.current);

        // 继续动画
        animationFrameRef.current = requestAnimationFrame(animatePendulum);
    };

    // 精确的定时器，类似于libremetronome的实现
    // 移除定时器实现，改用摆锤位置来触发声音
    const scheduleNote = () => {
        if (!audioCtxRef.current) return;

        const secondsPerBeat = 60.0 / bpm;
        // 将lookahead设为0，我们将使用摆锤位置来触发声音
        const lookahead = 0;

        // 保留计时，但不实际播放声音（声音由摆锤触发）
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + lookahead) {
            nextNoteTimeRef.current += secondsPerBeat;
        }

        // 刷新率设为每25ms运行一次调度程序
        timerIDRef.current = window.setTimeout(scheduleNote, 25);
    };

    // 使用useLayoutEffect确保在DOM绘制前就绘制摆锤
    useEffect(() => {
        if (canvasRef.current && isLoaded) {
            drawPendulum(0);
        }
    }, [isLoaded]);

    // 初始化音频上下文
    useEffect(() => {
        safelyInitAudioContext().then((ctx) => {
            if (ctx && normalBufferRef.current) {
                if (ctx.state === 'suspended') {
                    ctx.resume().then(() => setIsLoaded(true));
                } else {
                    setIsLoaded(true);
                }
            }
        });

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            if (timerIDRef.current) {
                clearTimeout(timerIDRef.current);
            }
        };
    }, []);

    // 启动/停止定时器
    useEffect(() => {
        if (isPlaying && audioCtxRef.current) {
            // 确保音频上下文处于运行状态
            audioCtxRef.current.resume().then(() => {
                // 设置初始值
                nextNoteTimeRef.current = audioCtxRef.current!.currentTime;
                // 启动调度器
                scheduleNote();
                // 启动摆锤动画
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                animationFrameRef.current = requestAnimationFrame(animatePendulum);
            });
        } else {
            // 停止定时器
            if (timerIDRef.current !== null) {
                clearTimeout(timerIDRef.current);
                timerIDRef.current = null;
            }

            // 取消动画帧，并重置摆锤位置
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            // 确保摆锤恢复到中央位置
            pendulumAngleRef.current = 0;
            drawPendulum(0);
        }

        return () => {
            if (timerIDRef.current !== null) {
                clearTimeout(timerIDRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, bpm]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.1rem',
            padding: '0.2rem',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 0.1rem rgba(0,0,0,0.3)',
        }}>
            {!isLoaded ? (
                <Spin size="large" tip="加载音频..." />
            ) : (
                // 横向布局：左边 canvas，右边控制面板
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                }}>
                    {/* 左边 canvas */}
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={400}
                        style={{
                            width: '100%',
                            maxWidth: '4rem',
                            height: 'auto',
                        }}
                    />

                    {/* 右边控制面板 */}
                    <div style={{
                        width: '90%',
                        maxWidth: '2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Slider
                            min={40}
                            max={240}
                            style={{ width: '100%' }}
                            value={bpm}
                            onChange={(val) => setBpm(val as number)}
                        />
                        <div style={{
                            textAlign: 'center',
                            color: '#1890ff',
                            fontSize: '0.16rem',
                        }}>{bpm} BPM</div>
                        <button
                            style={{
                                marginTop: '0.3rem',
                                padding: '0.1rem 0.2rem',
                                fontSize: '0.16rem',
                                backgroundColor: isPlaying ? '#ff4d4f' : '#1890ff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0.04rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                            onClick={() => {
                                if (!isPlaying && audioCtxRef.current) {
                                    audioCtxRef.current.resume().then(() => {
                                        setIsPlaying(true);
                                    });
                                } else {
                                    setIsPlaying(!isPlaying);
                                }
                            }}
                        >
                            {isPlaying ? '停止' : '开始'}
                        </button>
                    </div>
                </div>
            )}
        </div>

    );
};

export default AnalogMetronome;