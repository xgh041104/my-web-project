import React, { useState, useEffect } from 'react';
import { useLocation, useDispatch, useHistory } from 'umi';
import { Image } from 'antd';
import './pptTemplate.css';
export default function PptTemplate(props) {
  // 模板查询状态
  const [templates, setTemplates] = useState([]);
  const [templatePagination, setTemplatePagination] = useState({
    page: 1, // 修正：page 应从 1 开始
    size: 6, // 修正：每页显示数量应合理
    total: 12
  });
  useEffect(() => {
    fetchTemplates();
  }, [templatePagination.page]); // 当page或筛选条件变化时重新加载


  const location = useLocation();
  const routeState = location.state || {}

  // 合并参数来源
  const finalApiToken = routeState.apiToken || props.apiToken;
  const finalTaskId = routeState.taskId || props.taskId;
  const finalEditingOutline = routeState.outlineContent || props.editingOutline;

  //按钮禁用
  const [isDownloadTriggered, setIsDownloadTriggered] = useState(false);

  const [templateFilters, setTemplateFilters] = useState({
    type: 1, // 1: 系统模板, 4: 用户自定义模板
    category: null,
    style: null,
    themeColor: null
  });

  // PPT生成状态
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pptDownloadUrl, setPptDownloadUrl] = useState(null);

  // 添加缺失的状态
  const [isLoading, setIsLoading] = useState({
    templates: false,
    ppt: false
  });
  const [status, setStatus] = useState('');

  const prefix = '/teach/aiGeneration/generateOverview/pptGeneration';
  const history = useHistory();

  // 添加Blob清理效果
  useEffect(() => {
    return () => {
      if (pptDownloadUrl) {
        window.URL.revokeObjectURL(pptDownloadUrl);
      }
    };
  }, [pptDownloadUrl]);

  const dispatch = useDispatch();

  // 模板筛选变化处理
  const handleTemplateFilterChange = (e) => {
    const { name, value } = e.target;
    setTemplateFilters(prev => ({
      ...prev,
      [name]: value || null
    }));
  };
  const templateChange = () => {
    setTemplatePagination(prev => ({
      ...prev,
      page: 1
    }));
    { fetchTemplates() }
  }

  // 查询PPT模板
  const fetchTemplates = async () => {
    setIsLoading(prev => ({ ...prev, templates: true }));
    const response = await dispatch({
      type: 'generation/fetchTemplates',
      payload: {
        page: templatePagination.page,
        size: templatePagination.size,
        filters: Object.values(templateFilters).every(v => v === null || v === '')
          ? null
          : templateFilters
      }
    });

    const data = response
    console.log("data", data.data.data)
    if (data.data.code === 0 && data.data.data) {
      setTemplates(data.data.data);
      setTemplatePagination(prev => ({
        ...prev,
        total: data.data.total || 0
      }));
      setStatus('模板加载成功');
    } else {
      setStatus(`加载失败: ${data.message || '未知错误'}`);
    }

    setIsLoading(prev => ({ ...prev, templates: false }));

  };
  // 生成PPT文件
  const generatePPT = async () => {
    if (!selectedTemplate) {
      setStatus('请先选择模板');
      return;
    }
    setIsLoading(prev => ({ ...prev, ppt: true }));
    const response = await dispatch({
      type: 'generation/generatePPT',
      payload: {
        id: finalTaskId,
        templateId: selectedTemplate.id,
        markdown: finalEditingOutline
      }
    });

    const contentType = response.headers['content-type'] || '';

    // 处理JSON响应
    if (contentType.includes('application/json')) {
      const result = response.data;
      console.log("result", result);
      if (result.code === 0 && result.data?.pptInfo?.fileUrl) {
        setPptDownloadUrl(result.data.pptInfo.fileUrl);
        setStatus('PPT生成成功');
        return;
      }

      throw new Error(result.message || '服务器返回未知错误');
    }

    // 处理二进制响应
    const blob = await response.blob();

    // 验证文件类型
    const validPPTTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream'
    ];

    if (!validPPTTypes.includes(contentType)) {
      throw new Error(`不支持的响应类型: ${contentType}`);
    }

    const url = window.URL.createObjectURL(blob);
    setPptDownloadUrl(url);
    setStatus('PPT生成成功');
    setIsLoading(prev => ({ ...prev, ppt: false }));

  };

  // 渲染模板分页控件
  const renderTemplatePagination = () => {
    const totalPages = Math.ceil(templatePagination.total / templatePagination.size);

    return (
      <div className="template-pagination">
        <button
          className="btn sheng"
          onClick={() => history.push({ pathname: prefix })}

        >
          重新生成
        </button>
        <button
          disabled={templatePagination.page <= 1}
          onClick={() => setTemplatePagination(prev => ({ ...prev, page: prev.page - 1 }))}
        >
          上一页
        </button>

        <span>
          第 {templatePagination.page} 页 / 共 {totalPages} 页
        </span>

        <button
          disabled={templatePagination.page >= totalPages}
          onClick={() => setTemplatePagination(prev => ({ ...prev, page: prev.page + 1 }))}
        >
          下一页
        </button>
        {selectedTemplate && (<button
          className="btn primary"
          onClick={() => {
            generatePPT()
          }}
          style={{ marginLeft: '50px' }}
          disabled={isLoading.ppt || isDownloadTriggered}
        >
          {isLoading.ppt ? '生成中...' : '生成PPT文件'}
        </button>)}
        {pptDownloadUrl && (
          <a
            href={pptDownloadUrl}
            download={`${selectedTemplate?.name || 'presentation'}.pptx`}
            className="btn download-btn"
            onClick={() => setIsDownloadTriggered(true)}
          >
            下载PPT文件
          </a>
        )}


      </div>


    );
  };



  // 渲染模板列表
  const renderTemplates = () => {
    if (isLoading.templates) {
      return <div className="loader">加载模板中...</div>;
    }
    console.log("shulang", templates.length)
    console.log("fdsaf", templates)
    if (templates.length === 0) {
      return <div className="no-templates"
        style={{
          display: 'flex',
          justifyContent: 'center',

        }}
      ><h3>未找到PPT模板</h3></div>;
    }

    return (
      <div className="templates-grid">
        {templates.map((template, index) => (
          <div
            key={index}
            className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate(template)}
          >
            {template.coverUrl ? (
              <Image
                src={`${template.coverUrl}?token=${finalApiToken}`}
                alt={template.name}
                className="template-cover"
              />
            ) : (
              <div className="template-placeholder">无封面</div>
            )}
            <div className="template-info">
              <h3 className="template-name">{template.name}</h3>
              <div className="template-meta">
                <span className="template-category">{template.category || '未分类'}</span>
                <span className="template-style">{template.style || '默认风格'}</span>
              </div>
              <div className="template-selection">
                {selectedTemplate?.id === template.id ? (
                  <span className="selected-badge"
                    style={{ color: 'green' }}><b>✓ 已选择</b></span>
                ) : (
                  <button
                    className="btn select-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                    }}
                  >
                    选择模板
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* PPT模板部分 */}
      <div className="templates-section">
        <div className="templates-card">
          <div className="template-filters">
            <div className="form-group">
              <label>分类筛选</label>
              <select
                name="category"
                value={templateFilters.category || ''}
                onChange={handleTemplateFilterChange}
              >
                <option value={""}>全部</option>
                <option value={"年终总结"}>年终总结</option>
                <option value={"教育培训"}>教育培训</option>
                <option value={"医学医疗"}>医学医疗</option>
                <option value={"商业计划书"}>商业计划书</option>
                <option value={"企业介绍"}>企业介绍</option>
                <option value={"毕业答辩"}>毕业答辩</option>
                <option value={"营销推广"}>营销推广</option>
                <option value={"晚会表彰"}>晚会表彰</option>
                <option value={"个人简历"}>个人简历</option>
              </select>
            </div>

            <div className="form-group">
              <label>风格筛选</label>
              <select
                name="style"
                value={templateFilters.style || ''}
                onChange={handleTemplateFilterChange}
              >
                <option value={""}>全部</option>
                <option value={"扁平简约"}>扁平简约</option>
                <option value={"商务科技"}>商务科技</option>
                <option value={"文艺清新"}>文艺清新</option>
                <option value={"卡通手绘"}>卡通手绘</option>
                <option value={"中国风"}>中国风</option>
                <option value={"创意时尚"}>创意时尚</option>
                <option value={"创意趣味"}>创意趣味</option>

              </select>
            </div>

            <div className="form-group">
              <label>主题颜色</label>

              <select
                name="themeColor"
                value={templateFilters.themeColor || ''}
                onChange={handleTemplateFilterChange}
              >
                <option value={""}>全部</option>
                <option value={"#FA920A"}>橙色</option>
                <option value={"#589AFD"}>蓝色</option>
                <option value={"#7664FA"}>紫色</option>
                <option value={"#65E5EC"}>青色</option>
                <option value={"#61D328"}>绿色</option>
                <option value={"#F5FD59"}>黄色</option>
                <option value={"#E05757"}>红色</option>
                <option value={"#FFFFFF"}>白色</option>
                <option value={"#000000"}>黑色</option>
              </select>
            </div>
            <div className="templates-header" style={{ margin: '25px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn primary"
                onClick={templateChange}
                disabled={isLoading.templates}
                style={{ marginRight: '50px' }}
              >
                {isLoading.templates ? '加载中...' : '获取模板'}
              </button>

            </div>
          </div>
          {renderTemplates()}
          {templates.length > 0 && renderTemplatePagination()}
        </div>
      </div>


    </>

  );
}