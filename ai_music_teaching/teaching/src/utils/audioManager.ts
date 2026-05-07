// src/utils/audioManager.ts
/**
 * 初始化音频上下文
 * 如果浏览器支持 AudioContext，使用标准 AudioContext；否则，使用兼容的 webkitAudioContext（旧版浏览器支持）。
 * @returns AudioContext | null - 返回一个有效的 AudioContext 实例或 null（如果无法初始化音频上下文）。
 */
export function initAudioContext(): AudioContext | null {
    let audioCtx: AudioContext | null = null;

    try {
        // 首先检查是否已经有全局AudioContext可用
        if ((window as any)._multiCircleAudioContext && 
            (window as any)._multiCircleAudioContext.state !== 'closed') {
            return (window as any)._multiCircleAudioContext;
        }

        if (window.AudioContext) {
            audioCtx = new AudioContext();  // 标准浏览器
            //console.log('使用标准AudioContext创建音频上下文');
        } else if ((window as any).webkitAudioContext) {
            // 兼容旧版浏览器
            audioCtx = new (window as any).webkitAudioContext();
            //console.log('使用webkitAudioContext创建音频上下文');
        } else {
            console.error('当前浏览器不支持Web Audio API');
            return null;
        }

        // 创建成功，保存为全局引用
        (window as any)._multiCircleAudioContext = audioCtx;

        if (audioCtx && audioCtx.state === 'suspended') {
            // 如果音频上下文被挂起，尝试恢复它
            //console.log('AudioContext处于suspended状态，尝试恢复');
            resumeAudioContext(audioCtx);
        }

    } catch (err) {
        console.error('初始化AudioContext失败:', err);
        return null;
    }

    return audioCtx;
}

/**
 * 恢复音频上下文
 * 如果音频上下文处于挂起状态，则恢复音频上下文。
 * @param audioCtx - 要恢复的 AudioContext 实例。
 */
export function resumeAudioContext(audioCtx: AudioContext): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            if (audioCtx.state === 'suspended') {
                //console.log('尝试恢复音频上下文...');
                audioCtx.resume()
                    .then(() => {
                        //console.log('音频上下文恢复成功, 当前状态:', audioCtx.state);
                        resolve();
                    })
                    .catch((error) => {
                        console.error('音频上下文恢复失败:', error);
                        reject(error);
                    });
            } else {
                // 如果已经是running状态，直接resolve
                //console.log('音频上下文已处于活跃状态, 当前状态:', audioCtx.state);
                resolve();
            }
        } catch (error) {
            console.error('恢复音频上下文时出错:', error);
            reject(error);
        }
    });
}

/**
 * 加载音频文件
 * 从指定的 URL 加载音频文件，并解码为 AudioBuffer 实例。
 * @param url - 音频文件的 URL。
 * @param audioCtx - AudioContext 实例，用于解码音频数据。
 * @returns Promise<AudioBuffer | null> - 返回解码后的音频缓冲区（AudioBuffer）或失败时返回 null。
 */
export async function loadSound(url: string, audioCtx: AudioContext): Promise<AudioBuffer | null> {
    //console.log(`开始加载音频文件: ${url}`);
    
    try {
        // 先检查AudioContext状态
        if (audioCtx.state === 'suspended') {
            //console.log('AudioContext处于suspended状态，尝试在加载音频前恢复');
            await resumeAudioContext(audioCtx);
        }
        
        // 添加时间戳参数避免缓存问题
        const fullUrl = `${url}?t=${Date.now()}`;
        //console.log(`正在请求音频文件: ${fullUrl}`);
        
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`HTTP错误，状态码: ${response.status}`);
        }

        //console.log(`成功获取音频文件，开始解码...`);
        const arrayBuffer = await response.arrayBuffer();
        
        try {
            //console.log(`开始解码音频数据，大小: ${arrayBuffer.byteLength}字节`);
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            //console.log(`成功解码音频文件: ${url}, 时长: ${audioBuffer.duration.toFixed(2)}秒`);
            return audioBuffer;
        } catch (decodeError) {
            console.error(`解码音频数据失败: ${url}`, decodeError);
            throw new Error(`解码音频失败: ${decodeError.message}`);
        }
    } catch (error) {
        console.error(`加载或解码音频文件失败: ${url}`, error);
        // 不在这里弹出alert，让调用者决定如何处理错误
        return null;
    }
}

/**
 * 加载多个点击音效文件
 * 用于批量加载点击音效，如普通点击、重音点击、首次点击等。
 * @param urls - 音频文件的 URL 数组。
 * @param audioCtx - AudioContext 实例，用于解码音频数据。
 * @returns Promise<AudioBuffer[] | null> - 返回解码后的音频缓冲区数组，失败时返回 null。
 */
export async function loadClickBuffers(urls: string[], audioCtx: AudioContext): Promise<AudioBuffer[] | null> {
    //console.log(`开始加载多个音频文件, 数量: ${urls.length}`);
    
    try {
        const clickBuffers: AudioBuffer[] = [];
        
        // 使用Promise.all并行加载所有音频文件
        const bufferPromises = urls.map(url => loadSound(url, audioCtx));
        const buffers = await Promise.all(bufferPromises);
        
        // 检查是否所有文件都加载成功
        const failedUrls: string[] = [];
        
        buffers.forEach((buffer, index) => {
            if (buffer) {
                clickBuffers.push(buffer);
            } else {
                failedUrls.push(urls[index]);
            }
        });
        
        if (failedUrls.length > 0) {
            console.error(`以下音频文件加载失败: ${failedUrls.join(', ')}`);
            return null;
        }
        
        //console.log(`成功加载所有音频文件, 数量: ${clickBuffers.length}`);
        return clickBuffers;
    } catch (error) {
        console.error('加载点击音效文件失败:', error);
        return null;
    }
}

/**
 * 播放音频
 * 根据提供的音频缓冲区和参数播放音频。
 * @param audioCtx - AudioContext 实例，用于播放音频。
 * @param audioBuffer - 要播放的音频缓冲区。
 * @param loop - 是否循环播放音频，默认为 false。
 * @param volume - 音量大小，默认为 1（最大音量）。
 * @returns AudioBufferSourceNode - 返回音频源节点，允许进一步控制。
 */
export function playAudio(audioCtx: AudioContext, audioBuffer: AudioBuffer, loop: boolean = false, volume: number = 1): AudioBufferSourceNode {
    // 确保AudioContext活跃
    if (audioCtx.state === 'suspended') {
        //console.log('尝试在播放前恢复AudioContext');
        audioCtx.resume();
    }
    
    const source = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();

    source.buffer = audioBuffer;
    source.loop = loop;

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 添加错误处理
    try {
        source.start(0);
        //console.log(`开始播放音频, 时长: ${audioBuffer.duration.toFixed(2)}秒, 音量: ${volume}`);
    } catch (error) {
        console.error('播放音频失败:', error);
    }

    return source;
}



