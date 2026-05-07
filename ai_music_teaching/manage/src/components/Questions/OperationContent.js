import React, { useState, useEffect } from 'react'
import { Upload, Button, Modal } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

// 实操题组件
export default function OperationContent({ value, onChange }) {

    const [uploadFileList, setUploadFileList] = useState([])

    useEffect(() => {
        if (!value || !value.Options|| !Array.isArray(value.Options) || value.Options.length < 1) {
            setUploadFileList([]);
            return;
        }
        if (JSON.stringify(value.Options) === JSON.stringify(uploadFileList)) {
            return;
        }
        setUploadFileList(value.Options);
    }, [value])

    const OnUploadChange = ({ file, fileList }) => {
        if (!file || !file.name || !['zip', 'rar', '7z', "xml", "musicxml"].includes(file.name.split('.').pop())) {
            Modal.error({ title: "只能上传 zip rar 7z xml musicxml格式的文件" });
            return;
        }
        setUploadFileList(fileList);
        onChange({ Options: fileList });
    }
    // TODO:上传文件进度条
    return <Upload accept='.zip,.rar,.7z,.xml,.musicxml' maxCount={1}
        beforeUpload={() => false}
        onChange={OnUploadChange} fileList={uploadFileList} >
        <Button icon={<UploadOutlined />}>上传操作文件</Button>
    </Upload >
}