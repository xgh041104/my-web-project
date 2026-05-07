import React, { useState, useRef, useImperativeHandle, useEffect } from 'react'
import { ProFormGroup, ProFormText, ProFormUploadButton, ProFormRadio, ProForm, ProFormItem } from '@ant-design/pro-components';
import { Button, Form, Modal, Upload, Spin, Progress } from 'antd';

import { QuillEditor, generateUUID } from 'components/quilleditor';
import { filePrefix } from 'urlList';

const FormItem = Form.Item;

function ChapterEditorModal(props, ref) {
  const { loading, dispatch, courseId } = props;
  const [modifyChapterInfo, setModifyChapterInfo] = useState(null);
  const [formRef] = ProForm.useForm();
  const chapterType = ProForm.useWatch('ChapterType', formRef);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ percent: -1, statusText: "上传进度", statusCode: 0 });

  const onfileUpload = (fileList) => {
    return new Promise((resolve, reject) => {
      dispatch({
        type: "lessonManage/uploadChapterContentFile",
        payload: { fileData: fileList },
        callback: result => {
          if (result.code === 0) {
            reject(result.msg);
          }
          else {
            resolve(filePrefix() + result.data);
          }
        }
      })
    })
  }

  const uploadCallback = res => {
    setUploadStatus(preUploadStatus => ({ ...preUploadStatus, ...res }));
    if (res.statusCode === 0) {
      console.log("进度条完成：", res.statusCode);
      setModifyChapterInfo(null);
      setIsOpen(false);
      formRef.resetFields();
    }
  }
  const onUploadProgress = ({ total, loaded }) => {
    console.log("upload progress", loaded);
    setUploadStatus((preUploadStatus) => ({ ...preUploadStatus, percent: Math.round((loaded / total) * 100) }));
  }
  const formFinished = values => {
    setUploadStatus(preUploadStatus => ({ ...preUploadStatus, statusCode: 1 }))
    if (modifyChapterInfo) {
      // 编辑课程
      console.log('视频课文件：', JSON.stringify(values.ChapterVideoContent),
        '附件文件列表:', JSON.stringify(values.FileInfo));
      // const intervalId = setInterval(() => {
      //   console.log('update percent', uploadStatus.percent);

      //   setUploadStatus(preUploadStatus => ({ 
      //     percent: (preUploadStatus.percent === -1 ? 0 : preUploadStatus.percent) + 30, 
      //     statusCode: preUploadStatus.percent>100?(clearInterval(intervalId),0):1 }));
      // }, 500);
      let RemoveFile = []
      let addNewFiles = []
      console.log("当前课件文件", JSON.stringify(modifyChapterInfo.FileInfo));
      if (!modifyChapterInfo.FileInfo || modifyChapterInfo.FileInfo.length === 0) {
        addNewFiles = values.FileInfo
      }
      else {
        RemoveFile = modifyChapterInfo.FileInfo.filter(
          originFile => values.FileInfo.every(file => originFile.uid !== file.uid)
        )

        addNewFiles = values.FileInfo.filter(
          file => file.originFileObj)
      }
      console.log("remove file:", RemoveFile, "new Files", addNewFiles);
      // debugger;
      let ChapterVideoContent = null;
      let isRMVideo = false;
      if (modifyChapterInfo.ChapterVideoContent &&
        (!values.ChapterVideoContent || values.ChapterVideoContent.length < 1)) {
        // 删除视频课视频
        isRMVideo = true;
      }
      // 新增
      else if ((values.ChapterVideoContent && values.ChapterVideoContent.length > 0)
        && (!modifyChapterInfo.ChapterVideoContent)) {
        ChapterVideoContent = values.ChapterVideoContent[0].originFileObj;
      }
      // 修改
      else if ((values.ChapterVideoContent && values.ChapterVideoContent.length > 0)
        && values.ChapterVideoContent[0].uid !== modifyChapterInfo.ChapterVideoContent.uid) {
        // 修改视频课视频
        isRMVideo = true;
        ChapterVideoContent = values.ChapterVideoContent[0].originFileObj;
      }
      dispatch({
        type: "lessonManage/modifyChapter", payload: {
          ...values,
          "Id": modifyChapterInfo.Id,
          "CourseId": courseId,
          RemoveFile: RemoveFile.map(file => file.uid),
          FileInfo: addNewFiles,
          ChapterVideoContent,
          isRMVideo,
          onUploadProgress
        },
        callback: uploadCallback
      })
    }
    else {
      // 新建课程
      dispatch({
        type: "lessonManage/createChapter", payload: {
          ...values,
          ChapterVideoContent: (values.ChapterVideoContent
            && values.ChapterVideoContent.length > 0
            && values.ChapterVideoContent[0].originFileObj)
            || null,
          "CourseId": courseId,
          onUploadProgress
        },
        callback: uploadCallback
      })
    }
    // ;
  }

  const openChapterEdit = chapterInfo => {
    // 生成已添加附件列表
    let attachedFileList = []
    if (chapterInfo.FileInfo && chapterInfo.FileInfo.length > 0) {
      attachedFileList = chapterInfo.FileInfo.map((file) => ({
        uid: file.Id,
        name: file.FileName,
        status: 'done',
        url: filePrefix() + file.FilePath,
      }))
    }
    // 生成已添加视频文件
    const uuid = generateUUID();
    let videoFile = null
    if (chapterInfo.ChapterType === "1" && chapterInfo.ChapterContent !== "") {
      // 视频课显示数据
      videoFile = {
        uid: uuid,
        name: chapterInfo.ChapterName + "视频资源",
        status: 'done',
        url: filePrefix() + chapterInfo.ChapterContent
      }
    }
    // 获取图文课资源
    let ChapterRichText = ""
    if (chapterInfo.ChapterType === "1") {
      ChapterRichText = chapterInfo.ChapterContent;
    }
    // 设置表单要编辑数据
    formRef.setFieldsValue({
      ChapterName: chapterInfo.ChapterName,
      ChapterType: chapterInfo.ChapterType,
      ChapterRichText: chapterInfo.ChapterType === "0" && chapterInfo.ChapterContent,
      ChapterVideoContent: videoFile && [videoFile],
      FileInfo: attachedFileList
    })
    // 记录编辑的初始数据并刷新Modal
    setModifyChapterInfo({
      ...chapterInfo,
      ChapterRichText: chapterInfo.ChapterType === "0" && chapterInfo.ChapterContent,
      ChapterVideoContent: videoFile || null,
      FileInfo: attachedFileList
    });
  }

  const handleCancel = () => {
    setModifyChapterInfo(null);
    formRef.resetFields();
    setIsOpen(false);
  }

  const controlUploadPercent = () => {
    if (uploadStatus.percent < 0) {
      return 0;
    }
    if (uploadStatus.percent > 100) {
      return 100;
    }
    return uploadStatus.percent;
  }

  useEffect(() => {
    console.log("chapter info change", modifyChapterInfo);
    setIsOpen(modifyChapterInfo !== null)

  }, [modifyChapterInfo])

  useImperativeHandle(
    ref,
    () => ({
      setIsOpen,
      openChapterEdit
    }),
    [],
  )

  // console.log("uploadStatus.statusCode", uploadStatus.statusCode);

  return <Modal width={"60vw"} title={modifyChapterInfo ? "修改章节信息" : "新建章节"}
    // ref={ref}
    open={isOpen}
    maskClosable={false}
    closable={false}
    onCancel={handleCancel}
    footer={[
      <Button key="back" onClick={handleCancel}
        loading={loading.effects['lessonManage/createChapter'] || loading.effects['lessonManage/modifyChapter']}
      > 取消 </Button>,
      <Button key="submit" type="primary" onClick={formRef.submit}
        loading={loading.effects['lessonManage/createChapter'] || loading.effects['lessonManage/modifyChapter']}
      > 提交 </Button>,
    ]}>
    <Spin spinning={uploadStatus.statusCode !== 0} indicator={
      <Progress style={{ position: 'absolute', left: '40%', top: '40%' }}
        size='large' type='circle' percent={controlUploadPercent()}
        format={(percent) => `${uploadStatus.statusText}:\n ${percent}%`}>
      </Progress>}>
      <Form
        form={formRef}
        onFinish={formFinished}
      // disabled
      >
        <ProFormGroup>
          <ProFormText width="md" name="ChapterName" label="章节名称" rules={[{ required: true, message: '请输入章节名称' }]} />
          <ProFormRadio.Group width={"md"} name={"ChapterType"} label="章节类型" initialValue={"0"} rules={[{ required: true, message: '请选择章节类型' }]}
            // onChange={selectChapterType}
            options={[{ label: "图文课", value: "0" }, { label: "视频课", value: "1" }]} />
        </ProFormGroup>
        <FormItem hidden={chapterType && chapterType !== "0"} name="ChapterRichText" label="章节内容"
          rules={[{ required: chapterType === "0" || !chapterType, message: '请添加章节内容' }]}
        >
          <QuillEditor
            onfileUpload={onfileUpload}
            placeholder="请输入"
          />
        </FormItem>
        <FormItem hidden={chapterType !== "1"} name="ChapterVideoContent" label="章节内容"
          rules={[{ required: chapterType === "1", message: '请添加章节内容' }]}
          valuePropName='fileList'
          getValueFromEvent={e => {
            if (Array.isArray(e)) {
              return e;
            }
            return e && e.fileList;
          }}>
          <Upload
            // {...uploadProps}
            beforeUpload={() => false}
            accept={".avi, .mp4, .mov, .wmv, .flv, .mkv, .mpg, .rmvb"}
            // onChange={onVideoFileChange}
            // fileList={modifyChapterInfo && modifyChapterInfo.videoFile && modifyChapterInfo.videoFile !== "" && [modifyChapterInfo.videoFile]}
            maxCount={1}>
            <Button>点击上传视频课 </Button>
          </Upload>
        </FormItem>

        {/* <div dangerouslySetInnerHTML={{ __html: item.value }}/> */}
        {/* 20241218附件功能功能需要重新讨论定义，暂时屏蔽
        <FormItem name={"FileInfo"} label={"附件"}
          valuePropName='fileList'
          getValueFromEvent={e => {
            if (Array.isArray(e)) {
              return e;
            }
            return e && e.fileList;
          }}>
          <Upload
            // TODO:视频文件上传后处理得要时间,需要判断审核中,不能删除
            // {...uploadProps} 
            beforeUpload={() => false}
            multiple
          // onChange={onAttachedFileChange}
          // fileList={modifyChapterInfo && modifyChapterInfo.attachedFileList}
          >
            <Button>点击上传附件 </Button>
          </Upload>
        </FormItem> */}
      </Form>
    </Spin>
  </Modal >
}


export default React.forwardRef(ChapterEditorModal)