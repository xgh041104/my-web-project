import { BeatPosition, BEAT_MODE } from './CircleMetronomeTypes';

// 处理Canvas点击事件
export const handleCanvasClick = (
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    beatPositions: BeatPosition[],
    isPlaying: boolean,
    customBeatPattern: string[],
    updateBeatType: (index: number, type: string) => void
) => {
    // 播放中不能编辑
    if (isPlaying) return;

    if (!canvas) return;

    // 获取点击坐标（相对于canvas）
    const rect = canvas.getBoundingClientRect();

    // 应用缩放比例得到canvas上的实际坐标
    const x = (e.clientX - rect.left)
    const y = (e.clientY - rect.top)

    // 检查是否点击了节拍点
    const clickedPoint = beatPositions.find(point => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        return distance <= point.radius;
    });

    if (clickedPoint) {
        const index = clickedPoint.index;

        // 循环切换音效类型：normal -> accent -> first -> empty -> normal
        const currentType = customBeatPattern[index];
        let nextType;

        if (currentType === BEAT_MODE.NORMAL) {
            nextType = BEAT_MODE.ACCENT;
        } else if (currentType === BEAT_MODE.ACCENT) {
            nextType = BEAT_MODE.FIRST;
        } else if (currentType === BEAT_MODE.FIRST) {
            nextType = BEAT_MODE.EMPTY;
        } else {
            nextType = BEAT_MODE.NORMAL;
        }
        // 更新节拍类型
        updateBeatType(index, nextType);
    }
};

// 处理Canvas鼠标移动事件
export const handleCanvasMouseMove = (
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    beatPositions: BeatPosition[],
    isPlaying: boolean
) => {
    // 播放中不显示手指样式
    if (isPlaying) {
        if (canvas) {
            canvas.style.cursor = 'default';
        }
        return;
    }

    if (!canvas) return;

    // 获取鼠标坐标（相对于canvas）
    const rect = canvas.getBoundingClientRect();

    // 应用缩放比例得到canvas上的实际坐标
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    // 检查是否悬停在节拍点上
    const hoverPoint = beatPositions.find(point => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        return distance <= point.radius;
    });

    // 设置鼠标样式
    if (hoverPoint) {
        canvas.style.cursor = 'pointer'; // 手指样式
    } else {
        canvas.style.cursor = 'default'; // 默认样式
    }
}; 