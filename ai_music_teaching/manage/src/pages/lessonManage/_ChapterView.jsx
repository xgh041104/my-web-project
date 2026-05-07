import { Modal, Row, Col, List, Button, Empty } from 'antd';
import React, { useRef } from 'react';
import ReactHlsPlayer from 'react-hls-player';
import { filePrefix } from 'urlList';
import { QuillEditor } from 'components/quilleditor';
import FileViewCom from 'components/fileview';
import "./_ChapterView.css"

export default function ChapterView({ chapterInfo, setViewChapterInfo }) {
    if (!chapterInfo) {
        return null;
    }

    const fileViewRef = useRef();
    const downloadAttachFile = (file) => {
        // console.log('will download file', file, filePrefix() + file.FilePath);
        const fileName = file.FileName.split('.')[0];
        const fileType = file.FilePath.split('.').pop();
        fileViewRef.current?.setFile(fileName, fileType, filePrefix() + file.FilePath);
    }
    // console.log('设置章节内容', JSON.stringify(chapterInfo));



    let chapterContent = null;


    if (chapterInfo.ChapterType == "0") {
        if (!chapterInfo.ChapterContent || chapterInfo.ChapterContent == "") {
            chapterContent = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        }
        else {
            chapterContent = <QuillEditor
                readOnly theme="bubble" value={chapterInfo.ChapterContent} style={{ maxHeight: "65vh", overflow: "auto" }} />
        }
    }
    else if (chapterInfo.ChapterType == "1") {
        //获取最后一个.的位置
        const index = chapterInfo.ChapterContent.lastIndexOf(".");
        if (index == -1) {
            chapterContent = <div style={{ color: "red" }}><i>*文件正在审核中*</i></div>
        }
        else {
            //获取后缀
            const ext = chapterInfo.ChapterContent.substr(index + 1);
            if (!ext || ext !== "m3u8") {
                chapterContent = <div style={{ color: "red" }}><i>*文件正在审核中*</i></div>
            }
            else {
                chapterContent = < ReactHlsPlayer
                    src={filePrefix() + chapterInfo.ChapterContent}
                    autoPlay={false}
                    controls={true}
                    width="100%"
                    height="auto"
                />
            }
        }
    }


    return <Modal
        width="60vw"
        open={true}
        onCancel={() => setViewChapterInfo(null)}
        footer={null}
    >
        <FileViewCom ref={fileViewRef} />
        <p />
        <Row>
            <Col span={4}>章节名称：</Col> <Col span={1} /> <Col span={6} style={{ fontWeight: "bold" }}>{chapterInfo.ChapterName}</Col>
            <Col span={2} />
            <Col span={4}>章节类型：</Col> <Col span={1} /> <Col span={6} style={{ fontWeight: "bold" }}>{{ "0": "图文课", "1": "视频课" }[chapterInfo.ChapterType]}</Col>
        </Row>
        <p />
        <div>章节类容：</div>{chapterContent}
        {/* /* 20241218附件功能功能需要重新讨论定义，暂时屏蔽
        <List size='small'
            header={<div>附件列表：</div>}
            dataSource={chapterInfo.FileInfo || []}
            renderItem={file =>

                <List.Item>
                    <Button type='link' onClick={() => {
                        // TODO: 附件预览
                        downloadAttachFile(file)
                    }}>
                        {file.FileName}
                    </Button>
                </List.Item>}
        /> */}
    </Modal>
}
