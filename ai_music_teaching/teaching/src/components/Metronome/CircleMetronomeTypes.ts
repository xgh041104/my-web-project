// 节拍类型和颜色定义
export const beatTypes = [
    { id: 'normal', label: '普通拍', color: '#1890ff', textColor: '#ffffff' }, // 蓝色
    { id: 'accent', label: '强拍', color: '#faad14', textColor: '#ffffff' },   // 黄色
    { id: 'first', label: '第一拍', color: '#00b96b', textColor: '#ffffff' },  // 绿色
    { id: 'empty', label: '空拍', color: '#888888', textColor: '#ffffff' },    // 灰色
];

// 添加拍子模式定义
export const BEAT_MODE = {
    NORMAL: 'normal',
    ACCENT: 'accent',
    FIRST: 'first',
    EMPTY: 'empty'
};

// 节拍类型选项
export const timeSignatures = [
    { beats: 1, unit: 4 },
    { beats: 2, unit: 4 }, 
    { beats: 3, unit: 4 },
    { beats: 4, unit: 4 }, 
    { beats: 5, unit: 4 },
    { beats: 6, unit: 8 },
    { beats: 7, unit: 8 },
    { beats: 9, unit: 8 },
    { beats: 12, unit: 8 }
];

// 强拍配置选项（beats per bar）
export const emphasisOptions = [
    { value: 0, label: '无强拍' },
    { value: 2, label: '每2拍' }, 
    { value: 3, label: '每3拍' }, 
    { value: 4, label: '每4拍' }
];

// 定义接口
export interface TimeSignature {
    beats: number;
    unit: number;
}

export interface BeatPosition {
    x: number;
    y: number;
    angle: number;
    index: number;
    radius: number;
} 