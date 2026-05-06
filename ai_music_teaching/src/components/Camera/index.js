import React, { useEffect, useRef, useState } from 'react';
import { Button, Space, Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

//props说明： closeCamera函数外部传入   openPiano函数外部传入   width height
const CameraRecorder = (props = { width: 240, height: 320 }) => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedBlobs, setRecordedBlobs] = useState([]);
    const mediaRecorderRef = useRef(null);//用来录制并下载视频的
    let mediaStreamRef = useRef(null);

    const [videoStream, setVideoStream] = useState(null);
    const videoRef = useRef(null);

    const cameraListRef = useRef([]);
    const [cameraOptions, setCameraOptions] = useState([]);
    const [currentCamera, setCurrentCamera] = useState(null);

    useEffect(() => {
        cameraListRef.current = [];
        navigator.mediaDevices.enumerateDevices()
            .then((devices) => {
                // console.log('设备清单：', devices);
                const options = [];
                devices.forEach((device) => {
                    if (device.kind === 'videoinput') {
                        // console.log(device.label + '-' + device.deviceId);
                        cameraListRef.current.push(device.deviceId);
                        options.push({
                            value: device.deviceId,
                            label: device.label
                        })
                    }
                });
                if (cameraListRef?.current.length > 0) {
                    setCurrentCamera(cameraListRef?.current[0].value);
                }
                setCameraOptions(options);
                // console.log(cameraListRef, options);
            })
            .catch((err) => {
                console.log(err.name + ": " + err.message);
            });
    }, []);

    //根据当前切换的摄像头名字换摄像头对象
    useEffect(() => {
        const getMediaStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: currentCamera,
                    }
                });
                setVideoStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing the camera:', error);
            }
        };

        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            getMediaStream();
        } else if (!videoStream) {
            getMediaStream();
        }

        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [currentCamera]);

    //默认实例化摄像头对象
    // useEffect(() => {
    //     const getMediaStream = async () => {
    //         try {
    //             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    //             setVideoStream(stream);
    //             if (videoRef.current) {
    //                 videoRef.current.srcObject = stream;
    //             }
    //         } catch (error) {
    //             console.error('Error accessing the camera:', error);
    //         }
    //     };

    //     if (!videoStream) {
    //         getMediaStream();
    //     }

    //     return () => {
    //         if (videoStream) {
    //             videoStream.getTracks().forEach(track => track.stop());
    //         }
    //     };
    // }, [videoStream]);


    useEffect(() => {
        mediaRecorderRef.current = mediaRecorder;
    }, [mediaRecorder]);

    const startRecording = async () => {
        if (recordedBlobs.length > 0) {
            setRecordedBlobs([]);
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: currentCamera,
                },
                audio: true
            });
            mediaStreamRef.current = stream;

            const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
            setMediaRecorder(mr);

            mr.ondataavailable = event => {
                if (event.data && event.data.size > 0) {
                    setRecordedBlobs(blobs => [...blobs, event.data]);

                }
            };

            mr.start();
        } catch (error) {
            console.error('Error accessing camera or microphone:', error);
        }
    };

    useEffect(() => {
        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
        };
    }, [videoStream, mediaStreamRef.current, mediaRecorder]);


    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
    };

    // 使用录制的视频文件（例如下载或上传）
    const handleDownload = () => {
        const blob = new Blob(recordedBlobs, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'camera_recording.webm';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ position: 'relative', width: props.width, height: props.height, background: 'black' }}>
            <video width={props.width} height={props.height} ref={videoRef} autoPlay playsInline />
            <div style={{ position: 'absolute', top: '.1rem', right: '.2rem' }}>
                <span>摄像头列表：</span>
                <Select
                    style={{ minWidth: '3rem' }}
                    defaultValue={currentCamera}
                    value={currentCamera}
                    options={cameraOptions}
                    onChange={(value) => {
                        setCurrentCamera(value);
                    }}
                />
                <Button shape='round' onClick={startRecording}>录制视频</Button>
                <Button shape='round' onClick={stopRecording}>结束录制</Button>
                <Button shape='round' onClick={handleDownload} disabled={recordedBlobs.length === 0}>
                    下载已录制视频
                </Button>
                <Button shape='round' type='primary'
                    onClick={() => {
                        if (props?.openPiano) {
                            props.openPiano();
                        }
                    }}
                >打开键盘</Button>
                <Button type='primary' danger icon={<CloseCircleOutlined />}
                    onClick={() => {

                        if (props?.closeCamera) {
                            props.closeCamera();
                        }

                    }}
                >关闭摄像头</Button>
            </div>
        </div>
    );
};

export default CameraRecorder;