import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { TimeSignature, timeSignatures, emphasisOptions, beatTypes, BEAT_MODE } from './CircleMetronomeTypes';
import { CircleMetronomeRenderer } from './CircleMetronomeRenderer';
import { calculateBeatProgress } from './CircleMetronomeCanvasUtils';
import { handleCanvasClick, handleCanvasMouseMove } from './CircleMetronomeEvents';
import { useAudioContext } from '@/hooks/useAudioContext';
import './CircleMetronome.css';

// 创建和播放音频的工具函数
const createAudioSource = (
    ctx: AudioContext,
    buffer: AudioBuffer,
    destination: AudioNode
): AudioBufferSourceNode => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(destination);
    source.start(0);
    return source;
};

// 处理音量变化的工具函数
const updateGainNode = (
    gainNode: GainNode,
    audioCtx: AudioContext,
    volume: number,
    isEnabled: boolean
): void => {
    // 如果启用了音频，则应用当前音量，否则静音
    const effectiveVolume = isEnabled ? volume : 0;
    const currentTime = audioCtx.currentTime;

    try {
        // 避免设置为0的情况下使用exponentialRamp (会导致错误)
        if (effectiveVolume === 0) {
            gainNode.gain.linearRampToValueAtTime(0.00001, currentTime + 0.02);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.03);
        } else {
            // 首先设置一个微小值防止从0开始使用exponentialRamp
            if (gainNode.gain.value < 0.00001) {
                gainNode.gain.setValueAtTime(0.00001, currentTime);
            } else {
                gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            }

            // 然后使用指数渐变平滑过渡到目标音量
            gainNode.gain.exponentialRampToValueAtTime(
                effectiveVolume / 100,
                currentTime + 0.03
            );
        }
    } catch (error) {
        // 回退到直接设置音量
        console.error('音量渐变失败，使用直接设置:', error);
        gainNode.gain.setValueAtTime(effectiveVolume / 100, currentTime);
    }
};

// 初始化节拍模式的工具函数
const initBeatPattern = (beatCount: number, emphasisPattern: number): string[] => {
    // 初始化全部为普通拍
    let newPattern: string[] = new Array(beatCount).fill(BEAT_MODE.NORMAL);

    // 第一拍总是 FIRST
    if (beatCount > 0) {
        newPattern[0] = BEAT_MODE.FIRST;
    }

    // 处理强拍设置
    if (emphasisPattern === 0) {
        // 无强拍模式：除了第一拍是FIRST外，其他都是NORMAL
        // 已经在初始化时设置好了，无需额外操作
    } else if (emphasisPattern > 0 && emphasisPattern < beatCount) {
        // 按指定间隔设置强拍
        // 例如: 对于"每2拍"，强拍应该是第3、5、7...拍（索引为2、4、6...）
        // 即，emphasisPattern = 2 时，强拍索引应该是 2, 4, 6, ...

        // 从第一个应有强拍的位置开始
        let startIndex = emphasisPattern; // 例如 "每2拍" 时，从索引2（第3拍）开始

        for (let i = startIndex; i < beatCount; i += emphasisPattern) {
            newPattern[i] = BEAT_MODE.ACCENT;
        }
    }



    return newPattern;
};

