import React, { useState, useRef } from 'react';
import { Checkbox, Button, Input, Divider, message, Tree } from 'antd';
import styles from './syllabusGeneration.less';
import { history } from 'umi';
import { useDispatch, useSelector } from 'umi';
const { TextArea } = Input;

export default function SyllabusGeneration() {
  const [selectedKeys, setSelectedKeys] = useState(new Set(['opt4', 'opt5']));
  const [text, setText] = useState('课程简介;教学目的;');
  const [titleContent, setTitleContent] = useState('');
  const [weekContent, setWeekContent] = useState('');
  const [weekError, setWeekError] = useState(false); // <-- 新增状态
  const textRef = useRef(null);
  const cursorPos = useRef(0);
  const dispatch = useDispatch();
  const useSelector = useState();
  const options = [
    { key: 'opt4', label: '课程简介' },
    { key: 'opt5', label: '教学目的' },
    { key: 'opt6', label: '教学进度安排' },
    { key: 'opt7', label: '教材和参考书' },
    { key: 'opt8', label: '考核与成绩评定' },
    { key: 'opt9', label: '学生学习的要求和达到的效果' },
    {
      key: 'opt3',
      label: '课程资源配置',
      children: [
        { key: 'opt3-1', label: '指定教材与辅助教材' },
        { key: 'opt3-2', label: '教学课件与视频资料' },
        { key: 'opt3-3', label: '实验设备或软件平台' },
      ],
    },
    {
      key: 'opt2',
      label: '知识结构体系',
      children: [
        { key: 'opt2-1', label: '核心知识板块' },
        { key: 'opt2-2', label: '知识之间的逻辑关系图' },
        { key: 'opt2-3', label: '课程在专业体系中的位置' },
      ],
    },
    {
      key: 'opt1',
      label: '教学内容安排',
      children: [
        {
          key: 'opt1-1',
          label: (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                placeholder=""
                value={weekContent}
                onChange={(e) => {
                  setWeekContent(e.target.value);
                  if (e.target.value.trim()) {
                    setWeekError(false); // 有内容时隐藏错误
                  }
                }}
                style={{ width: '40px', height: '25px' }}
              />
              <h3 style={{ margin: '0 8px 0 4px' }}>周</h3>
              {/* 红字提示 */}
              {weekError && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  请输入周数(1-XX)
                </span>
              )}
            </div>
          ),
        },
        { key: 'opt1-2', label: '教学内容' },
        { key: 'opt1-3', label: '教学时数' },
        { key: 'opt1-4', label: '教学形式' },
        { key: 'opt1-5', label: '课外作业辅导安排' },
      ],
    },
  ];

  const getAllOptions = () => {
    return options.flatMap(opt => [opt, ...(opt.children || [])]);
  };

  const getLabelByKey = (key) => {
    const all = getAllOptions();
    const match = all.find(item => item.key === key);
    return match?.label || '';
  };

  const insertAtCursor = (insertText) => {
    const textarea = textRef.current.resizableTextArea.textArea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const newText = before + insertText + after;
    setText(newText);
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
    });
  };

  // 处理Tree勾选
  const handleCheck = (checkedKeysValue, e) => {
    const newSelected = new Set(selectedKeys);
    const key = e.node.key;

    // 选中了opt1-1且输入为空，显示错误，不插入
    if (key === 'opt1-1' && e.checked && !weekContent.trim()) {
      setWeekError(true);
      return;
    }

    const label = getLabelByKey(key);
    let insertText = `${label};`;
    if (key === 'opt1-1') {
      insertText = `${weekContent}周`;
    }

    if (e.checked) {
      newSelected.add(key);
      insertAtCursor(insertText);
      if (key === 'opt1-1') setWeekError(false);
    } else {
      newSelected.delete(key);
      let regex = new RegExp(`${label};`, 'g');
      if (key === 'opt1-1') regex = new RegExp(`${weekContent}周`, 'g');
      setText(prev => prev.replace(regex, ''));
    }

    setSelectedKeys(newSelected);
  };

  // 处理单选Checkbox
  const handleCheckboxToggle = (key) => {
    // 同理判断
    if (key === 'opt1-1' && !weekContent.trim()) {
      setWeekError(true);
      return;
    }

    const label = getLabelByKey(key);
    let insertText = `${label};`;
    if (key === 'opt1-1') {
      insertText = `${weekContent}周`;
    }

    const newSelected = new Set(selectedKeys);
    if (selectedKeys.has(key)) {
      newSelected.delete(key);
      let regex = new RegExp(`${label};`, 'g');
      if (key === 'opt1-1') regex = new RegExp(`${weekContent}周`, 'g');
      setText(prev => prev.replace(regex, ''));
    } else {
      newSelected.add(key);
      insertAtCursor(insertText);
      if (key === 'opt1-1') setWeekError(false);
    }

    setSelectedKeys(newSelected);
  };

  // 全选逻辑修改：勾选opt1-1时，weekContent为空则提示错误且不勾选
  const handleAllToggle = () => {
    const allKeys = getAllOptions().map(opt => opt.key);
    if (selectedKeys.size === allKeys.length) {
      setSelectedKeys(new Set());
      setText('');
      setWeekError(false);
    } else {
      // 判断weekContent
      if (!weekContent.trim()) {
        setWeekError(true);
        return;
      }
      setWeekError(false);

      const allText = allKeys.map(k => {
        if (k === 'opt1-1') return `${weekContent}周`;
        return `${getLabelByKey(k)}`;
      }).join(';') + ';';
      setSelectedKeys(new Set(allKeys));
      setText(text + allText);
    }
  };

  const handleAllContent = () => {
    if (titleContent === '') {
      message.warning('请输入课程名称');
      return;
    }
    const totalText = `课程名称为:${titleContent}该教学大纲的要求:${text}`;
    console.log(totalText);

    dispatch({
      type: 'generation/updateTotalTitle',
      payload: totalText
    });
    history.push('/teach/aiGeneration/generateLesson/LessonPlanGenerator')
  };

  const convertToTreeData = (items) =>
    items.map(item => ({
      key: item.key,
      title: item.label,
      children: item.children ? convertToTreeData(item.children) : undefined,
    }));

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, marginRight: '10px' }}>课程名称:</h3>
        <Input
          style={{ width: '300px' ,borderRadius:'6px'}}
          placeholder="请输入..."
          onChange={(e) => setTitleContent(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>教学大纲重点</h2>
        <button onClick={handleAllToggle} style={{ 
          background: 'linear-gradient(90deg, rgb(82, 155, 238), rgb(52, 136, 232))', // 渐变背景
          color: 'white',
          padding: '10px 20px',
          border: 'none',   
          borderRadius: '5px',
          cursor: 'pointer'
         }}>
          {selectedKeys.size === getAllOptions().length ? '取消全选' : '全选'}
        </button>
      </div>

      <div className={styles.optionsWrapper} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {options.map(opt => (
          <div key={opt.key} style={{ width: '32%', minWidth: 250 }}>
            {opt.children ? (
              <Tree
                checkable
                defaultExpandAll
                treeData={convertToTreeData([opt])}
                checkedKeys={[...selectedKeys]}
                onCheck={handleCheck}
                checkStrictly={true}
              />
            ) : (
              <Checkbox
                checked={selectedKeys.has(opt.key)}
                onChange={() => handleCheckboxToggle(opt.key)}
              >
                {opt.label}
              </Checkbox>
            )}
          </div>
        ))}
      </div>

      <Divider />

      <div
        style={{
          outline: '1px solid rgba(128, 128, 128, 0.9)',
          padding: '10px',
          paddingRight: '25px',
          borderRadius: '5px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextArea
          style={{ resize: 'none', height: '9vh' }}
          ref={textRef}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onClick={(e) => {
            const textarea = e.target;
            cursorPos.current = textarea.selectionStart;
          }}
          onKeyUp={(e) => {
            const textarea = e.target;
            cursorPos.current = textarea.selectionStart;
          }}
          placeholder="点击选项将插入其内容..."
          bordered={false}
        />
        <div style={{ marginLeft: '10px' }}>
          <Button
            type="primary"
            style={{
              width: '100%',
              height: '6vh',
              fontSize: 16,
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#1890ff',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleAllContent}
          >
            <strong>立即创作</strong>
          </Button>
        </div>
      </div>
    </div>
  );
}
