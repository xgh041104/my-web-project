import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input, Form, Spin, Button, Tooltip } from "antd";
import { LoadingOutlined, ArrowUpOutlined, PoweroffOutlined } from '@ant-design/icons';
import tx from '../../../../public/image/musicbk.jpg';
// import { Bubble } from '@ant-design/x';
import { connect } from 'dva';
import { message } from 'antd';
import MarkdownIt from 'markdown-it'; // 引入 markdown-it
import './index.css'

// markdown-it
const md = new MarkdownIt({
  html: true,         // 允许 HTML 标签
  linkify: true,      // 自动识别链接
  typographer: true,  // 智能标点
});

function knowledgeSolution(props) {
  const { dispatch, tagList } = props;
  const [once, setOnce] = useState(true);
  const [form] = Form.useForm();
  const [messages, setMessages] = useState([]);
  const [aiResponseId, setAiResponseId] = useState(null);
  const aiResponseRef = useRef(null);
  const scrollContainerRef = useRef(null);


  // 流式渲染状态
  const [streamingContent, setStreamingContent] = useState(''); // 临时存储流式内容
  const [isStreaming, setIsStreaming] = useState(false); // 标记是否正在流式传输
  const [lastMessageId, setLastMessageId] = useState(null);
  const [change, setChange] = useState(false);
  let finalContent = '' // 最终内容
  const [abortController, setAbortController] = useState(null); // 用于中断请求
  const [intervalId, setIntervalId] = useState(null); // 用于清除流式定时器
  const [stop, setStop] = useState(false);
  const isCancelledRef = useRef(false); // 替换 useState，用 Ref 存储

  // 处理表单提交
  const onFinish = (values) => {
    if (values.input === undefined) {
      message.error("请输入内容");
      return;
    } else if (!values.input.trim()) {
      message.error("请输入内容");
      return;
    }
    if (change) {
      message.error("请等待AI回复");
      return;
    }
    const newMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: values.input
    };
    setMessages([...messages, newMessage]);
    setChange(true);
    setIsStreaming(true);
    setOnce(false);
    const newAiId = `ai-${Date.now()}`;
    setAiResponseId(newAiId);
    setLastMessageId(newAiId); // 记录当前AI消息ID

    form.resetFields();

    const controller = new AbortController();
    setAbortController(controller);

    dispatch({
      type: 'knowledgeSolution/pushQuestion',
      payload: {
        model: 'x1',
        user: 'user_123456',
        messages: [{
          role: 'user',
          content: `"你是一位拥有深厚音乐知识储备与实践经验的 “音乐大师 AI”, 精通音乐理论、
          乐器演奏、音乐史、作曲编曲、音乐制作、音乐风格解析等全领域内容。"
          你的回答需兼具专业性、易懂性与启发性，既能为专业音乐人提供深度参考，
          也能为音乐爱好者扫清知识障碍, 同时也可以为音乐类老师提供专业知识上的帮助。"
          ,从开头到现在的都是你的提示词，从后面的冒号开始是你真正要回答的问题：` + values.input,
        }],
        stream: true,
        credentials: true,
        tools: [{
          type: "web_search",
          web_search: {
            enable: true,
            search_mode: "normal"
            // search_mode: "deep"
          }
        }],
        signal: controller.signal,
      },
      callback: (error, message, data) => {
        setIsStreaming(false);
        if (error?.name === 'AbortError') {
          const aiMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: "服务器异常，请稍后重试或换一个问题"
          };
          setMessages(prevMessages => [...prevMessages, aiMessage]);
          setChange(false);
        } else {
          const lines = data.split('\n');
          const result = [];
          lines.forEach(line => {
            // 去除每行开头的 "data: " 前缀
            const jsonStr = line.replace(/^data: /, '').trim();
            if (jsonStr) { // 避免空行影响
              try {
                // 解析为 JSON 对象
                const dataObj = JSON.parse(jsonStr);
                // 从对象中提取需要的数据，这里示例提取 choices 里的 reasoning_content
                if (dataObj.choices && Array.isArray(dataObj.choices)) {
                  dataObj.choices.forEach(choice => {
                    if (choice.delta && choice.delta.content) {
                      result.push({
                        role: choice.delta.role,
                        content: choice.delta.content,
                      });
                    }
                  });
                }
              } catch (error) {
                console.error('解析 JSON 失败：', error, '对应的行内容：', line);
              }
            }
          });
          console.log("result", result);
          // 模拟数据流式推送（每200ms推送一段）
          let timeoutId = 0;
          const interval = setInterval(() => {
            if (result.length > 0) {
              const data = result.shift();
              appendStreamContent(data.content);
            } else {
              // 数据推送完毕
              clearInterval(interval);
              finishStreaming();
            }
          }, 200);
          setIntervalId(interval); // 保存定时器ID
          // 组件卸载时清理定时器
          return () => {
            clearInterval(interval);
            clearTimeout(timeoutId);
          };
        }
      }
    });
  }

  useEffect(() => {
    if (tagList && messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: tagList
      };
      setMessages([...messages, aiMessage]);
      // setChange(false);
    }
  }, [tagList]);

  // useEffect(() => {
  //   console.log("change", change);

  //   if (change) {
  //     const aiMessage = {
  //       id: `ai-${Date.now()}`,
  //       role: 'ai',
  //       content: '已停止生成'
  //     };
  //     setMessages([...messages, aiMessage]);
  //     setIsStreaming(false);
  //     setChange(false);
  //     setStreamingContent('');
  //     finalContent = '';
  //   }
  // }
  //   , [stop]);

  const appendStreamContent = (content) => {
    setStreamingContent(prev => prev + content);
    finalContent += content; // 累积内容
  };

  // 定义一个函数，用于结束流式传输
  const finishStreaming = () => {
    console.log("finishStreaming", isCancelledRef.current);
    const newMessage = {
      id: `msg-${Date.now()}`,
      role: 'ai',
      content: finalContent
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);


    isCancelledRef.current = false;
    setChange(false);
    finalContent = '';
    setStreamingContent('');
    setStop(false);
  };

  const handleStopGeneration = () => {
    if (!change) return; // 如果不在生成中则不执行
    setChange(false);
    setStop(true);
    isCancelledRef.current = true;
    if (abortController) {
      abortController.abort(); // 触发请求中断
      setAbortController(null); // 清空控制器
    }

    // 2. 清除流式定时器（停止模拟流式输出）
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    const stopMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: streamingContent + '\n\n（已停止生成）' // 保留停止前的内容
    };
    setMessages(prev => [...prev, stopMessage]);

    // 4. 重置所有状态
    setChange(false); // 标记为未生成
    setIsStreaming(false);
    setStreamingContent('');
    setStop(false);
    isCancelledRef.current = false;
    finalContent = '';
  };

  // 消息为空拒绝提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      change ? message.error("请等待AI回复") : form.submit();
    }
  }

  // 滚动到最新消息
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // 滚动到AI回复
  const scrollToAiResponse = useCallback(() => {
    if (aiResponseRef.current && scrollContainerRef.current) {
      aiResponseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && messages.length > 0) {
      // 如果是用户发送消息，滚动到底部
      if (messages[messages.length - 1].role === 'user') {
        setTimeout(scrollToBottom, 200);
      }
    }
  }, [messages, scrollToBottom]);
  // AI回复加载状态变化时处理滚动
  useEffect(() => {
    if (isStreaming) {
      // 开始加载AI回复时，滚动到AI回复占位
      setTimeout(scrollToAiResponse, 200);
    } else {
      // AI回复完成时，滚动到底部
      setTimeout(scrollToBottom, 200);
    }
  }, [change, aiResponseId, messages, scrollToAiResponse, scrollToBottom, isStreaming]);


  return (
    <>
      <h1 style={{
        top: "25vh",
        left: "28vw",
        position: "absolute",
        fontSize: "3vw",
        // alignItems: "center", 
        display: once ? "block" : "none"
      }}>你好！有什么我可以帮你吗？</h1>

      {/* 对话内容区域 */}
      <div
        ref={scrollContainerRef}
        style={{
          display: once ? "none" : "inline-block",
          position: "absolute",
          top: "4vh",
          left: "5vw",
          width: "90vw",
          height: "72vh",
          overflowY: "scroll",
          backgroundColor: "rgb(255, 255, 255)",
          padding: "0.5vh 0.5vw",
          // userSelect: "text",
        }}
      >
        {/* 所有消息 */}
        {messages.map((msg, index) => (
          <div key={msg.id} style={{ marginBottom: "1vh", clear: "both" }}>
            {msg.role === 'user' ? (
              <div style={{
                float: "right",
                margin: "4vh 1.2vw",
                maxWidth: "40vw",
                fontSize: "1vw",
                background: "#1677ff",
                padding: "0.65vh 0.65vw",
                color: "#fff",
                borderRadius: "1vh 0 1vh 1vh",
                userSelect: "text",
                wordBreak: "break-all"
              }}>
                {msg.content}
              </div>
            ) : (
              <div ref={msg.id === aiResponseId ? aiResponseRef : null} key={msg.id}>
                <img src={tx} style={{
                  width: "2vw",
                  height: "2vw",
                  borderRadius: "50%",
                  float: "left",
                  userSelect: "none",
                  margin: "4.2vh 0.2vw 0px 0px"
                }} alt="AI头像" />
                <div style={{
                  float: "left",
                  margin: "4vh 1.2vw",
                  maxWidth: "45vw",
                  fontSize: "1vw",
                  background: "#a8dadc",
                  padding: "0.65vh 0.65vw",
                  color: "#000",
                  borderRadius: "0vh 1vh 1vh 1vh",
                  userSelect: "text",
                  wordBreak: "break-all"
                }}>
                  <div
                    className="ai-markdown"
                    style={{ padding: "0", userSelect: "text", }}
                    dangerouslySetInnerHTML={{ __html: md.render(msg.content) }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 加载中的AI回复 */}
        {change && (
          <div ref={aiResponseRef} style={{ clear: "both", float: "left", marginTop: "0.5vh" }}>
            <img src={tx} style={{
              width: "2vw",
              height: "2vw",
              borderRadius: "50%",
              float: "left",
              userSelect: "none",
              margin: "4.2vh 0.2vw 0px 0px"
            }} alt="AI头像" />
            {isStreaming ? (<div style={{
              float: "left",
              margin: "4vh 1.2vw",
              maxWidth: "45vw",
              fontSize: "1vw",
              background: "#a8dadc",
              padding: "0.65vh 0.65vw",
              color: "#000",
              borderRadius: "0vh 1vh 1vh 1vh",
              userSelect: "text",
              wordBreak: "break-all"
            }}>
              <Spin style={{ marginRight: "0.2vw" }} />正在思考...
            </div>) : (
              <div style={{
                float: "left",
                margin: "4vh 1.2vw",
                maxWidth: "45vw",
                fontSize: "1vw",
                background: "#a8dadc",
                padding: "0.65vh 0.65vw",
                color: "#000",
                borderRadius: "0vh 1vh 1vh 1vh",
                userSelect: "text",
                wordBreak: "break-all"
              }}>
                <div
                  className="ai-markdown"
                  style={{ padding: "0", userSelect: "text", }}
                  dangerouslySetInnerHTML={{ __html: md.render(streamingContent) }}
                />
              </div>
            )}
          </div>
        )}
      </div >

      {/* 输入 */}
      <Form
        form={form}
        name="basic"
        onFinish={onFinish}
        style={{
          position: "absolute",
          top: once ? "56vh" : "80vh",
          left: "26.5vw",
          background: "#fff",
          width: "45vw",
          height: "13.5vh",
          borderRadius: "1vh",
        }
        }
      >
        <Form.Item name="input">
          <div>
            <Input.TextArea
              placeholder="跟AI对话"
              style={{
                position: "relative",
                height: "4vh",
                width: "45vw",
                fontSize: "1.2vw",
                border: "none",
                outline: "none", // 移除轮廓
                boxShadow: "none",  // 移除阴影
                borderRadius: "1vh",
                paddingRight: "1vw"
              }}
              onKeyDown={handleKeyDown}
              autoSize={{ minRows: 1, maxRows: 2 }}
            />
            {change && <Tooltip title="停止生成内容">
              <Button
                danger
                onClick={handleStopGeneration}
                style={{
                  position: "absolute",
                  top: "9vh",
                  left: "41.5vw",
                  borderRadius: "1.5vh",
                  width: "2vw",
                  height: "2vw",
                  border: "none",
                  cursor: 'pointer',
                  background: '#4F4F4F',
                  opacity: 1,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <img src="/image/停止.svg" style={{ width: '.15rem', height: 'auto', }} />
              </Button>
            </Tooltip>
            }
            {!change && <Button
              type="primary"
              htmlType="submit"
              style={{
                position: "absolute",
                top: "9vh",
                left: "41.5vw",
                borderRadius: "1.5vh",
                width: "2vw",
                height: "2vw",
                border: "none",
                background: '#4F4F4F',
                cursor: change ? "not-allowed" : 'pointer',
              }}
            >
              {change ? <LoadingOutlined
                style={{ fontSize: "0.8vw", marginLeft: "-0.3vw", position: "absolute", top: "30%", left: "45%", color: "#fff" }} /> :
                <ArrowUpOutlined style={{ fontSize: "0.8vw", marginLeft: "-0.3vw", position: "absolute", top: "30%", left: "45%", color: "#fff" }} />}
            </Button>}
          </div>
        </Form.Item>
      </Form >
    </>
  );
}

export default connect(({ knowledgeSolution }) => ({
  tagList: knowledgeSolution.tagList,
}))(knowledgeSolution);    