// 主组件
const CircleMetronome: React.FC = () => {
    // 音频相关引用
    const audioCtxRef = useRef<AudioContext | null>(null);
    const normalBufferRef = useRef<AudioBuffer | null>(null);
    const accentBufferRef = useRef<AudioBuffer | null>(null);
    const firstBufferRef = useRef<AudioBuffer | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // 使用钩子初始化音频
    const { safelyInitAudioContext, isAudioReady } = useAudioContext(
        audioCtxRef,
        normalBufferRef,
        accentBufferRef,
        firstBufferRef
    );

    // 音频相关状态
    const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
    const [volume, setVolume] = useState<number>(80);
    const [prevVolume, setPrevVolume] = useState<number>(80); // 存储静音前的音量

    // 节拍器状态
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [bpm, setBpm] = useState<number>(100);
    const [timeSignature, setTimeSignature] = useState<TimeSignature>(timeSignatures[3]); // 默认4/4拍
    const [currentBeat, setCurrentBeat] = useState<number>(-1);
    const [emphasisPattern, setEmphasisPattern] = useState<number>(0); // 默认无强拍
    const [customBeatPattern, setCustomBeatPattern] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Canvas相关引用
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<CircleMetronomeRenderer | null>(null);
    const beatPositionsRef = useRef<any[]>([]);
    const [beatProgress, setBeatProgress] = useState<number>(0);

    // 调度器状态
    const timerIDRef = useRef<number | null>(null);
    const nextNoteTimeRef = useRef<number>(0);
    const currentBeatRef = useRef<number>(-1);

    // 节流计数器，用于减少相邻渲染之间的重复
    const renderThrottleRef = useRef<number>(0);

    // 初始化音频上下文和Canvas
    useEffect(() => {
        // 初始化音频上下文
        safelyInitAudioContext().then((ctx) => {
            if (ctx) {
                // 创建一个主增益节点，所有音频都会通过它
                const mainGain = ctx.createGain();
                mainGain.gain.value = audioEnabled ? volume / 100 : 0;
                mainGain.connect(ctx.destination);
                gainNodeRef.current = mainGain;

                // 设置为非加载状态
                setIsLoading(false);
            } else {
                console.error('初始化音频上下文失败');
                setIsLoading(false);
            }
        });

        // 初始化Canvas渲染器
        if (canvasRef.current) {
            try {
                rendererRef.current = new CircleMetronomeRenderer(canvasRef.current);
                resizeCanvas();
            } catch (error) {
                console.error('创建渲染器失败:', error);
            }
        }

        // 添加窗口大小变化监听
        window.addEventListener('resize', resizeCanvas);

        // 初始化默认节拍模式 - 直接使用4/4拍，确保初始化时的一致性
        initializeCustomBeatPattern(timeSignature.beats);

        // 确保在初始化后立即更新Canvas
        setTimeout(() => {
            updateCanvas();
        }, 0);

        // 添加用户交互监听器，确保可以激活音频上下文
        const activateAudioContext = () => {
            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
        };

        document.addEventListener('click', activateAudioContext);
        document.addEventListener('touchstart', activateAudioContext);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            document.removeEventListener('click', activateAudioContext);
            document.removeEventListener('touchstart', activateAudioContext);

            if (timerIDRef.current) {
                window.clearTimeout(timerIDRef.current);
            }
        };
    }, []);

    // 监听音量和音频启用状态变化
    useEffect(() => {
        if (audioCtxRef.current && gainNodeRef.current) {
            updateGainNode(gainNodeRef.current, audioCtxRef.current, volume, audioEnabled);
        }
    }, [volume, audioEnabled]);

    // 监听BPM变化
    useEffect(() => {
        // 只有当正在播放时才应用BPM变化
        if (isPlaying && timerIDRef.current) {
            // 暂停当前调度器
            clearTimeout(timerIDRef.current);
            timerIDRef.current = null;

            // 使用新的BPM重新启动节拍器
            const resumeMetronome = () => {
                if (!audioCtxRef.current || !normalBufferRef.current || !accentBufferRef.current || !firstBufferRef.current) {
                    console.error('音频上下文或音频缓冲区不可用');
                    return;
                }

                // 确保AudioContext已恢复
                if (audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }

                // 定义调度器函数
                const scheduler = () => {
                    if (!isPlaying) return;

                    // 检查AudioContext是否存在
                    if (!audioCtxRef.current) return;

                    // 计算当前拍的进度
                    const progress = calculateBeatProgress(
                        isPlaying,
                        audioCtxRef.current,
                        nextNoteTimeRef.current,
                        bpm
                    );
                    setBeatProgress(progress);

                    // 如果当前时间已经超过下一拍的时间，则播放下一拍
                    while (audioCtxRef.current.currentTime + 0.1 >= nextNoteTimeRef.current) {
                        // 计算下一拍的索引 - 使用ref而不是state
                        const nextBeat = (currentBeatRef.current + 1) % timeSignature.beats;

                        // 获取当前节拍类型
                        const beatType = customBeatPattern[nextBeat];

                        // 根据节拍类型获取对应的音频缓冲区
                        let buffer = normalBufferRef.current; // 默认普通拍
                        if (beatType === BEAT_MODE.FIRST) {
                            buffer = firstBufferRef.current;
                        } else if (beatType === BEAT_MODE.ACCENT) {
                            buffer = accentBufferRef.current;
                        }

                        // 播放对应类型的音频 - 空拍不播放声音
                        if (buffer && beatType !== BEAT_MODE.EMPTY) {
                            playAudio(buffer, nextBeat, beatType);
                        }

                        // 更新当前拍 - 同时更新ref和state
                        currentBeatRef.current = nextBeat;
                        setCurrentBeat(nextBeat);

                        // 更新下一拍的时间 - 使用最新的BPM值计算
                        nextNoteTimeRef.current += 60.0 / bpm;
                    }

                    // 继续调度
                    timerIDRef.current = window.setTimeout(scheduler, 25);
                };

                // 启动调度器
                scheduler();
            };

            // 立即执行
            resumeMetronome();
        }
    }, [bpm, isPlaying, customBeatPattern, timeSignature.beats]);

    // 监听拍号或强拍设置变化，重新计算节拍模式
    useEffect(() => {
        if (timeSignature.beats > 0) {
            // 由于拍号或强拍设置变化，重新计算节拍模式
            // console.log(`当前拍号: ${timeSignature.beats}/${timeSignature.unit}, 强拍设置: ${emphasisPattern}`);

            // 重新初始化节拍模式
            const newPattern = initBeatPattern(timeSignature.beats, emphasisPattern);
            setCustomBeatPattern(newPattern);

            // 如果正在播放，则需要停止播放
            if (isPlaying) {
                setIsPlaying(false);
            }
        }
    }, [timeSignature, emphasisPattern]); // 同时监听两个依赖项

    // 添加Canvas事件监听
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 添加点击事件
        const clickHandler = (e: MouseEvent) =>
            handleCanvasClick(
                e,
                canvas,
                beatPositionsRef.current,
                isPlaying,
                customBeatPattern,
                updateBeatType
            );

        // 添加鼠标移动事件
        const mouseMoveHandler = (e: MouseEvent) =>
            handleCanvasMouseMove(
                e,
                canvas,
                beatPositionsRef.current,
                isPlaying
            );

        canvas.addEventListener('click', clickHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);

        return () => {
            canvas.removeEventListener('click', clickHandler);
            canvas.removeEventListener('mousemove', mouseMoveHandler);
        };
    }, [isPlaying, customBeatPattern]);

    useEffect(() => {
        if (isPlaying) {
            startMetronome();
        } else {
            stopMetronome();
        }
    }, [isPlaying]);

    // 渲染帧动画
    useEffect(() => {
        let animationId: number;

        // 创建限制过多渲染的闭包变量
        let lastTimeSignatureBeats = timeSignature.beats;
        let lastIsPlaying = isPlaying;
        let renderSkipCount = 0;

        const animate = () => {
            if (canvasRef.current && rendererRef.current && audioCtxRef.current) {

                // 更新闭包变量
                lastTimeSignatureBeats = timeSignature.beats;
                lastIsPlaying = isPlaying;

                // 节流算法 - 连续检测到多次修改时，最多只渲染一次
                if (renderThrottleRef.current > 0) {
                    renderThrottleRef.current--;
                    renderSkipCount++;
                    // 仍然请求下一帧，但不执行实际渲染
                    animationId = requestAnimationFrame(animate);
                    return;
                }

                // 计算节拍进度
                const progress = calculateBeatProgress(
                    isPlaying,
                    audioCtxRef.current,
                    nextNoteTimeRef.current,
                    bpm
                );
                setBeatProgress(progress);

                // 渲染节拍器
                const positions = rendererRef.current.drawCircleMetronome(
                    timeSignature,
                    emphasisPattern,
                    customBeatPattern,
                    isPlaying,
                    currentBeat,
                    progress,
                    bpm,
                    beatTypes,
                    getBeatSoundType
                );

                beatPositionsRef.current = positions;
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isPlaying, bpm, timeSignature, emphasisPattern, customBeatPattern, currentBeat]);

    // 确保开始播放前节拍模式与拍号匹配
    useEffect(() => {
        if (isPlaying && customBeatPattern.length !== timeSignature.beats) {
            console.warn(`播放时发现节拍模式与拍号不匹配，重新设置节拍模式: ${customBeatPattern.length} => ${timeSignature.beats}`);
            // 根据当前强拍设置重新生成节拍模式
            setCustomBeatPattern(initBeatPattern(timeSignature.beats, emphasisPattern));
        }
    }, [isPlaying, timeSignature.beats, customBeatPattern.length]);

    // 初始化默认节拍模式
    const initializeCustomBeatPattern = (beatCount: number) => {
        // 使用当前的emphasisPattern值生成节拍模式
        // console.log(`准备初始化节拍模式 - 节拍数: ${beatCount}, 强拍设置: ${emphasisPattern}`);

        // 生成新的节拍模式
        const pattern = initBeatPattern(beatCount, emphasisPattern);
        // console.log('新生成的节拍模式:', pattern.map((t, i) => `${i + 1}: ${t}`).join(', '));

        // 更新状态
        setCustomBeatPattern(pattern);
    };

    // 获取节拍音效类型
    const getBeatSoundType = (beatIndex: number): string => {
        // 首先检查索引是否有效
        if (beatIndex < 0) {
            return BEAT_MODE.NORMAL;
        }

        // 检查节拍模式与当前拍号是否匹配
        if (customBeatPattern.length !== timeSignature.beats) {
            // 节拍模式与拍号不匹配时，使用默认规则
            if (beatIndex === 0) {
                return BEAT_MODE.FIRST; // 第一拍
            }

            // 处理强拍逻辑
            if (emphasisPattern > 0 && beatIndex % emphasisPattern === 0) {
                return BEAT_MODE.ACCENT; // 强拍
            }

            return BEAT_MODE.NORMAL; // 普通拍
        }

        // 节拍模式与拍号匹配时，直接使用自定义节拍模式
        if (beatIndex < customBeatPattern.length) {
            return customBeatPattern[beatIndex];
        }

        // 防御性编程，如果索引超出范围，返回默认值
        return BEAT_MODE.NORMAL;
    };

    // 更新节拍类型
    const updateBeatType = (index: number, type: string) => {
        if (index >= 0 && index < customBeatPattern.length) {
            const newPattern = [...customBeatPattern];
            const oldType = newPattern[index];
            newPattern[index] = type;

            // console.log(`节拍类型更新：节拍 ${index + 1}，从 ${oldType} 变更为 ${type}`);
            // console.log('当前完整节拍模式：', newPattern.map((t, i) => `${i + 1}: ${t}`).join(', '));

            setCustomBeatPattern(newPattern);
        }
    };

    // 停止节拍器 - 仅清理定时器和状态，不更改节拍模式
    const stopMetronome = () => {
        // 清除定时器
        if (timerIDRef.current) {
            clearTimeout(timerIDRef.current);
            timerIDRef.current = null;
        }

        // 重置节拍
        currentBeatRef.current = -1;
        setCurrentBeat(-1);
        setBeatProgress(0);

        // 确保在正确的节拍模式下更新最后一次Canvas
        updateCanvas();
    };

    // 更新拍号
    const changeTimeSignature = (newSignature: TimeSignature) => {
        // console.log(`拍号已更改：${timeSignature.beats}/${timeSignature.unit} -> ${newSignature.beats}/${newSignature.unit}`);

        // 直接更新拍号 - 相关逻辑通过useEffect处理
        setTimeSignature(newSignature);
        setCurrentBeat(-1);

        // 停止播放 - 通过useEffect监听timeSignature变化自动处理
    };

    // 重置Canvas大小
    const resizeCanvas = () => {
        if (canvasRef.current) {
            // 获取Canvas容器尺寸
            const container = canvasRef.current.parentElement;
            if (container) {
                const { width, height } = container.getBoundingClientRect();

                // 使用正方形尺寸确保不扭曲
                const size = Math.min(width, height) * 0.95;

                // 如果使用了渲染器的resizeCanvas方法
                if (rendererRef.current) {
                    rendererRef.current.resizeCanvas(size, size);
                    // 重新渲染
                    updateCanvas();
                    return;
                }

                // 旧的方法作为后备
                canvasRef.current.width = size;
                canvasRef.current.height = size;

                // 重新渲染
                updateCanvas();
            }
        }
    };

    // 播放音频
    const playAudio = (buffer: AudioBuffer, beatIndex: number, beatType: string) => {
        // 如果音频上下文或缓冲区不可用，则不播放
        if (!audioCtxRef.current || !buffer || !gainNodeRef.current) return;
        if (!audioEnabled) return;

        try {
            // 使用工具函数创建和播放音频源
            createAudioSource(audioCtxRef.current, buffer, gainNodeRef.current);
        } catch (error) {
            console.error('播放音频失败:', error);
        }
    }

    // 切换播放状态
    const togglePlay = () => {
        if (!isPlaying) {
            // 开始播放前，立即同步节拍模式和拍号
            if (customBeatPattern.length !== timeSignature.beats) {
                const newPattern = initBeatPattern(timeSignature.beats, emphasisPattern);
                // 直接设置自定义节拍模式，不触发React渲染循环
                setCustomBeatPattern(newPattern);
            }

            // 使用setTimeout确保React已更新状态
            setTimeout(() => {
                setIsPlaying(true);
            }, 0);
        } else {
            // 立即停止播放，简化停止逻辑，减少状态变更
            renderThrottleRef.current = 3; // 设置节流计数器，跳过接下来的3次渲染
            setIsPlaying(false);

            // 清除定时器
            if (timerIDRef.current) {
                clearTimeout(timerIDRef.current);
                timerIDRef.current = null;
            }

            // 重置节拍
            currentBeatRef.current = -1;
            setCurrentBeat(-1);
            setBeatProgress(0);
        }
    };

    // 切换声音
    const toggleSound = () => {
        if (audioEnabled) {
            // 静音：保存当前音量并设置为0
            setPrevVolume(volume);
            setVolume(0);
            setAudioEnabled(false);
        } else {
            // 取消静音：恢复之前的音量
            setAudioEnabled(true);
            setVolume(prevVolume);
        }
    };

    // 调整音量
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(e.target.value);

        // 如果音量大于0且当前是静音状态，则取消静音
        if (newVolume > 0 && !audioEnabled) {
            setAudioEnabled(true);
        } else if (newVolume === 0 && audioEnabled) {
            // 如果音量为0，则设为静音，但保存之前的音量
            setPrevVolume(volume);
            setAudioEnabled(false);
        }

        // 更新音量值
        setVolume(newVolume);
    };

    // 调整BPM
    const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newBpm = parseInt(e.target.value);
        if (isNaN(newBpm) || newBpm <= 0) return;
        updateBpmValue(newBpm);
    };

    // 更新BPM值并处理相关逻辑
    const updateBpmValue = (newBpm: number) => {
        if (newBpm === bpm) return;
        setBpm(newBpm);

        // 无需在这里重新调度，由useEffect监听bpm变化来处理
    };

    // 调整BPM按钮处理
    const handleBpmButtonClick = (increment: boolean) => {
        const change = increment ? 1 : -1;
        const newBpm = Math.max(30, Math.min(300, bpm + change));
        updateBpmValue(newBpm);
    };

    // 更新Canvas
    const updateCanvas = () => {
        if (rendererRef.current && canvasRef.current) {
            const newBeatPositions = rendererRef.current.drawCircleMetronome(
                timeSignature,
                emphasisPattern,
                customBeatPattern,
                isPlaying,
                currentBeat,
                beatProgress,
                bpm,
                beatTypes,
                getBeatSoundType
            );
            beatPositionsRef.current = newBeatPositions || [];
        }
    };

    // 开始节拍器
    const startMetronome = () => {
        if (!audioCtxRef.current || !normalBufferRef.current || !accentBufferRef.current || !firstBufferRef.current) {
            console.error('音频上下文或音频缓冲区不可用');
            return;
        }

        // 确保AudioContext已恢复
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        // console.log(`开始节拍器 - 拍号: ${timeSignature.beats}/${timeSignature.unit}`);
        // console.log('当前节拍模式:', customBeatPattern.map((t, i) => `${i + 1}: ${t}`).join(', '));

        // 确保节拍模式与当前拍号匹配
        if (customBeatPattern.length !== timeSignature.beats) {
            console.warn(`节拍模式长度(${customBeatPattern.length})与拍号(${timeSignature.beats})不匹配，使用渲染器默认逻辑处理`);
            // 不在这里更新状态，防止React渲染循环，由渲染器处理不匹配情况
        }

        // 设置初始节拍时间（略微提前，以确保有足够时间进行第一次调度）
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;

        // 设置当前节拍为最后一拍（这样第一次播放会从第一拍开始）
        currentBeatRef.current = timeSignature.beats - 1;
        setCurrentBeat(timeSignature.beats - 1);

        // 定义调度器函数
        const scheduler = () => {
            if (!isPlaying) return;

            // 检查AudioContext是否存在
            if (!audioCtxRef.current) return;

            // 计算当前拍的进度
            const progress = calculateBeatProgress(
                isPlaying,
                audioCtxRef.current,
                nextNoteTimeRef.current,
                bpm
            );
            setBeatProgress(progress);

            // 如果当前时间已经超过下一拍的时间，则播放下一拍
            while (audioCtxRef.current.currentTime + 0.1 >= nextNoteTimeRef.current) {
                // 计算下一拍的索引 - 使用ref而不是state
                const nextBeat = (currentBeatRef.current + 1) % timeSignature.beats;

                // 获取当前节拍类型
                const beatType = getBeatSoundType(nextBeat);

                // 根据节拍类型获取对应的音频缓冲区
                let buffer = normalBufferRef.current; // 默认普通拍
                if (beatType === BEAT_MODE.FIRST) {
                    buffer = firstBufferRef.current;
                } else if (beatType === BEAT_MODE.ACCENT) {
                    buffer = accentBufferRef.current;
                }

                // 播放对应类型的音频 - 空拍不播放声音
                if (buffer && beatType !== BEAT_MODE.EMPTY) {
                    playAudio(buffer, nextBeat, beatType);
                }

                // 更新当前拍 - 同时更新ref和state
                currentBeatRef.current = nextBeat;
                setCurrentBeat(nextBeat);

                // 更新下一拍的时间 - 使用最新的BPM值计算
                nextNoteTimeRef.current += 60.0 / bpm;
            }

            // 继续调度
            timerIDRef.current = window.setTimeout(scheduler, 25);
        };

        // 启动调度器
        scheduler();
    };

    // 渲染组件
    return (
        <div className="circleMetronomeContainer">
            <div className="metronomeContent">
                {/* 左侧节拍器画布 */}
                <div className="leftPanel">
                    <canvas
                        ref={canvasRef}
                        className="metronomeCanvas"
                        width="500"
                        height="500"
                    />
                </div>
                {isLoading ? <Spin size="large" tip="音频加载中..." /> :
                    <>
                        {/* 右侧控制面板 */}
                        <div className="rightPanel">
                            {/* 节拍类型选项 - 改为水平布局 */}
                            <div className="metronomeTypeOptions">
                                <div className="sectionTitle" style={{ marginBottom: '4px' }}>节拍类型</div>
                                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
                                    {beatTypes.map((beatType, index) => (
                                        <div key={index} className="beatTypeItem">
                                            <span
                                                className="beatTypeColor"
                                                style={{ backgroundColor: beatType.color }}
                                            ></span>
                                            <span className="beatTypeLabel">{beatType.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 速度控制 */}
                            <div className="controlRow">
                                <div className="sectionTitle">速度 (BPM)</div>
                                <div className="bpmControl">
                                    <button className="bpmButton" onClick={() => handleBpmButtonClick(false)}>-</button>
                                    <input
                                        type="number"
                                        className="bpmInput"
                                        value={bpm}
                                        min="30"
                                        max="300"
                                        onChange={handleBpmChange}
                                    />
                                    <button className="bpmButton" onClick={() => handleBpmButtonClick(true)}>+</button>
                                </div>
                                <input
                                    type="range"
                                    className="slider"
                                    min="30"
                                    max="300"
                                    value={bpm}
                                    onChange={handleBpmChange}
                                />
                            </div>

                            {/* 节拍记号和强拍设置 - 放在一行 */}
                            <div className="controlRowHorizontal">
                                <div className="controlColumn">
                                    <div className="sectionTitle">节拍记号</div>
                                    <div className="controlLabel">
                                        <select
                                            className="timeSignatureInput"
                                            value={`${timeSignature.beats}/${timeSignature.unit}`}
                                            onChange={(e) => {
                                                const [beats, unit] = e.target.value.split('/').map(Number);
                                                // console.log(`拍号选择已更改为：${beats}/${unit}`);
                                                changeTimeSignature({ beats, unit });
                                            }}
                                        >
                                            {timeSignatures.map((sig, i) => (
                                                <option key={i} value={`${sig.beats}/${sig.unit}`}>
                                                    {sig.beats}/{sig.unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="controlColumn">
                                    <div className="sectionTitle">强拍设置</div>
                                    <div className="controlLabel">
                                        <select
                                            className="patternSelect"
                                            value={emphasisPattern}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                // console.log(`强拍设置已更改：${emphasisPattern} -> ${value}`);
                                                setEmphasisPattern(value);
                                            }}
                                        >
                                            {emphasisOptions.map((option, i) => (
                                                <option key={i} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 音量控制 */}
                            <div className="controlRow">
                                <div className="sectionTitle">
                                    音量
                                    <span
                                        className="volumeIcon"
                                        onClick={toggleSound}
                                        title={audioEnabled ? "静音" : "取消静音"}
                                    >
                                        {audioEnabled ? '🔊' : '🔇'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    className="slider"
                                    min="0"
                                    max="100"
                                    value={audioEnabled ? volume : 0}
                                    onChange={handleVolumeChange}
                                />
                            </div>

                            {/* 播放控制 */}
                            <button
                                onClick={togglePlay}
                                className={`playButton ${isPlaying ? 'stopButton' : ''}`}
                            >
                                {isPlaying ? '停止' : '开始'}
                            </button>

                            {/* 提示信息 - 将它放在滚动区域中 */}
                            <div className="instructionsContainer">
                                <div className="instructions">
                                    点击节拍点可以切换音效类型: 普通拍(N) → 强拍(A) → 第一拍(F) → 空拍(-) → 普通拍(N)
                                </div>
                            </div>
                        </div>
                    </>
                }
            </div>
        </div>
    );
};

export default CircleMetronome;