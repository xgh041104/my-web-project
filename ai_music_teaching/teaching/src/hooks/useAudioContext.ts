// src/hooks/useAudioContext.ts
import { useCallback } from 'react';
import { initAudioContext, loadClickBuffers } from '@/utils/audioManager';
import { baseUrl } from 'config';

/**
 * Hook 用于管理音频上下文的初始化与音效加载
 */

const urls = [
    '/audio/metronome/click_new.mp3',
    '/audio/metronome/click_new_accent.mp3',
    '/audio/metronome/click_new_first.mp3'
].map(url => baseUrl + url);

export function useAudioContext(
    audioCtxRef: React.MutableRefObject<AudioContext | null>,
    normalBufferRef: React.MutableRefObject<AudioBuffer | null>,
    accentBufferRef: React.MutableRefObject<AudioBuffer | null>,
    firstBufferRef: React.MutableRefObject<AudioBuffer | null>
) {
    const safelyInitAudioContext = useCallback(async () => {
        try {
            // 1. 尝试获取或创建AudioContext
            if ((window as any)._multiCircleAudioContext && (window as any)._multiCircleAudioContext.state !== 'closed') {
                //console.log('使用现有音频上下文');
                audioCtxRef.current = (window as any)._multiCircleAudioContext;
                if (audioCtxRef.current.state === 'suspended') {
                    await audioCtxRef.current.resume();
                    //console.log('已恢复现有音频上下文');
                }
            } else if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                //console.log('继续使用当前音频上下文');
                if (audioCtxRef.current.state === 'suspended') {
                    await audioCtxRef.current.resume();
                    //console.log('已恢复当前音频上下文');
                }
            } else {
                //console.log('创建新的音频上下文');
                const ctx = initAudioContext();
                if (!ctx) throw new Error('AudioContext 创建失败');
                audioCtxRef.current = ctx;
                (window as any)._multiCircleAudioContext = ctx;
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                    //console.log('已恢复新创建的音频上下文');
                }
            }

            // 2. 检查现有音频缓冲区，如果已加载则无需重新加载
            if (normalBufferRef.current && accentBufferRef.current && firstBufferRef.current) {
                //console.log('音频缓冲区已存在，无需重新加载');
                return audioCtxRef.current;
            }

            // 3. 使用固定路径加载三个节拍器音效并添加重试机制
            const maxRetries = 3;

            let buffers = null;
            let retryCount = 0;

            while (!buffers && retryCount < maxRetries) {
                try {
                    //console.log(`尝试加载音频文件 (尝试 ${retryCount + 1}/${maxRetries})...`);
                    buffers = await loadClickBuffers(urls, audioCtxRef.current);

                    if (!buffers) {
                        throw new Error('加载返回空缓冲区');
                    }
                } catch (error) {
                    console.warn(`加载音频文件失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                    retryCount++;

                    if (retryCount >= maxRetries) {
                        console.error('达到最大重试次数，无法加载音频');
                        throw error;
                    }

                    // 等待一段时间再重试
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (buffers) {
                //console.log('成功加载音频缓冲区');
                normalBufferRef.current = buffers[0];
                accentBufferRef.current = buffers[1];
                firstBufferRef.current = buffers[2];
                return audioCtxRef.current;
            } else {
                throw new Error('无法加载音频缓冲区');
            }
        } catch (err) {
            console.error('初始化音频上下文失败：', err);
            return null;
        }
    }, [audioCtxRef, normalBufferRef, accentBufferRef, firstBufferRef]);

    const isAudioReady = useCallback(() => {
        // 只检查音频缓冲区是否存在，不再检查AudioContext状态
        const buffersReady = normalBufferRef.current && accentBufferRef.current && firstBufferRef.current;


        return buffersReady;
    }, [audioCtxRef, normalBufferRef, accentBufferRef, firstBufferRef]);

    const reloadSounds = useCallback(async () => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx || ctx.state === 'closed') {
                console.error('无法重载音频：AudioContext不可用');
                return false;
            }

            if (ctx.state === 'suspended') {
                try {
                    await ctx.resume();
                    //console.log('已恢复音频上下文以重新加载声音');
                } catch (error) {
                    console.error('恢复音频上下文失败:', error);
                    return false;
                }
            }

            // 添加重试机制
            const maxRetries = 3;
            let buffers = null;
            let retryCount = 0;

            while (!buffers && retryCount < maxRetries) {
                try {
                    //console.log(`尝试重新加载音频文件 (尝试 ${retryCount + 1}/${maxRetries})...`);
                    buffers = await loadClickBuffers(urls, ctx);

                    if (!buffers) {
                        throw new Error('重新加载返回空缓冲区');
                    }
                } catch (error) {
                    console.warn(`重新加载音频文件失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                    retryCount++;

                    if (retryCount >= maxRetries) {
                        console.error('达到最大重试次数，无法重新加载音频');
                        return false;
                    }

                    // 等待一段时间再重试
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (buffers) {
                //console.log('成功重新加载音频缓冲区');
                normalBufferRef.current = buffers[0];
                accentBufferRef.current = buffers[1];
                firstBufferRef.current = buffers[2];
                return true;
            } else {
                console.error('无法重新加载音频缓冲区');
                return false;
            }
        } catch (err) {
            console.error('重新加载音效失败：', err);
            return false;
        }
    }, [audioCtxRef, normalBufferRef, accentBufferRef, firstBufferRef]);

    return {
        safelyInitAudioContext,
        isAudioReady,
        reloadSounds
    };
}