import React from 'react';
import { Button, Space, Upload, Divider, message } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { ImportOutlined } from '@ant-design/icons';
import { connect } from 'dva';

@connect(({ dispatch, organizationInfo }) => ({ dispatch, errorImages: organizationInfo.errorImages }))
export default class StudentImageImport extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            checkedFileList: []
        }
        this.validSelectedImg = this.validSelectedImg.bind(this);
    }

    // 判断上传的照片是否重名
    validSelectedImg(file, fileList) {
        if (this.state.checkedFileList.some((item) => item.name === file.name)) {
            message.warning('请不要上传重复的照片！');
            return false;
        }
        this.setState({ checkedFileList: [...this.state.checkedFileList, file] });
        return false;
    }

    render() {
        return <div>
            <ProCard headerBordered
                title={<h2>学生照片导入</h2>}
                tooltip={'学生照片需以身份证号、学号、考号命名，后台根据编号自动匹配。如不能匹配，则需要检查学生对应的编号是否正确！'}
            >
                <ProCard colSpan={'50%'} title='选择文件'>
                    <Space size={'large'} align={'start'}>
                        <Upload
                            onRemove={(file) => {
                                this.setState({
                                    checkedFileList: this.state.checkedFileList.filter((item) => item.uid !== file.uid)
                                })
                            }}
                            beforeUpload={this.validSelectedImg}
                            fileList={this.state.checkedFileList}
                            accept={".png, .jpg, .jpeg"}
                            multiple
                        >
                            <Button type='primary'>选择照片文件（可多选）</Button>
                        </Upload>
                        <Button type='primary' danger
                            onClick={() => {
                                if (this.state.checkedFileList.length == 0) {
                                    message.info('未选择照片，无法导入！');
                                    return;
                                }
                                this.props.dispatch({
                                    type: 'organizationInfo/importStudentImages',
                                    payload: {
                                        fileData: this.state.checkedFileList,
                                    }
                                });
                            }}
                        >确认导入</Button>
                    </Space>
                </ProCard>
                <Divider type='vertical' style={{ minHeight: '70vh', height: 'auto' }} />
                <ProCard title='错误信息'>
                    {
                        this.props.errorImages?.map((item, index) => {
                            return <div key={'error' + index} style={{ color: 'gray' }}>失败文件{index + 1}：{item + " -- "}导入时无法找到对应编号的学生！</div>
                        })
                    }
                </ProCard>
            </ProCard>
        </div>
    }
}