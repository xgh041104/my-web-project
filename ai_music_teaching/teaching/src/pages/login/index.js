import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Row,
  Col,
  Form,
  Input,
  Alert,
  Card,
  Spin,
  Layout,
  Modal,
  Checkbox,
  Space,
  Typography,
} from "antd";
import { EditOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { connect } from "dva";
import "./index.css";
import { baseUrl } from "../../utils/config";

const { Header, Footer, Content } = Layout;

const { Title, Paragraph } = Typography;

const FormItem = Form.Item;

const Login = ({ loading, dispatch, login, user }) => {
  const { errorMsg } = login;

  const electronAPI = window?.electronAPI;
  const [errorMsgVisible, setErrorMsgVisible] = useState(false);
  const [loginingInfo, setLoginingInfo] = useState(null);
  const [userForm] = Form.useForm();
  const [isExamSystem, setIsExamSystem] = useState(false);
  const [isManageSystem, setIsManageSystem] = useState(false);

  useEffect(() => {
    const userInfo = window.localStorage.getItem("userInfo");
    userForm.setFieldsValue(JSON.parse(userInfo));
    const style = document.createElement("style");
    style.textContent = `
      @keyframes barHeight {
        0% { height: 5%; }
        50% { height: 30%; }
        100% { height: 10%; }
      }

      .spectrum-bar {
        animation: barHeight 2.5s infinite alternate ease-in-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 主要功能模块
  const modules = [
    {
      title: "AI音乐教学",
      icon: <ReadOutlined style={{ fontSize: 36, color: "#1677ff" }} />,
      desc: "智能生成旋律与和声，辅助音乐教学创作",
      bgColor: "linear-gradient(135deg, #f0f7ff, #d6e8ff)",
      onClick: () => handleOk(), // 处理点击事件
    },
    {
      title: "智慧学生考试",
      icon: <EditOutlined style={{ fontSize: 36, color: "#1677ff" }} />,
      desc: "AI 自动识别节奏与音高，实现智能评测",
      bgColor: "linear-gradient(135deg, #eef6ff, #dce8ff)",
      onClick: () => setIsExamSystem(true), // 处理点击事件
    },
    {
      title: "考试管理系统",
      icon: <TeamOutlined style={{ fontSize: 36, color: "#1677ff" }} />,
      desc: "统一管理课件、音频与模型资源，提升效率",
      bgColor: "linear-gradient(135deg, #f5f9ff, #e6efff)",
      onClick: () => setIsManageSystem(true), // 处理点击事件
    },
  ];

  const styles = {
    background: {
      minHeight: "100vh",
      background: "#f9faff",
      color: "#333",
      position: "relative",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#f9faff",
    },
    container: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 24px",
      position: "relative",
      zIndex: 2,
    },
    heroSection: {
      position: "relative",
      height: "40vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      overflow: "hidden",
      zIndex: 2,
    },
    heroContent: {
      position: "relative",
      zIndex: 3,
      textAlign: "center",
      maxWidth: 800,
    },
    glowingOrb: {
      position: "absolute",
      width: "300px",
      height: "300px",
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(126,178,255,0.4) 0%, rgba(249,250,255,0) 70%)",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      filter: "blur(60px)",
      zIndex: -1,
    },
    mainTitle: {
      fontSize: ".65rem",
      fontWeight: 900,
      color: "#1677ff",
      textShadow: "0 2px 4px rgba(22,119,255,0.1)",
      marginBottom: "20px",
    },
    titleHighlight: {
      position: "relative",
      color: "#1677ff",
    },
    subtitle: {
      fontSize: ".3rem",
      color: "#666",
      marginBottom: "40px",
    },
    highlight: {
      color: "#1677ff",
      fontWeight: "bold",
    },
    heroButtons: {
      display: "flex",
      justifyContent: "center",
      gap: "16px",
    },
    primaryButton: {
      height: "48px",
      borderRadius: "24px",
      background: "#1677ff",
      borderColor: "transparent",
      fontSize: "16px",
      fontWeight: "bold",
      boxShadow: "0 8px 16px rgba(22,119,255,0.2)",
      padding: "0 30px",
    },
    secondaryButton: {
      height: "48px",
      borderRadius: "24px",
      background: "transparent",
      borderColor: "#1677ff",
      color: "#1677ff",
      fontSize: "16px",
      fontWeight: "bold",
      padding: "0 30px",
    },
    sectionTitle: {
      fontSize: ".25rem",
      marginTop: "80px",
      marginBottom: "40px",
      textAlign: "center",
      color: "#1677ff",
    },
    featureCard: {
      borderRadius: "16px",
      overflow: "hidden",
      border: "none",
      height: "100%",
      boxShadow: "0 10px 20px rgba(22,119,255,0.08)",
      padding: "24px",
    },
    featureIcon: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      background: "rgba(22,119,255,0.08)",
      marginBottom: "20px",
      backdropFilter: "blur(8px)",
    },
    featureTitle: {
      color: "#1677ff",
      fontWeight: "bold",
      marginTop: 0,
      textAlign: "center",
      marginBottom: "10px",
    },
    featureDesc: {
      color: "#666",
      marginBottom: 0,
    },
  };

  // 在 index.jsx 中添加的 CSS-in-JS 样式
  const audioVisualizerBackground = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: "hidden",
    background: "linear-gradient(180deg, #f9faff 0%, #f0f7ff 100%)", // 浅色背景
  };

  // 频谱柱状图样式
  const spectrumContainer = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    height: "100%",
    padding: "0 20px",
    gap: "8px",
  };

  // 波浪线样式
  const waveContainer = {
    position: "absolute",
    width: "100%",
    height: "40%",
    bottom: "5%",
    opacity: 0.4,
  };

  useEffect(() => {
    const visible = errorMsg.message !== undefined && errorMsg.message !== null;
    setErrorMsgVisible(visible);
    if (visible) {
      setLoginingInfo(null);
    }
  }, [errorMsg]);

  const hideErrorMsg = () => {
    setErrorMsgVisible(false);
  };

  const handleOk = (values) => {
    setLoginingInfo("正在登陆中...");
    dispatch({
      type: "login/userLogin",
      payload: {
        ...values,
        userAccount: "masteradmin",
        userPwd: "masteradmin",
        userType: 1, //客户端只能使用普通用户登陆
      },
    });
  };

  return (
    <div style={styles.background}>
      {!isExamSystem && !isManageSystem && (
        <>
          <div div style={audioVisualizerBackground}>
            <div style={spectrumContainer}>
              {Array(20)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className="spectrum-bar"
                    style={{
                      width: "4%",
                      height: `${20 + Math.sin(i * 0.7) * 10}%`,
                      background:
                        "linear-gradient(0deg, rgba(126,178,255,0.7) 0%, rgba(147,192,255,0.3) 100%)",
                      borderRadius: "4px 4px 0 0",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
            </div>

            <div style={waveContainer}>
              <svg
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                viewBox="0 0 1440 320"
              >
                <path
                  fill="rgba(126,178,255,0.2)"
                  fillOpacity="1"
                  d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
                <path
                  fill="rgba(147,192,255,0.1)"
                  fillOpacity="1"
                  d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,208C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
            </div>
          </div>

          <div style={styles.heroSection}>
            <div style={styles.heroContent}>
              <div style={styles.glowingOrb} />
              <div style={styles.mainTitle}>
                <span style={styles.titleHighlight}>乐智课堂</span>
              </div>
              <Paragraph style={styles.subtitle}>
                基于<span style={styles.highlight}>多模态大模型</span>
                的AI智慧音乐教育平台
              </Paragraph>
            </div>
          </div>

          <div style={styles.container}>
            <Row gutter={[24, 24]} justify="center">
              {modules.map((mod, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card
                    hoverable
                    style={{ ...styles.featureCard, background: mod.bgColor }}
                    onClick={() => {
                      mod.onClick();
                    }}
                  >
                    <Row
                      justify="center"
                      align="middle"
                      style={{ marginTop: "26px" }}
                    >
                      <Col>
                        <div style={styles.featureIcon}>{mod.icon}</div>
                      </Col>
                      <Col span={14}>
                        <Title level={4} style={styles.featureTitle}>
                          {mod.title}
                        </Title>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}

      {/* 框架插入 */}
      {isManageSystem && (
        <div style={{ zIndex: "1000", overflow: "hidden" }}>
          <iframe
            style={{ width: "100vw", height: "100vh", border: "0" }}
            src={process.env.NODE_ENV === "development" ? baseUrl + "http://localhost:8001/login" : "https://my-web-project-manage.vercel.app/"}
            // allow='autoplay; microphone; midi'
          ></iframe>
        </div>
      )}
      {isExamSystem && (
        <div style={{ zIndex: "1000", overflow: "hidden" }}>
          <iframe
            style={{ width: "100vw", height: "100vh", border: "0" }}
            src={baseUrl + "http://localhost:8002/login"}
            allow="autoplay; microphone; midi"
          ></iframe>
        </div>
      )}
      {(isManageSystem || isExamSystem) && (
        <Button
          style={{
            position: "absolute",
            right: "6%",
            bottom: "0%",
            width: "1.2rem",
            height: ".45rem",
            fontSize: ".2rem",
            fontWeight: "600",
            zIndex: "9999",
          }}
          onClick={() => {
            setIsManageSystem(false);
            setIsExamSystem(false);
          }}
        >
          回到首页
        </Button>
      )}
    </div>
  );
};

export default connect(({ loading, dispatch, login, user }) => ({
  loading,
  dispatch,
  login,
  user,
}))(Login);
