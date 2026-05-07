import { Row, Col, List, Button, Empty, Space, Popconfirm } from 'antd';
import { ProCard, ModalForm, ProFormText } from '@ant-design/pro-components';
import { BackwardOutlined, UploadOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

import { hostAddr, filePrefix } from 'urlList';
import { QuillEditor } from 'components/quilleditor';
import FileViewCom from 'components/fileview';
import HlsPlayer from 'components/HlsPlayer';
import { connect } from 'dva';
import { history } from 'umi';

import "./_ChapterView.css"

const BackModal = ({ dispatch, lessonDetail, chapterDetail }) => {
    const [progress, setProgress] = useState(0);
    return (
        <ModalForm
            title='是否确定上传并返回？ 取消可继续学习'
            modalProps={{
                destroyOnClose: true
            }}
            trigger={
                <Button type='primary'><UploadOutlined />上传进度并退出</Button>
            }
            onFinish={() => {
                const data = {
                    ChapterId: chapterDetail.Id,
                    ChapterOrder: chapterDetail.ChapterOrder,
                    CourseId: chapterDetail.CourseId,
                };
                data.LearningRate = progress;

                if (data.LearningRate == 100 && chapterDetail.ChapterOrder == lessonDetail.ChapterSum - 1) {
                    data.IsComplete = 1;
                } else {
                    data.IsComplete = 0;
                }

                // console.log('studypage dispatch', data);

                dispatch({ type: 'lessonCenter/uploadStudyProgress', payload: data });
                history.push({ pathname: '/lesson/lessondetail', state: { CourseId: chapterDetail.CourseId } });
                currentProgress = 0;
                return true;
            }}
            onOpenChange={(value) => {
                setProgress(currentProgress);
            }}
        >
            <ProFormText label="当前章节" value={'第' + Number(chapterDetail?.ChapterOrder + 1) + '章节'} readonly />
            <ProFormText label="当前进度" value={String(progress) + '%'} readonly />
        </ModalForm>
    )
}

let currentProgress = 0; //currentProgress得放在外面供所有组件访问，防止使用state会触发重绘

@connect(({ dispatch, lessonCenter }) => ({ dispatch, lessonCenter }))
export default class LessonStudy extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            startPosition: 0,
            duration: -1,
            progressBackup: 0,
        };
        currentProgress = 0;
        this.scrollAttached = false;
        this.fileViewRef = React.createRef();

    }

    attachScrollHandle() {
        if (this.props.lessonCenter.chapterDetail.ChapterType == "0") {
            if (document.body.scrollHeight - (window.innerHeight || document.documentElement.clientHeight) > 10) {
                if (!this.scrollAttached) {
                    window.addEventListener('scroll', this.bindHandleScroll);
                    this.scrollAttached = true;
                }
            }
            else {
                // 没有滚动条
                // currentProgress = 100;
                // if(!this.clickedAttached){
                //     window.addEventListener('click', this.handleNoScroll);
                //     this.clickedAttached = true;
                // }
                currentProgress = 100;
            }
        }
    }

    componentDidMount() {
        // 5秒后再开始添加scrollbar检测,
        // 但若有网络延迟,或者比较大的图文加载可能会比5秒时间长,
        // TODO: 需要有更好的方式(时机)添加scrollbar检测
        this.attachTimerId = setTimeout(() => {
            if (!this.props.lessonCenter.chapterDetail.ChapterType) {
                return;
            }
            this.attachScrollHandle();
            clearInterval(this.attachTimerId);
            delete this.attachTimerId;
        }, 5000);

        // if (this.props.lessonCenter.chapterDetail.ChapterType == "0" && this.state.progressBackup == currentProgress) {
        //     const offset = parseInt(this.state.progressBackup * (document.documentElement.scrollHeight - document.documentElement.offsetHeight) / 100);
        //     window.scrollTo(0, offset);
        // }
    }

    componentDidUpdate() {
        if (this.props.lessonCenter.chapterDetail.ChapterType == "0" && this.state.progressBackup == currentProgress) {
            const offset = parseInt(this.state.progressBackup * (document.documentElement.scrollHeight - document.documentElement.offsetHeight) / 100);
            window.scrollTo(0, offset);
        }


    }

    componentWillUnmount() {
        if (this.props.lessonCenter.chapterDetail.ChapterType == "0") {
            if (this.scrollAttached) {
                window.removeEventListener('scroll', this.bindHandleScroll);
                this.scrollAttached = false;
            }
        }
    }

    bindHandleScroll = () => {
        // console.log('bindHandleScroll....', currentProgress);
        //只有图文课才需要算滚动条的进度
        if (!this.props.lessonCenter || !this.props.lessonCenter.chapterDetail) {
            return;
        }
        if (this.props.lessonCenter.chapterDetail.ChapterType != "0") {
            return;
        }
        const p = parseInt(window.scrollY * 100 / (document.documentElement.scrollHeight - document.documentElement.offsetHeight));
        if (p > currentProgress && p <= 100) {
            currentProgress = p;
        }
        // console.log('progress changed: ', currentProgress);
    }

    render() {
        if (this.props.lessonCenter.lessonDetail) {
            let progress = 0;
            //如果当前章节order与课程指示的order一致，则用课程详情的LearningRate；如果不一样，证明打开了下一个章节
            if (this.props.lessonCenter.lessonDetail.ChapterOrder == this.props.lessonCenter.chapterDetail.ChapterOrder) {
                progress = (this.props.lessonCenter.lessonDetail.LearningRate);
            }

            if (this.state.progressBackup != progress && progress >= 0 && progress <= 100) {
                this.setState({
                    progressBackup: progress,
                });
                currentProgress = progress;
            }
        }

        const chapterInfo = this.props.lessonCenter.chapterDetail;
        if (!chapterInfo) {
            console.log("学习页面，章节为空");
            return null;
        }

        let chapterContent = null;
        if (chapterInfo.ChapterType == "0") {
            if (!chapterInfo.ChapterContent || chapterInfo.ChapterContent == "") {
                chapterContent = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            }
            else {
                chapterContent = <QuillEditor
                    readOnly theme="bubble" value={chapterInfo.ChapterContent}
                    style={{
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                        userSelect: "none",
                        pointerEvents: "none"
                    }}
                />
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
                    chapterContent = < HlsPlayer
                        src={hostAddr + "/" + chapterInfo.ChapterContent}
                        autoPlay={false}
                        style={{
                            width: "100%",
                            maxHeight:"80vh"
                        }}
                        // hlsConfig={{
                        //      startPosition: this.state.startPosition,//设置开始时间
                        // }}
                        startPosition={this.state.startPosition}//设置开始时间
                        onPlaying={() => {
                            console.log('playing ');
                        }}
                        onLoadedData={(event) => {
                            if (this.state.progressBackup > 0 && this.state.startPosition == 0) {
                                const duration = event.target.duration;
                                const position = this.state.progressBackup * duration / 100;
                                this.setState({
                                    startPosition: position,
                                    duration: duration,
                                })
                            }
                        }}
                        onTimeUpdate={(event) => {
                            if (!this.props.lessonCenter || !this.props.lessonCenter.chapterDetail) {
                                return;
                            }
                            if (this.props.lessonCenter.chapterDetail.ChapterType != "1") {
                                return;
                            }
                            const p = parseInt(event.target.currentTime * 100 / event.target.duration);
                            if (p > currentProgress && p <= 100) {
                                currentProgress = p;
                            }
                        }}
                    />
                }
            }
        }

        return (
            <ProCard
                split='horizontal'
                title={(<Space direction='horizontal'>
                    <Popconfirm
                        title="是否确定直接返回课程详情页？"
                        onConfirm={() => {
                            history.push({ pathname: '/lesson/lessondetail', state: { CourseId: this.props.lessonCenter.chapterDetail.CourseId } });
                        }}
                    >
                        <Button type='primary'><BackwardOutlined />返回课程页</Button>
                    </Popconfirm>
                    <BackModal dispatch={this.props.dispatch} lessonDetail={this.props.lessonCenter.lessonDetail} chapterDetail={this.props.lessonCenter.chapterDetail} />
                </Space>
                )}
            >
                <ProCard>
                    <Row>
                        <Col span={4}>章节名称：</Col> <Col span={1} /> <Col span={6} style={{ fontWeight: "bold" }}>{chapterInfo.ChapterName}</Col>
                        <Col span={2} />
                        <Col span={4}>章节类型：</Col> <Col span={1} /> <Col span={6} style={{ fontWeight: "bold" }}>{{ "0": "图文课", "1": "视频课" }[chapterInfo.ChapterType]}</Col>
                    </Row>
                </ProCard>
                <ProCard >
                    <div>章节内容：</div>{chapterContent}
                </ProCard>
                {/* 20241218附件功能功能需要重新讨论定义，暂时屏蔽
                <ProCard title='附件列表'>
                    <List size='small'
                        dataSource={chapterInfo.FileInfo || []}
                        renderItem={file =>
                            <List.Item>
                                <Button type='link' onClick={() => {
                                    const fileName = file.FileName.split('.')[0];
                                    const fileType = file.FilePath.split('.').pop();
                                    this.fileViewRef.current?.setFile(fileName, fileType, filePrefix() + file.FilePath);
                                }}>
                                    {file.FileName}
                                </Button>
                            </List.Item>
                        }
                    />
                    <FileViewCom ref={this.fileViewRef} />
                </ProCard> */}
            </ProCard>
        )
    }
}
