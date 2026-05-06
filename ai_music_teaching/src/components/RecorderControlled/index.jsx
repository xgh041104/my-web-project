import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Input, notification, message, Select, Form } from 'antd';
import { useSelector, useDispatch, history, connect } from 'umi';
import './index.less';

const RecorderControlled = ({
  dispatch,
  closeRecorderControlled,
  isBookTeach,
  showInputModal = true,
  courseInfo,
  videoList,
}) => {
  const [stage, setStage] = useState('inputting');
  const [textInput, setTextInput] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(showInputModal);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const screenChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const from = Form.useForm();
  const [bookList, setBookList] = useState([]);
  const [bookId, setBookId] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  const { courseId, courseTitle } = courseInfo || {};
  const [choose, setChoose] = useState(false);
  // message.success(courseId, courseTitle)

  // console.log("tessss",courseId, courseTitle);

  // 将webm转换为mp4的函数
  const convertWebmToMp4 = async (webmBlob) => {
    return new Promise((resolve) => {
      // 由于浏览器限制，我们直接保存为webm格式
      // 实际的mp4转换需要服务器端处理或使用FFmpeg.js
      resolve(webmBlob);
    });
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputConfirm();
    }
  }

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理音频流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // 清理屏幕流
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      // 清理音频上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      // 停止录制器
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (screenRecorderRef.current && screenRecorderRef.current.state === 'recording') {
        screenRecorderRef.current.stop();
      }
    };
  }, []);


  const handleInputConfirm = async () => {

    dispatch({
      type: 'global/setInSession',
      payload: true,
    });

    setInputModalVisible(false);
    try {
      // 获取音频流
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = audioRecorder;
      streamRef.current = audioStream;
      audioChunksRef.current = [];

      // 获取屏幕录制流（全屏）
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 2
        }
      });

      // 创建音频上下文来混合音频
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      // 处理麦克风音频
      const micSource = audioContext.createMediaStreamSource(audioStream);
      micSource.connect(destination);

      // 处理系统音频（如果存在）
      if (screenStream.getAudioTracks().length > 0) {
        const systemSource = audioContext.createMediaStreamSource(new MediaStream(screenStream.getAudioTracks()));
        systemSource.connect(destination);
      }

      // 合并音频和视频流
      const combinedStream = new MediaStream();

      // 添加屏幕视频轨道
      screenStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // 添加混合后的音频轨道
      destination.stream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      const screenRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      screenRecorderRef.current = screenRecorder;
      screenStreamRef.current = screenStream;
      screenChunksRef.current = [];

      // 监听屏幕共享结束事件
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        message.warning('屏幕共享已结束，将自动停止录制');
        stopRecording();
      });

      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      screenRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          screenChunksRef.current.push(event.data);
        }
      };

      // 开始录制
      audioRecorder.start();
      screenRecorder.start();
      setStage('recording');
    } catch (err) {
      console.error('录制权限获取失败:', err);
      message.error('获取录制权限失败，请确保允许麦克风和屏幕录制权限');

      // ✅ 恢复状态，让按钮重新出现
      dispatch({
        type: 'global/setInSession',
        payload: false,
      });

      // ✅ 关闭录音组件（回到上课按钮）
      closeRecorderControlled();

      // ✅ 清除本地状态
      setStage('idle');
    }


  };

  const stopRecording = () => {
    const audioRecorder = mediaRecorderRef.current;//音频录制器
    const audioStream = streamRef.current;//音频流
    const screenRecorder = screenRecorderRef.current;//屏幕录制器
    const screenStream = screenStreamRef.current;//屏幕流

    if (audioRecorder && audioRecorder.state === 'recording') {
      audioRecorder.stop();
      audioStream.getTracks().forEach((track) => track.stop());
    }

    if (screenRecorder && screenRecorder.state === 'recording') {
      screenRecorder.stop();
      screenStream.getTracks().forEach((track) => track.stop());
    }

    // 清理音频上下文
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    setStage('done');

    dispatch({
      type: 'recorder/fetchBookList',
      payload: false,
      callback: (err, message, result) => {
        console.log('fetchBookList', result);
        if (err) {
          notification.error({
            message: '获取书籍列表失败',
            description: err.message || ' 请稍后重试。',
          });
        } else {
          setBookList(result);
        }
      },
    });




    if (courseId === undefined) {
      setIsRecording(true);
    } else {
      sendToCould();
    }

  };

  // 发送录制内容到云端
  const sendToCould = () => {
    setIsRecording(false);
    setLoading(true);
    setTimeout(() => {
      // 处理音频文件
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      // 处理录屏文件并转换为mp4
      const screenBlob = new Blob(screenChunksRef.current, { type: 'video/webm' });

      // 转换视频格式并上传到服务器
      convertWebmToMp4(screenBlob).then((convertedBlob) => {
        // 创建音频文件对象（MP3格式）
        const audioFile = new File([audioBlob], 'recording.mp3', {
          type: 'audio/mpeg'
        });

        // 创建视频文件对象（MP4格式）
        const videoFile = new File([convertedBlob], 'recording.mp4', {
          type: 'video/mp4'
        });
        // 上传文件到服务器
        dispatch({
          type: 'recorder/uploadToServer',
          payload: {
            type: 1,
            bookId: courseId,
            title: textInput,
            audio: audioFile,
            video: videoFile,
          },
          callback: (err, message, result) => {
            setLoading(false);
            if (err) {
              notification.error({
                message: '上传失败',
                description: err.message || '视频上传失败，请稍后重试。',
              });
            } else {
              notification.success({
                message: '上传成功',
                description: '课程总结已生成，请点击下方按钮查看',
                duration: null,
                btn: (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      // 这里可以添加查看总结的逻辑
                      history.push({
                        pathname: '/teach/videoSummary/conclude',
                        state: {
                          summary: {
                            title: textInput,
                            content: result || '暂无总结内容',
                          },
                        },
                      })
                      console.log('查看总结');
                      notification.destroy();
                    }}
                  >
                    查看总结
                  </Button>
                ),
              });
            }
            closeRecorderControlled?.();
          },
        });

      });
    }, 300);

    dispatch({
      type: 'global/setInSession',
      payload: false,
    });
  }

  // 保存到本地
  const saveToLocal1 = () => {
    setIsRecording(false);
    // 创建音频文件
    setTimeout(() => {
      // 处理音频文件
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

      // 处理录屏文件并转换为mp4
      const screenBlob = new Blob(screenChunksRef.current, { type: 'video/mp4' });
      const videoFile = new File([screenBlob], 'recording_video.mp4', {
        type: 'video/mp4'
      });

      // 创建下载链接并触发下载
      const downloadFile = (file, fileName) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      // 依次下载音频和视频文件
      // downloadFile(audioFile, `recording_${textInput || 'audio'}.mp3`);
      setTimeout(() => {
        downloadFile(videoFile, `recording_${textInput || 'video'}.mp4`);
      }, 500);

      // 提示用户下载完成
      message.success('录制内容已成功保存到本地');

      convertWebmToMp4(screenBlob).then((convertedBlob) => {
        // 创建音频文件对象（MP3格式）
        const audioFile = new File([audioBlob], 'recording.mp3', {
          type: 'audio/mp3'
        });

        // 创建视频文件对象（MP4格式）
        const videoFile = new File([convertedBlob], 'recording.mp4', {
          type: 'video/mp4'
        });

        // 上传文件到服务器
        dispatch({
          type: 'recorder/uploadToServer',
          payload: {
            type: 2,
            title: textInput,
            audio: audioFile,
          },
          callback: (err, message, result) => {

            setLoading(false);
            if (err) {
              notification.error({
                message: '上传失败',
                description: err.message || '视频上传失败，请稍后重试。',
              });
            } else {
              notification.success({
                message: '上传成功',
                // description: '录制的音视频文件已成功上传到服务器',
                description: '课程总结已生成，请点击下方按钮查看',
                duration: null,
                btn: (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      // 跳转到总结页面
                      history.push({
                        pathname: '/teach/videoSummary/conclude',
                        state: {
                          summary: {
                            title: textInput,
                            content: result || '暂无总结内容',
                          },
                        },
                      });
                      console.log('查看总结');
                      notification.destroy();
                    }}
                  >
                    查看总结
                  </Button>
                ),
              });
            }
            closeRecorderControlled?.();
          },
        });
      });
    }, 300);
    dispatch({
      type: 'global/setInSession',
      payload: false,
    });
  };

  const saveToLocal2 = () => {
    setIsRecording(false);
    // 创建音频文件
    setTimeout(() => {
      // 处理音频文件
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

      // 处理录屏文件并转换为mp4
      const screenBlob = new Blob(screenChunksRef.current, { type: 'video/mp4' });
      const videoFile = new File([screenBlob], 'recording_video.mp4', {
        type: 'video/mp4'
      });

      convertWebmToMp4(screenBlob).then((convertedBlob) => {
        // 创建音频文件对象（MP3格式）
        const audioFile = new File([audioBlob], 'recording.mp3', {
          type: 'audio/mp3'
        });

        // 创建视频文件对象（MP4格式）
        const videoFile = new File([convertedBlob], 'recording.mp4', {
          type: 'video/mp4'
        });

        // 上传文件到服务器
        dispatch({
          type: 'recorder/uploadToServer',
          payload: {
            type: 1,
            bookId: bookId,
            title: textInput,
            audio: audioFile,
            video: videoFile,
          },
          callback: (err, message, result) => {

            setLoading(false);
            if (err) {
              notification.error({
                message: '上传失败',
                description: err.message || '视频上传失败，请稍后重试。',
              });
            } else {
              notification.success({
                message: '上传成功',
                description: '课程总结已生成，请点击下方按钮查看',
                duration: null,
                btn: (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      // 跳转到总结页面
                      history.push({
                        pathname: '/teach/videoSummary/conclude',
                        state: {
                          summary: {
                            title: textInput,
                            content: result || '暂无总结内容',
                          },
                        },
                      });
                      console.log('查看总结');
                      notification.destroy();
                    }}
                  >
                    查看总结
                  </Button>
                ),
              });
            }
            closeRecorderControlled?.();
          },
        });
      });
    }, 300);
    dispatch({
      type: 'global/setInSession',
      payload: false,
    });
  };

  return (
    <div>
      {audioUrl && stage === 'done' && (
        <audio controls src={audioUrl} style={{ display: 'none' }} />
      )}

      <Modal
        open={inputModalVisible}
        title={<div style={{ textAlign: 'center', fontWeight: 'bold' }}>请输入本节课的主题</div>}
        centered
        bodyStyle={{ borderRadius: '0.2rem' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              type="primary"
              onClick={handleInputConfirm}
              disabled={!textInput.trim()}
              style={{
                borderRadius: 8,
                backgroundColor: '#1677ff',
                color: 'white',
                borderColor: '#1677ff',
                opacity: !textInput.trim() ? 0.6 : 1,
                cursor: !textInput.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              确定
            </Button>
            <Button
              style={{ borderRadius: 8 }}
              onClick={() => {
                setInputModalVisible(false);
                closeRecorderControlled?.();
              }}
            >
              取消
            </Button>
          </div>
        }
        onCancel={() => {
          setInputModalVisible(false);
          closeRecorderControlled?.();
        }}
      >
        <Input.TextArea
          rows={4}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="请输入本节课的主题..."
          status={!textInput.trim() ? 'error' : ''}
          onKeyDown={handleKeyDown}
        />
        {!textInput.trim() && (
          <div style={{ color: 'red', marginTop: 8 }}>请输入主题后才能确定</div>
        )}
      </Modal>

      <Modal
        open={isRecording}
        title={<div style={{ textAlign: 'center', fontWeight: 'bold' }}>请选择保存方式</div>}
        centered
        bodyStyle={{ borderRadius: '0.2rem' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: '2vh' }}>
            <Button
              type="primary"
              onClick={saveToLocal1}
              style={{
                borderRadius: 8,
                backgroundColor: '#1677ff',
                color: 'white',
                borderColor: '#1677ff',
                cursor: 'pointer',
                left: '6vw',
              }}
            >
              保存到本地
            </Button>
            <Button
              disabled={!choose}
              style={{ borderRadius: 8, right: '6vw', background: '#fff',color: '#1677ff',borderColor: '#1677ff'}}
              onClick={saveToLocal2}
            >
              保存到服务器
            </Button>
          </div>
        }
        onCancel={() => {
          Modal.confirm({
            title: '您确定要关闭对话框吗？',
            content: '关闭后将丢失已录制的内容。',
            onOk() {
              setIsRecording(false);
            },
            onCancel() {
              console.log('取消关闭对话框');
            },
          });
        }}
      >
        <Form from={from}>
          <Form.Item
            label="选择课本"
            rules={[{ required: true, message: '请选择课本' }]}>
            <Select
              placeholder="请选择课本"
              allowClear
              options={bookList.map((item) => ({
                value: item.bookId,
                label: item.bookName,
              }))}
              onChange={(value) => {
                setBookId(value);
                setChoose(!!value)
                setChapterList(chapterList.filter((item) => item.bookId === value));
              }}
            />
          </Form.Item>

        </Form>
      </Modal>



      {stage === 'recording' && (
        <div
          style={{
            position: 'fixed',
            top: '25%',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            right: '2.9%',
          }}
        >
          <Button
            type="primary"
            danger
            loading={loading}
            onClick={stopRecording}
            style={{
              width: '1.5rem',
              height: '0.8rem',
              borderRadius: '.2rem',
              fontWeight: '600',
              fontSize: '0.3rem',
            }}
          >
            下课
          </Button>
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: '#fff1f0',
              color: '#cf1322',
              border: '1px solid #ffa39e',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: 14,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            🎥 正在录制...
          </div>
        </div>
      )}
    </div>
  );
};

export default connect(({ recorder }) => ({
  videoList: recorder.videoList,
}))(RecorderControlled);
