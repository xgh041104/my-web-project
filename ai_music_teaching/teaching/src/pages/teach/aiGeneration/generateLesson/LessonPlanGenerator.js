import React, { useState, useRef, useEffect } from "react";
import CryptoJS from "crypto-js";
import { saveToWord } from "./docxUtils";
import { Button, Modal, Input, message } from "antd";
import { history, useSelector } from "umi";
import "./lessonOutlinePreview.css";
import MarkDownEditor from "../../../../components/mdeditor";

// 生成WebSocket参数
const genParams = (appid, query, domain) => {
  return {
    header: {
      app_id: appid,
      uid: "1234",
    },
    parameter: {
      chat: {
        domain: domain,
        temperature: 0.5,
        max_tokens: 4096,
        auditing: "default",
      },
    },
    payload: {
      message: {
        text: [{ role: "user", content: query }],
      },
    },
  };
};

// 创建WebSocket URL
const createWsUrl = (appid, apiKey, apiSecret, sparkUrl) => {
  const urlObj = new URL(sparkUrl);
  const host = urlObj.host;
  const pathname = urlObj.pathname;

  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${pathname} HTTP/1.1`;

  const signature = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
  const signatureBase64 = CryptoJS.enc.Base64.stringify(signature);

  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
  const authorization = btoa(authorizationOrigin);

  return `${sparkUrl}?authorization=${encodeURIComponent(
    authorization,
  )}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
};

