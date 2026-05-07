import React, { useState, useRef, useEffect } from 'react';

const InputDialog = ({
  title = "请输入修改要求",
  placeholder = "在此输入...",
  confirmText = "确定",
  cancelText = "取消",
  initialValue = "",
  onConfirm,
  onClose,
  visible = false
}) => {
  const [inputValue, setInputValue] = useState(initialValue || '');
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef(null);

  // 样式定义
  const styles = {
    container: {
      display: 'inline-block',
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    dialogContent: {
      background: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '400px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
    },
    dialogHeader: {
      padding: '16px',
      background: '#f8f9fa',
      borderBottom: '1px solid #e9ecef',
      textAlign: 'center',
      position: 'relative'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#6c757d',
      cursor: 'pointer',
      position: 'absolute',
      top: '8px',
      right: '12px',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'background-color 0.2s ease'
    },
    closeButtonHover: {
      background: '#e9ecef',
      color: '#495057'
    },
    form: {
      padding: '20px'
    },
    hintText: {
      margin: '0 0 10px',
      color: '#495057',
      fontSize: '13px',
      fontWeight: 500
    },
    inputGroup: {
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      fontSize: '13px',
      lineHeight: '1.5',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    },
    inputFocus: {
      borderColor: '#1a4a72',
      outline: 0,
      boxShadow: '0 0 0 0.2rem rgba(26, 74, 114, 0.25)'
    },
    inputInvalid: {
      borderColor: '#dc3545'
    },
    errorMessage: {
      color: '#dc3545',
      fontSize: '12px',
      marginTop: '6px',
      textAlign: 'left'
    },
    dialogFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '0 16px 16px'
    },
    primaryButton: {
      background: '#1a4a72',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '80px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    primaryButtonHover: {
      background: '#0d3a5c',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
    },
    secondaryButton: {
      background: '#f8f9fa',
      color: '#495057',
      border: '1px solid #e9ecef',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '80px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    secondaryButtonHover: {
      background: '#e9ecef',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }
  };

  // 状态管理
  const [isHovered, setIsHovered] = useState({
    closeButton: false,
    primaryButton: false,
    secondaryButton: false
  });

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  const closeDialog = (reason) => {
    if (onClose) onClose(reason);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsValid(e.target.value.trim() !== '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inputValue.trim() === '') {
      setIsValid(false);
      return;
    }

    if (onConfirm) onConfirm(inputValue);
    closeDialog('submit');
  };

  // 点击外部关闭对话框
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (visible && !e.target.closest('.dialog-content')) {
        closeDialog('cancel');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible]);

  // 对话框打开时聚焦输入框
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [visible]);

  return (
    <div style={styles.container}>
      {visible && (
        <div style={styles.overlay}>
          <div
            className="dialog-content"
            style={styles.dialogContent}
          >
            <div style={styles.dialogHeader}>
              <h2 style={{
                fontSize: '29px',
                color: '#343a40',
                margin: 0,
                fontWeight: 600
              }}>
                {title}
              </h2>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <p style={styles.hintText}>请输入修改要求</p>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  rows={5}
                  style={{
                    ...styles.input,
                    ...(!isValid && styles.inputInvalid),
                    ...(document.activeElement === inputRef.current && styles.inputFocus),
                    resize: 'vertical'
                  }}
                />
                {!isValid && (
                  <p style={styles.errorMessage}>请输入有效内容</p>
                )}
              </div>
              <div style={styles.dialogFooter}>
                <button
                  type="button"
                  style={{
                    ...styles.secondaryButton,
                    ...(isHovered.secondaryButton && styles.secondaryButtonHover)
                  }}
                  onClick={() => closeDialog('cancel')}
                  onMouseEnter={() => handleMouseEnter('secondaryButton')}
                  onMouseLeave={() => handleMouseLeave('secondaryButton')}
                >
                  {cancelText}
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.primaryButton,
                    ...(isHovered.primaryButton && styles.primaryButtonHover)
                  }}
                  onMouseEnter={() => handleMouseEnter('primaryButton')}
                  onMouseLeave={() => handleMouseLeave('primaryButton')}
                >
                  {confirmText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputDialog;