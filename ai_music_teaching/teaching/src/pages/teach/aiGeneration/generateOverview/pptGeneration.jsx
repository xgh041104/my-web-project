import { useState, useRef } from 'react';
import { Input, Button, Modal, Select, Card, Spin, message } from 'antd';
import { useDispatch, useHistory, useSelector } from 'umi';
import './attributeFilling.less';
import { FileTextOutlined, CloudUploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const AttributeFilling = () => {
  // 统一状态管理对象
  const [formData, setFormData] = useState({
    theme: '',
    length: '短篇（10-20页）',
    audience: '大众',
    scene: '教学课件',
    lang: '简体中文',
    apiKey: 'ak_r4zutH356s5spvlh2b',
    prompt: '',
    tokenHours: 2,
    usageLimit: null,
    type: '1'
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSecondModalVisible, setIsSecondModalVisible] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [content, setContent] = useState('');
  const [isLoadingShow, setIsLoadingShow] = useState(false);
  const contentRef = useRef('');
  const history = useHistory();

  // 处理文本域变化
  const handleThemeChange = (e) => {
    setFormData(prev => ({ ...prev, theme: e.target.value }));
  };

  // 通用处理下拉框变化 
  const handleSelectChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleButtonClick = () => {
    if (formData.theme === '') {
      message.warning('请输入主题');
      return;
    }
    setIsButtonDisabled(true);
    setIsModalVisible(true);
  };

  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        type: '2' // 自动切换到文件上传模式
      }));
    }
  };
  const prefix = '/teach/aiGeneration'


  const selectOptions = [
    {
      key: 'length',
      label: '篇幅',
      options: ['短篇（10-20页）', '中篇（20-30页）', '长篇（25-35页）'],
      defaultValue: 'short'
    },
    {
      key: 'audience',
      label: '受众',
      options: ['大众', '老师', '学生'],
      defaultValue: '大众'
    },
    {
      key: 'scene',
      label: '场景',
      options: ['教学课件', '工作总结', '工作计划', '会议材料', '项目汇报', '公众演讲'],
      defaultValue: '通用场景'
    },
    {
      key: 'lang',
      label: '语言',
      options: ['简体中文', '繁体中文', 'English', '日本語'],
      defaultValue: 'zh'
    }
  ];

  //页面逻辑函数
  const dispatch = useDispatch();
  const { apiKey, apiToken, taskId, editingOutline } = useSelector(state => state.generation);

  const handleCreateToken = () => {
    return dispatch({
      type: 'generation/createApiToken',
      payload: { tokenHours: 2 }
    });
  };

  const handleCreateTask = async () => {
    if (!apiToken) {
      message.warning('请先创建 API Token');
      return;
    }
    if (formData.type === '1') {
      const taskId = await dispatch({
        type: 'generation/createTask1',
        payload: {
          token: apiToken,      // 从 state 获取的 token
          theme: formData.theme  // 自定义主题
        }
      });
      return taskId;
    }
    if (formData.type === '2') {
      const taskId = await dispatch({
        type: 'generation/createTask2',
        payload: {
          token: apiToken,      // 从 state 获取的 token
          file: formData.file  // 文件
        }
      });
      return taskId;
    }

  };

  const handleGenerateContent = async () => {
    setContent('')
    const transData = {
      theme: formData.theme,
      length: formData.length,
      audience: formData.audience,
      scene: formData.scene,
      lang: formData.lang,
      apiKey: 'ak_uMb6v9Fr65rE67egER',
      prompt: '大纲只需包含清晰教学目标、分步骤教学活动设计、师生互动环节、课时分配及效果评估方法。',
      tokenHours: 2,
      usageLimit: null
    }
    if (formData.length === '短篇（10-20页）') {
      transData.length = 'short'
    }
    else if (formData.length === '中篇（20-30页）') {
      transData.length = 'medium'
    }
    else if (formData.length === '长篇（25-35页）') {
      transData.length = 'long'
    }

    const content = await dispatch({
      type: 'generation/generateContent',
      payload: {
        formData: transData
      }
    })
    return content
  }

  //处理返回的数据
  const processStream = async (response, ref, setState) => {
    // 识别非流式响应，直接从response.data获取内容
    if (response && response.data && response.data.data && response.data.data.text) {
      const content = response.data.data.text;
      ref.current = content;
      setState(content);
      return;
    }

    // 处理流式响应（保持原有逻辑）
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    ref.current = '';
    const renderFrame = {
      chunkBuffer: '',
      updateScheduled: false,
      scheduleUpdate: () => {
        if (renderFrame.updateScheduled) return;
        renderFrame.updateScheduled = true;
        requestAnimationFrame(() => {
          setState(ref.current + renderFrame.chunkBuffer);
          renderFrame.chunkBuffer = '';
          renderFrame.updateScheduled = false;
        });
      }
    };

    // 事件流缓冲区
    let eventBuffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      eventBuffer += chunk;

      // 按行处理事件流数据
      const lines = eventBuffer.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (!jsonStr) continue;

          const eventData = JSON.parse(jsonStr);

          if (eventData.status === 3) {
            const content = eventData.text;
            ref.current += content;
            renderFrame.chunkBuffer += content;
            renderFrame.scheduleUpdate();
          }
        }
      }

      // 保留未处理完的数据
      eventBuffer = lines[lines.length - 1].startsWith('data: ') ? lines.pop() : '';
    }

    // 处理最终片段
    const finalChunk = decoder.decode();
    if (finalChunk) {
      ref.current += finalChunk;
      setState(ref.current);
    }
  };

  const pageText = async () => {
    const apiToken = await handleCreateToken();
    const taskId = await handleCreateTask();
    const genercontent = await handleGenerateContent();
    await processStream(genercontent, contentRef, setContent);
    const responseData = contentRef.current;

    // 更新editingOutline
    dispatch({
      type: 'generation/updateEditingOutline',
      payload: responseData
    });
  };

  // 生成按钮点击处理
  const handleGenerate = async () => {
    if (formData.type === '1' && !formData.theme.trim()) {
      message.warning('请输入主题');
      return;
    }

    if (formData.type === '2' && !formData.file) {
      message.warning('请上传文件');
      return;
    }

    setIsButtonDisabled(true);
    setIsLoadingShow(true);

    try {
      await pageText();
      setIsSecondModalVisible(true);
    } catch (error) {
      message.error('生成失败: ' + error.message);
    } finally {
      setIsButtonDisabled(false);
      setIsLoadingShow(false);
    }
    message.info({
  content: '大纲已生成完毕，即将跳转！',
  duration: 2.4, // 单位是秒，设置为你需要的持续时间
});
    setTimeout(() => {
      history.push(`${prefix}/ppt_template/pptOutlinePreview`)
    },3000)

  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      minHeight: '69vh',
      display: 'flex',
      padding: '20px',
      alignItems: 'center',
      flexDirection: 'column',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {isLoadingShow && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          flexDirection: 'column'
          
        }}>
          <Spin size="large"  />
          <h3 style={{marginTop: '20px'}}>正在生成中，请稍等...</h3>
        </div>
      )}  

      <h1 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: '#2d3748',
        margin: '20px 0 30px 0',
        textAlign: 'center'
      }}>
        PPT大纲生成
      </h1>

      <Card
        style={{
          width: '90%',
          maxWidth: '700px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '30px'
        }}
        bodyStyle={{ padding: '25px' }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#2d3748',
            marginBottom: '15px'
          }}>
            生成方式
          </h2>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <button
              className={`style-btn ${formData.type === '1' ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: '1', file: null }))}

            >
              主题生成
            </button>
            <button
              className={`style-btn ${formData.type === '2' ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: '2' }))}
            >
              文件上传生成
            </button>
          </div>

          {/* 主题生成相关字段 - 仅在类型为1时显示 */}
          {formData.type === '1' && (
            <>
              <div style={{
                display: 'flex',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '4px',
                marginBottom: '25px',
              }}>
                <TextArea
                  autoSize={{ minRows: 2, maxRows: 3 }}
                  placeholder="请输入创作主题..."
                  value={formData.theme}
                  onChange={handleThemeChange}
                  bordered={false}
                  // onKeyDown={handleKeyDown}
                  style={{
                    width: '100%',
                    border: 'none',
                    boxShadow: 'none',
                    padding: '12px',
                    fontSize: '15px',
                    resize: 'none',
                    background: 'transparent'
                  }}
                />
                <Button
                  type="primary"
                  style={{
                    margin: '0 8px',
                    borderRadius: '8px',
                    height: '40px',
                    padding: '0 20px',
                    fontWeight: 1000,
                    background: 'linear-gradient(90deg,rgb(82, 155, 238),rgb(52, 136, 232))',
                  }}
                  onClick={handleGenerate}
                  loading={isLoadingShow}
                  disabled={isButtonDisabled || isLoadingShow}
                >
                  立即创作
                </Button>
              </div>

              {/* 四个下拉选择框 - 网格布局  */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '15px'
              }}>
                {selectOptions.map((item) => (
                  <div key={item.key}>
                    <label style={{
                      display: 'block',
                      fontWeight: 500,
                      color: '#4a5568',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      {item.label}
                    </label>
                    <Select
                      value={formData[item.key]}
                      onChange={(value) => handleSelectChange(item.key, value)}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                      }}
                    >
                      {item.options.map(option => (
                        <Option key={option} value={option}>
                          {option}
                        </Option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 文件上传相关字段 - 仅在类型为2时显示 */}
          {formData.type === '2' && (
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#2d3748',
                marginBottom: '15px'
              }}>
                上传文件
              </h2>

              <div style={{
                border: '1px dashed #cbd5e0',
                borderRadius: '8px',
                
                textAlign: 'center',
                background: '#f8fafc',
                position: 'relative',
                marginBottom: '20px',
              }}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />

                {formData.file ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '15px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#ebf4ff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        <FileTextOutlined style={{ fontSize: '20px', color: '#4299e1' }} />
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 500,
                          color: '#2d3748',
                          fontSize: '15px',
                          marginBottom: '4px'
                        }}>
                          {formData.file.name}
                        </div>
                        <div style={{
                          color: '#718096',
                          fontSize: '13px',
                        }}>
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      type="text"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, file: null }));
                      }}
                      style={{
                        color: '#e53e3e',
                      }}
                    >
                      移除
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: '#ebf4ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 15px'
                    }}>
                      <CloudUploadOutlined style={{ fontSize: '24px', color: '#4299e1' }} />
                    </div>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#2d3748',
                      marginBottom: '8px'
                    }}>
                      点击或拖拽文件到此处
                    </p>
                    <p style={{
                      color: '#718096',
                      fontSize: '13px',
                    }}>
                      支持格式: PDF, Word, PPT, 文本文件
                    </p>
                    <p style={{
                      color: '#a0aec0',
                      fontSize: '12px',
                      marginTop: '5px'
                    }}>
                      最大文件大小: 20MB
                    </p>
                  </div>
                )}
              </div>

              {formData.file && (
                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="primary"
                    onClick={handleGenerate}
                    style={{
                      height: '42px',
                      padding: '0 40px',
                      fontWeight: 500,
                      borderRadius: '8px',
                    }}
                    loading={isLoadingShow}
                    disabled={isButtonDisabled || isLoadingShow}
                  >
                    生成大纲
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

    
    </div>
  );
};
export default AttributeFilling;