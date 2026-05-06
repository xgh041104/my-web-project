import { BeatPosition, BEAT_MODE } from './CircleMetronomeTypes';

// 获取节拍点颜色
export const getNodeColor = (
    beatIndex: number,
    isActive: boolean,
    getBeatSoundType: (beatIndex: number) => string,
    beatTypes: any[]
) => {
    // 先获取这个节拍的音效类型
    const beatSoundType = getBeatSoundType(beatIndex);

    // 从beatTypes中获取对应类型的颜色
    const beatType = beatTypes.find(type => type.id === beatSoundType);
    if (!beatType) {
        return isActive ? '#1890ff' : 'rgba(24, 144, 255, 0.5)'; // 默认颜色
    }

    // 根据是否激活返回对应的颜色
    const color = beatType.color;
    if (isActive) {
        return color;
    } else {
        // 创建颜色的半透明版本
        return convertToRgba(color, 0.5);
    }
};

// 辅助函数：将十六进制颜色转换为rgba格式
const convertToRgba = (hexColor: string, alpha: number): string => {
    // 解析十六进制颜色
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 返回rgba格式
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 创建节拍位置数组
export const createBeatPositions = (
    beatCount: number,
    centerX: number,
    centerY: number,
    radius: number
): { positions: any[], ref: BeatPosition[] } => {
    const beatPositions = [];

    // 对于4拍，使用菱形布局（正方形）
    if (beatCount === 4) {
        // 根据图片计算菱形的垂直和水平距离比例
        const distanceX = radius * 0.95; // 水平距离稍大
        const distanceY = radius * 0.85; // 垂直距离稍小，形成符合图片的椭圆菱形

        // 菱形顶点 - 顺时针排列，从顶部开始
        const positions = [
            { x: centerX, y: centerY - distanceY },  // 顶部 (1)
            { x: centerX + distanceX, y: centerY },  // 右侧 (2)
            { x: centerX, y: centerY + distanceY },  // 底部 (3)
            { x: centerX - distanceX, y: centerY }   // 左侧 (4)
        ];

        // 添加角度信息
        beatPositions.push(
            { ...positions[0], angle: -Math.PI / 2 },
            { ...positions[1], angle: 0 },
            { ...positions[2], angle: Math.PI / 2 },
            { ...positions[3], angle: Math.PI }
        );
    } else {
        // 对于其他数量的节拍点，使用普通的圆形布局
        for (let i = 0; i < beatCount; i++) {
            // 角度从顶部开始，顺时针旋转
            const angle = (i * 2 * Math.PI / beatCount) - Math.PI / 2;
            const x = centerX + Math.cos(angle) * (radius * 0.7);
            const y = centerY + Math.sin(angle) * (radius * 0.7);
            beatPositions.push({ x, y, angle });
        }
    }

    // 存储节拍点位置，用于点击检测
    const beatPositionsRef = beatPositions.map((pos, index) => ({
        ...pos,
        index,
        radius: radius * 0.18 // 增大点击区域
    }));

    return { positions: beatPositions, ref: beatPositionsRef };
};

// 计算动画进度
export const calculateBeatProgress = (
    isPlaying: boolean,
    audioCtx: AudioContext | null,
    nextNoteTime: number,
    bpm: number
): number => {
    let beatProgress = 0;
    if (isPlaying && audioCtx) {
        const currentTime = audioCtx.currentTime;
        const secondsPerBeat = 60.0 / bpm;

        // 计算当前拍与下一拍之间的进度
        if (nextNoteTime > currentTime) {
            // 当前时间和前一拍时间的差值
            const previousBeatTime = nextNoteTime - secondsPerBeat;
            const timeSinceLastBeat = currentTime - previousBeatTime;

            // 计算进度比例
            beatProgress = timeSinceLastBeat / secondsPerBeat;

            // 确保在0-1范围内，处理可能的浮点数精度问题
            beatProgress = Math.min(1, Math.max(0, beatProgress));

            // 平滑处理极端值避免视觉抖动
            if (beatProgress > 0.97) beatProgress = 1;
            if (beatProgress < 0.03) beatProgress = 0;
        } else {
            // 如果下一拍时间已过，但还没有更新，返回接近1的值
            beatProgress = 0.99;
        }
    }
    return beatProgress;
}; 