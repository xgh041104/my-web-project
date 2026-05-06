import React, { useState } from 'react';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';

export default function MarkDownEditor({ onFileUpload, value, onChange }) {
    const handleImageUpload = (files, callback) => {
        if (onFileUpload) {
            onFileUpload(files).then(url => {
                console.log("上传成功:", url);
                callback([{ url: url }]);
            }).catch(error => {
                console.error("上传错误:", error);
            });
        } else {
            console.error("未定义文件上传函数");
        }
    };

    return (
        <div>
            <MdEditor
                previewTheme='cyanosis'
                modelValue={value}
                onChange={onChange}
                autoDetectCode={true}
                theme='light'
                onUploadImg={handleImageUpload}
            />
        </div>
    );
}