// 主组件
const LessonOutlinePreview = () => {
  const { totalTitle } = useSelector((state) => state.generation);
  let requirement = totalTitle || "";

  const appid = "2ecb3dcd";
  const apiSecret = "ODQxMGYyNzI1NTZlOWFmY2M2ZWMxZTM5";
  const apiKey = "c26be434cb023517da76869c57be1871";
  const sparkUrl = "wss://spark-api.xf-yun.com/v4.0/chat";
  const domain = "4.0Ultra";

  const [isGenerating, setIsGenerating] = useState(true);
  const [outputContent, setOutputContent] = useState("");
  const [isDownloadReady, setIsDownloadReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modifyRequirement, setModifyRequirement] = useState("");
  const [inputValue, setInputValue] = useState(requirement || "");
  const [editorKey, setEditorKey] = useState(0);

  const wsRef = useRef(null);
  const fullContentRef = useRef("");
  const bufferRef = useRef("");
  const renderTimerRef = useRef(null);

  // 初始化生成教案
  useEffect(() => {
    if (requirement) {
      handleGenerate(requirement);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // 清理定时器
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }
    };
  }, []);

  // 定时器触发的渲染函数
  const flushBufferToOutput = () => {
    if (bufferRef.current) {
      // 批量更新内容
      setOutputContent((prev) => prev + bufferRef.current);
      // 清空缓冲区
      bufferRef.current = "";
    }

    // 重置定时器
    renderTimerRef.current = setTimeout(flushBufferToOutput, 1000);
  };

  const startGeneration = async (prompt) => {
    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      // 清理缓冲区和定时器
      bufferRef.current = "";
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }

      // 启动定时器
      renderTimerRef.current = setTimeout(flushBufferToOutput, 1000);

      const wsUrl = createWsUrl(appid, apiKey, apiSecret, sparkUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        const data = JSON.stringify(genParams(appid, prompt, domain));
        wsRef.current.send(data);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const wsMessage = JSON.parse(event.data);

          if (wsMessage.header && wsMessage.header.code !== 0) {
            message.error(
              `请求错误: ${wsMessage.header.code}, ${wsMessage.header.message}`,
            );
            setIsGenerating(false);
            wsRef.current.close();
            return;
          }

          if (wsMessage.payload?.choices) {
            const choices = wsMessage.payload.choices;
            const status = choices.status;
            const content = choices.text[0].content;

            // 实时更新完整内容
            fullContentRef.current += content;

            // 更新缓冲区而不是直接更新状态
            bufferRef.current += content;

            if (status === 2) {
              // 结束生成时立即刷新缓冲区
              if (bufferRef.current) {
                setOutputContent((prev) => prev + bufferRef.current);
                bufferRef.current = "";
              }

              // 清理定时器
              if (renderTimerRef.current) {
                clearTimeout(renderTimerRef.current);
                renderTimerRef.current = null;
              }

              setIsGenerating(false);
              setIsDownloadReady(true);
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
              }
            }
          }
        } catch (e) {
          message.error(`解析消息时出错: ${e.message}`);
          setIsGenerating(false);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }
        }
      };

      wsRef.current.onerror = (error) => {
        message.error(`WebSocket错误: ${error.message}`);
        setIsGenerating(false);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };

      wsRef.current.onclose = () => {};
    } catch (error) {
      message.error(`初始化连接时出错: ${error.message}`);
      setIsGenerating(false);
    }
  };

  const handleGenerate = (inputText) => {
    setInputValue(inputText);
    setIsGenerating(true);
    setOutputContent("");
    setIsDownloadReady(false);
    fullContentRef.current = "";
    bufferRef.current = "";
    setEditorKey((prev) => prev + 1);

    // 清理定时器
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
    }

    const prompt = `请根据以下要求生成：${inputText}。请使用Markdown格式返回结果，包含标题、小标题、有序列表和必要的加粗强调。`;
    startGeneration(prompt);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    if (!modifyRequirement.trim()) {
      message.warning("请输入修改意见");
      return;
    }

    // 保存修改意见内容
    const requirementContent = modifyRequirement;

    // 清空修改输入框
    setModifyRequirement("");

    setIsGenerating(true);
    setOutputContent("");
    setIsDownloadReady(false);
    fullContentRef.current = "";
    bufferRef.current = "";
    setIsModalOpen(false);
    setEditorKey((prev) => prev + 1);

    // 清理定时器
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
    }

    // 使用保存的修改意见
    const prompt = `原始要求：${inputValue}。\n\n请根据以下修改意见重新生成教案：${requirementContent}。请使用Markdown格式返回结果，包含标题、有序列表和必要的加粗强调。`;
    startGeneration(prompt);
  };

  const handleDownload = () => {
    if (fullContentRef.current) {
      saveToWord(fullContentRef.current);
    } else {
      message.warning("没有可下载的内容");
    }
  };

  const prefix = "/teach/aiGeneration";
  const handleBack = () => {
    history.push({ pathname: prefix });
  };

  return (
    <div className="container">
      <div className="header">
        <div className="title">
          预览
          <Button
            type="primary"
            onClick={showModal}
            className="navButton"
            disabled={!isDownloadReady || isGenerating}
          >
            修改
          </Button>
        </div>
      </div>
      <main className="markdownContainer">
        <div className="markdownContent">
          {outputContent ? (
            <MarkDownEditor
              key={editorKey}
              value={outputContent}
              onChange={(v) => {
                setOutputContent(v);
                fullContentRef.current = v;
              }}
            />
          ) : isGenerating ? (
            <div className="loading-indicator">正在生成，请稍候...</div>
          ) : (
            <div className="placeholder">生成的内容将显示在这里...</div>
          )}
        </div>
      </main>

      <div className="footerContainer">
        <div className="footer">
          <div className="buttonGroup">
            <Button
              onClick={handleBack}
              className="navButton"
              disabled={isGenerating}
            >
              返回重新生成
            </Button>
            <Button
              type="primary"
              onClick={handleDownload}
              className="navButton"
              disabled={!isDownloadReady}
            >
              下载Word文档
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title="修改要求"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="确认修改"
        cancelText="取消"
      >
        <Input.TextArea
          placeholder="请输入修改要求，例如：增加更多互动环节、简化专业术语、添加案例分析..."
          value={modifyRequirement}
          onChange={(e) => setModifyRequirement(e.target.value)}
          showCount
          maxLength={500}
          allowClear
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default LessonOutlinePreview;
