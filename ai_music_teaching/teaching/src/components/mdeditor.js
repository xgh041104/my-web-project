import React from "react";
import MdEditor from "md-editor-rt";
import "md-editor-rt/lib/style.css";

export default function MarkDownEditor({ onFileUpload, value, onChange }) {
  const handleImageUpload = (files, callback) => {
    if (onFileUpload) {
      onFileUpload(files)
        .then((url) => {
          console.log("上传成功:", url);
          callback([{ url: url }]);
        })
        .catch((error) => {
          console.error("上传错误:", error);
        });
    } else {
      console.error("未定义文件上传函数");
    }
  };

  // 自动清理大模型流式输出或返回内容中包裹的 ```markdown ... ``` 标记，防止其渲染为黑底的单段代码块
  const cleanValue = React.useMemo(() => {
    if (!value) return "";
    let clean = value.trim();
    if (clean.startsWith("```markdown")) {
      clean = clean.substring("```markdown".length);
    } else if (clean.startsWith("```")) {
      clean = clean.substring("```".length);
    }
    if (clean.endsWith("```")) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }, [value]);

  return (
    <div style={{ height: "100%" }}>
      <MdEditor
        previewTheme="default"
        modelValue={cleanValue}
        onChange={onChange}
        autoDetectCode={true}
        theme="light"
        onUploadImg={handleImageUpload}
      />
    </div>
  );
}
