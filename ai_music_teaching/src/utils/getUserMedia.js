const getUserMedia = async (sourceId) => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                }
            },
            audio: false  // 如果需要音频，可以设置为 true
        });

        return stream

    } catch (error) {
        console.error('Error accessing the screen:', error);
    }
};

export { getUserMedia }