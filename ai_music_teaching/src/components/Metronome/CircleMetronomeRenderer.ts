import { getNodeColor, createBeatPositions, calculateBeatProgress } from './CircleMetronomeCanvasUtils';
import { TimeSignature, BEAT_MODE } from './CircleMetronomeTypes';

export class CircleMetronomeRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private pixelRatio: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
            throw new Error('无法获取Canvas上下文');
        }
        this.ctx = ctx;

        // 获取设备像素比
        this.pixelRatio = window.devicePixelRatio || 1;

        // 设置canvas的像素比，确保在高DPI屏幕上渲染清晰
        this.setupHighDPICanvas();
    }

    // 配置高DPI Canvas
    private setupHighDPICanvas() {
        const { width, height } = this.canvas;

        // 设置显示尺寸
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // 设置实际尺寸，考虑像素比
        this.canvas.width = Math.floor(width * this.pixelRatio);
        this.canvas.height = Math.floor(height * this.pixelRatio);

        // 缩放上下文以适应像素比
        this.ctx.scale(this.pixelRatio, this.pixelRatio);

        // 使用更好的图像平滑设置
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    // 调整Canvas大小
    resizeCanvas(width: number, height: number) {
        // 确保宽高为整数
        width = Math.floor(width);
        height = Math.floor(height);
        
        // 更新canvas样式尺寸
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // 更新实际尺寸，考虑像素比
        this.canvas.width = Math.floor(width * this.pixelRatio);
        this.canvas.height = Math.floor(height * this.pixelRatio);
        
        // 重新缩放上下文
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
        // 重新应用平滑设置
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }


    // 绘制圆形节拍器
    drawCircleMetronome(
        timeSignature: TimeSignature,
        emphasisPattern: number,
        customBeatPattern: string[],
        isPlaying: boolean,
        currentBeat: number,
        beatProgress: number,
        bpm: number,
        beatTypes: any[],
        getBeatSoundType: (beatIndex: number) => string
    ) {
        try {

            // 检查并修复节拍模式长度与拍号不匹配的问题
            const actualPattern = customBeatPattern.length === timeSignature.beats ?
                customBeatPattern :
                Array(timeSignature.beats).fill(null).map((_, i) =>
                    i === 0 ? 'first' : 'normal'
                );

            // 获取当前画布尺寸（除以像素比以获取CSS像素尺寸）
            const width = parseInt(this.canvas.style.width || (this.canvas.width / this.pixelRatio).toString());
            const height = parseInt(this.canvas.style.height || (this.canvas.height / this.pixelRatio).toString());
            const centerX = width / 2;
            const centerY = height / 2;

            // 计算合适的半径，确保在任何尺寸下都有合适的边距
            const radius = Math.min(width, height) * 0.4;

            // 清除画布
            this.ctx.clearRect(0, 0, width, height);

            // 设置背景 - 纯黑色背景
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, width, height);

            // 优化渲染设置
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';

            // 使用更平滑的线条
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // 绘制外环 - 使用精确的圆形而非椭圆
            this.drawOuterCircle(centerX, centerY, radius * 1.2);

            // 创建节拍点位置 - 始终使用timeSignature.beats
            const beatCount = timeSignature.beats;

            // 确保节拍数正确，并记录日志便于调试
            if (beatCount !== actualPattern.length) {
                console.warn(`[停止=${!isPlaying}] 警告：节拍模式长度(${customBeatPattern.length})不匹配，使用临时生成的节拍模式(${actualPattern.length})`);
            }

            // 始终使用当前拍号的节拍点位置，而不是自定义节拍模式的长度
            const { positions: beatPositions, ref: beatPositionsRef } =
                createBeatPositions(beatCount, centerX, centerY, radius);

            // 绘制节拍点间连线
            this.drawBeatLines(beatPositions);

            // 绘制所有节拍点 - 使用actualPattern确保节拍数匹配
            this.drawBeatNodes(
                beatPositions,
                currentBeat,
                beatCount,
                radius,
                isPlaying,
                beatProgress,
                (index) => index < actualPattern.length ? actualPattern[index] : 'normal',
                beatTypes
            );

            // 绘制中央显示
            this.drawCenterDisplay(centerX, centerY, radius, bpm, timeSignature);

            // 返回节拍点位置引用（用于点击检测）
            return beatPositionsRef;
        } catch (error) {
            console.error('绘制节拍器时发生错误:', error);
            return [];
        }
    }

    private drawOuterCircle(centerX: number, centerY: number, radius: number) {
        // 绘制完美圆形外环，使用整数坐标以增加锐度
        const x = Math.floor(centerX);
        const y = Math.floor(centerY);
        const r = Math.floor(radius);

        // 使用多层绘制增强视觉效果

        // 首先绘制一个较宽的暗色边框
        this.ctx.beginPath();
        this.ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // 然后绘制主要边框
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(180, 180, 180, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 最后绘制内部高光边框
        this.ctx.beginPath();
        this.ctx.arc(x, y, r - 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    private drawBeatLines(beatPositions: any[]) {
        if (beatPositions.length === 0) {
            return;
        }

        // 使用多层线条使连接线更清晰可见

        // 首先绘制较宽的暗色底线
        this.ctx.beginPath();
        for (let i = 0; i < beatPositions.length; i++) {
            const { x, y } = beatPositions[i];
            if (i === 0) {
                this.ctx.moveTo(Math.floor(x), Math.floor(y));
            } else {
                this.ctx.lineTo(Math.floor(x), Math.floor(y));
            }
        }
        // 闭合路径
        if (beatPositions.length > 0) {
            this.ctx.lineTo(Math.floor(beatPositions[0].x), Math.floor(beatPositions[0].y));
        }
        this.ctx.strokeStyle = 'rgba(80, 80, 80, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 然后绘制清晰的主线
        this.ctx.beginPath();
        for (let i = 0; i < beatPositions.length; i++) {
            const { x, y } = beatPositions[i];
            if (i === 0) {
                this.ctx.moveTo(Math.floor(x), Math.floor(y));
            } else {
                this.ctx.lineTo(Math.floor(x), Math.floor(y));
            }
        }
        // 闭合路径
        if (beatPositions.length > 0) {
            this.ctx.lineTo(Math.floor(beatPositions[0].x), Math.floor(beatPositions[0].y));
        }
        this.ctx.strokeStyle = 'rgba(170, 170, 170, 0.7)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
    }

    private drawBeatNodes(
        beatPositions: any[],
        currentBeat: number,
        beatCount: number,
        radius: number,
        isPlaying: boolean,
        beatProgress: number,
        getBeatSoundType: (beatIndex: number) => string,
        beatTypes: any[]
    ) {
        if (beatPositions.length === 0) {
            return;
        }

        // 获取beatTypes中的颜色映射
        const colorMap = {
            [BEAT_MODE.NORMAL]: this.findBeatTypeColor(beatTypes, BEAT_MODE.NORMAL),
            [BEAT_MODE.ACCENT]: this.findBeatTypeColor(beatTypes, BEAT_MODE.ACCENT),
            [BEAT_MODE.FIRST]: this.findBeatTypeColor(beatTypes, BEAT_MODE.FIRST),
            [BEAT_MODE.EMPTY]: this.findBeatTypeColor(beatTypes, BEAT_MODE.EMPTY)
        };

        // 绘制节拍点
        for (let i = 0; i < beatPositions.length; i++) {
            const { x, y } = beatPositions[i];
            // 使用整数坐标以确保清晰
            const nodeX = Math.floor(x);
            const nodeY = Math.floor(y);

            // 是否为当前节拍 (确保currentBeat在有效范围内)
            const isCurrentBeat = (currentBeat >= 0 && currentBeat < beatCount) ? (i === currentBeat) : false;

            // 获取当前节拍的音效类型
            const beatSoundType = getBeatSoundType(i);

            // 节拍点尺寸 - 当前节拍时略大
            const nodeSize = isCurrentBeat && isPlaying ? Math.floor(radius * 0.17) : Math.floor(radius * 0.15);

            // 节拍点颜色 - 始终使用beatTypes中的原色，但亮度不同
            const beatColor = colorMap[beatSoundType] || colorMap[BEAT_MODE.NORMAL]; // 使用普通拍颜色作为后备

            // 重置阴影
            this.ctx.shadowBlur = 0;

            // 先绘制一个底圈增强视觉效果
            this.ctx.beginPath();
            this.ctx.arc(nodeX, nodeY, nodeSize + 2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
            this.ctx.fill();

            // 发光效果（仅当前节拍）
            if (isCurrentBeat && isPlaying) {
                // 添加发光效果
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = beatColor;

                // 发光外圈
                this.ctx.beginPath();
                this.ctx.arc(nodeX, nodeY, nodeSize + 4, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${this.hexToRgb(beatColor)}, 0.3)`;
                this.ctx.fill();
            }

            // 绘制主要节拍点
            this.ctx.beginPath();
            this.ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);

            // 使用来自beatTypes的颜色，但根据状态调整亮度
            if (isCurrentBeat && isPlaying) {
                // 当前播放的节拍点使用更亮的颜色
                this.ctx.fillStyle = this.createBrighterVersionOfColor(beatColor, 1.2);
            } else {
                // 非播放状态使用原色，但稍暗
                this.ctx.fillStyle = this.createDarkerVersionOfColor(beatColor, 0.7);
            }

            this.ctx.fill();

            // 添加边缘高光效果增强清晰度
            this.ctx.beginPath();
            this.ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // 重置阴影以确保文字不受阴影影响
            this.ctx.shadowBlur = 0;

            // 添加节拍数字标签
            const fontSize = Math.floor(radius * 0.11);
            this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((i + 1).toString(), nodeX, nodeY - Math.floor(radius * 0.02));

            // 添加音效类型标记
            let typeLabel;
            if (beatSoundType === BEAT_MODE.FIRST) {
                typeLabel = 'F';
            } else if (beatSoundType === BEAT_MODE.ACCENT) {
                typeLabel = 'A';
            } else if (beatSoundType === BEAT_MODE.EMPTY) {
                typeLabel = '-';
            } else {
                typeLabel = 'N';
            }

            this.ctx.font = `${Math.floor(radius * 0.06)}px Arial, sans-serif`;
            this.ctx.fillStyle = '#dddddd';
            this.ctx.fillText(typeLabel, nodeX, nodeY + Math.floor(radius * 0.08));
        }
    }

    private drawCenterDisplay(centerX: number, centerY: number, radius: number, bpm: number, timeSignature: TimeSignature) {
        // 确保使用整数坐标以增加清晰度
        const x = Math.floor(centerX);
        const y = Math.floor(centerY);
        const r = Math.floor(radius * 0.45);

        this.ctx.shadowBlur = 0;

        // 中央圆形背景 - 多层绘制增强视觉效果

        // 绘制外边缘阴影
        this.ctx.beginPath();
        this.ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(10, 10, 10, 1)';
        this.ctx.fill();

        // 主要黑色背景
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fill();

        // 添加边框使圆形更加清晰
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(180, 180, 180, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // 内圈微妙高光
        this.ctx.beginPath();
        this.ctx.arc(x, y, r - 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // BPM数值 - 更大字体，使用文字阴影增强可读性
        const bpmFontSize = Math.floor(radius * 0.35);
        this.ctx.font = `bold ${bpmFontSize}px Arial, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 添加文字阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(bpm.toString(), x, y - Math.floor(radius * 0.05));

        // 重置阴影
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // BPM标签
        this.ctx.font = `${Math.floor(radius * 0.08)}px Arial, sans-serif`;
        this.ctx.fillStyle = '#b0b0b0';
        this.ctx.fillText('BPM', x, y + Math.floor(radius * 0.15));

        // 节拍记号
        this.ctx.font = `bold ${Math.floor(radius * 0.1)}px Arial, sans-serif`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`${timeSignature.beats}/${timeSignature.unit}`, x, y + Math.floor(radius * 0.3));
    }

    // 辅助方法：从beatTypes中查找颜色
    private findBeatTypeColor(beatTypes: any[], typeId: string): string {
        const beatType = beatTypes.find(type => type.id === typeId);
        return beatType ? beatType.color : '#1890ff'; // 默认颜色
    }

    // 辅助方法：创建颜色的暗色版本
    private createDarkVersionOfColor(color: string): string {
        return this.createDarkerVersionOfColor(color, 0.3);
    }

    // 辅助方法：创建更暗的颜色版本，使用指定的因子
    private createDarkerVersionOfColor(color: string, factor: number): string {
        // 解析十六进制颜色
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // 降低亮度，创建暗色版本
        const darkR = Math.floor(r * factor);
        const darkG = Math.floor(g * factor);
        const darkB = Math.floor(b * factor);

        return `rgb(${darkR}, ${darkG}, ${darkB})`;
    }

    // 辅助方法：创建更亮的颜色版本
    private createBrighterVersionOfColor(color: string, factor: number): string {
        // 解析十六进制颜色
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // 增加亮度，创建更亮版本
        const brightR = Math.min(255, Math.floor(r * factor));
        const brightG = Math.min(255, Math.floor(g * factor));
        const brightB = Math.min(255, Math.floor(b * factor));

        return `rgb(${brightR}, ${brightG}, ${brightB})`;
    }

    // 辅助方法：将十六进制颜色转换为RGB值字符串
    private hexToRgb(hex: string): string {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }
} 