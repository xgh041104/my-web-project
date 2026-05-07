import React from 'react';
import { Modal, Button, Image, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import ReactHlsPlayer from 'react-hls-player';

export default class FileViewCom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fileName: '',
            fileType: '',
            filePath: '',
            showModal: false, //除了pdf外，用Modal控制显示隐藏
        }
    }

    setFile(name, type, path) {
        this.setState({
            fileName: name,
            fileType: type,
            filePath: path,
            showModal: true, //除了pdf外，用Modal控制显示隐藏
        });
    }

    render() {
        let resultCom = null;
        let isIframe = false;
        switch (this.state.fileType) {
            case 'png':
            case 'jpeg':
            case 'jpg': {
                resultCom = <Image src={this.state.filePath} />
                break;
            }
            case 'mp4':
            case 'avi':
            case 'mkv': {
                resultCom = <video src={this.state.filePath} controls width={'77vw'} height={'70vh'} />
                isIframe = true;
                break;
            }
            case 'm3u8': {
                resultCom = < ReactHlsPlayer
                    src={this.state.filePath}
                    autoPlay={false}
                    controls={true}
                    width="100%"
                    height="auto"
                />
                break;
            }
            case 'mp3':
            case 'wav':
            case 'ogg': {
                resultCom = <audio src={this.state.filePath} controls />
                break;
            }
            case 'pdf': {
                resultCom = <iframe
                    src={this.state.filePath}
                    style={{
                        width: "77vw", height: "70vh",
                    }}
                ></iframe>;
                isIframe = true;
                break;
            }
            case 'txt':
            case 'xml':
            case 'json': {
                resultCom = <iframe
                    src={this.state.filePath}
                    style={{
                        width: "77vw", height: "70vh",
                    }}
                ></iframe>;
                isIframe = true;
                break;
            }
            case 'doc':
            case 'docx':
            case 'xls':
            case 'xlsx':
            case 'ppt':
            case 'pptx': {
                //用请求的方式，确认office对应转换的pdf是否存在
                const officeType = this.state.filePath.split('.').pop();
                const urlPDF = this.state.filePath.replace('.' + officeType, '.pdf');
                const xhr = new XMLHttpRequest();
                try {
                    xhr.open('HEAD', urlPDF, false);
                    xhr.send();
                } catch {

                }
                if (xhr.status == "404") {
                    //无转换的pdf存在，正常的office文档，使用微软官方在线预览页面，跳转显示
                    const url = 'https://view.officeapps.live.com/op/view.aspx?src=' + this.state.filePath;
                    const w = window.open('about:blank');
                    w.location.href = url;
                    return <div></div>; //直接返回，即不渲染Modal
                } else {
                    //存在PDF，则显示pdf
                    resultCom = <iframe
                        src={urlPDF}
                        style={{
                            width: "77vw", height: "70vh",
                        }}
                    ></iframe>;
                    isIframe = true;
                    break;
                }
            }
            default: {
                if (this.state.fileType) {
                    message.error('该文件不支持查看，请联系管理员！');
                }
                return <div></div>;
            }
        }

        return <div>
            <Modal
                title={"附件预览  文件名：" + this.state.fileName}
                open={this.state.showModal}
                onCancel={() => this.setState({ showModal: false })}
                onOk={() => this.setState({ showModal: false })}
                destroyOnClose={true}
                { //如为pdf或其他用iframe加载的文件，则需要设置Modal样式
                ...(isIframe) && ({
                    width: '80vw',
                    height: '80vh',
                })
                }
            >
                {resultCom}
            </Modal>
        </div >
    }
}