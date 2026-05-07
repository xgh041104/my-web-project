import React from 'react';
import { Row, Col, Radio, Checkbox, Space, Tooltip, Input, Button } from 'antd';
import { FileImageOutlined, FilePdfOutlined, FileExcelOutlined, FileWordOutlined, PlaySquareOutlined, FileExclamationOutlined } from '@ant-design/icons';
import FileViewCom from 'components/fileview';
import { filePrefix } from 'urlList';
import OperateQuestion from 'components/unityWebGL/_operate'
//props说明
//detail: object，题目的原始数据，直接传入题目数据详情，即可根据数据显示5种题目
//questionId、index: Id用于记录和使用，index用于显示题号，即可以用于单题显示，也可用于试卷连续显示
//showAnswer: bool，detail中有正确答案，showAnswer=true，则可显示正确答案，及可进行新答题的答案对比
//noCheckAnswer: bool，true则表示仅显示正确答案，不做检查对比答案操作，与showAnswer配合使用
//showScore: bool，是否显示detail中的分数，单题预览时不用显示分数，试卷预览或考试详情查询需要显示该题的设置分数
//returnResult(): 传递答题答案、Id、及正确与否数据出去的回调函数，设置了则可传递，未设置则不会给外部传答题数据
//extraAnswer: object，当需要显示以往的答题答案时，则需要设置该参数。如回看考试详情，查看错题集时，都需要看到以前的答题数据。与后台的AnswerSheetarr、answerSteps字段相关

//抽象的题目显示组件，可适应显示几个题型、附件、答案显示与判断等功能
export default class QuestionsCom extends React.Component {
    //props: detail questionId  index, showAnswer，noCheckAnswer, showScore, returnResult(), extraAnswer
    constructor(props) {
        super(props);
        this.state = {
            currentAnswer: null, //记录当前答题答案
            setEmpty: false, //用于切换题目显示时，重复刷新一下，将相同种类的选项置空，避免带着有前面输入的答案
            // 操作题参数 {urlPrefix: "",urlName: ""}
            operatorParam: null,
        };
        this.backupId = props.questionId;//与setEmpty 配合使用
        this.fileViewRef = React.createRef();
    }

    componentDidUpdate() {
        //在didupdate中，判断是否切换了题目显示，切换后，先将选项种类置空，再将value 属性置空取消
        if (this.backupId != this.props.questionId && this.state.setEmpty == false) {
            this.backupId = this.props.questionId;
            this.setState({
                setEmpty: true,
            });
        } else if (this.state.setEmpty) {
            this.setState({
                setEmpty: false,
            });
        }
    }

    //根据题目内容不同，显示不同的content组件
    //TODO： 显示答案后，如何控制disable
    contentCom(options, questionType, fileInfos, questionCategory) {
        if (questionType == 1) {    //单选题
            return <Radio.Group disabled={this.props.showAnswer} {...(this.state.setEmpty) && { value: '' }}
                key={this.props.index + "qRgroup"}
                onChange={(e) => {
                    this.setState({
                        currentAnswer: e.target.value,
                    })
                }}>
                <Space direction="vertical">
                    {
                        options?.map((item, index) => {
                            return <Radio key={this.props.index + "qradio" + index} value={index}>{item}</Radio>
                        })
                    }
                </Space>
            </Radio.Group>
        } else if (questionType == 2) {//多选题
            return <Checkbox.Group disabled={this.props.showAnswer} {...(this.state.setEmpty) && { value: '' }}
                key={this.props.index + "qCgroup"}
                onChange={(checkedValues) => {
                    this.setState({
                        currentAnswer: checkedValues,
                    });
                }}>
                <Space direction='vertical'>
                    {
                        options?.map((item, index) => {
                            return <Checkbox key={this.props.index + "qcheck" + index} value={index}>{item}</Checkbox>
                        })
                    }
                </Space>
            </Checkbox.Group>
        } else if (questionType == 3) {//判断题
            return <Radio.Group disabled={this.props.showAnswer} {...(this.state.setEmpty) && { value: '' }}
                key={this.props.index + "qPgroup"}
                onChange={(e) => {
                    this.setState({
                        currentAnswer: e.target.value,
                    });
                }}>
                <Space direction='vertical'>
                    <Radio value={1}>正确</Radio>
                    <Radio value={0}>错误</Radio>
                </Space>
            </Radio.Group>
        } else if (questionType == 4) {//填空题
            return (
                <Space direction='vertical'>
                    {
                        options?.map((item, index) => {
                            return <Row key={this.props.index + "qinput" + index}>
                                <Col>第{index + 1}个空：</Col>
                                <Col>
                                    <Input disabled={this.props.showAnswer} placeholder={"请输入第" + String(index + 1) + "个空的答案"}
                                        {...(this.state.setEmpty) && { value: '' }}
                                        onChange={e => {
                                            const answers = this.state.currentAnswer;
                                            let tempObj = answers;
                                            if (!answers || answers instanceof Array || typeof (answers) !== "object") {
                                                tempObj = {};
                                            }
                                            tempObj[String(index)] = e.target.value;
                                            this.setState({
                                                currentAnswer: tempObj,
                                            })
                                        }}
                                    />
                                </Col>
                            </Row>
                        })
                    }
                </Space>
            );
        }
    }

    previewFile(info) {
        console.log("预览文件：", info);
        //TODO：点击附件ICON，打开预览附件
        const fileName = info.FileName.split('.')[0];
        const fileType = info.FilePath.split('.').pop();
        this.fileViewRef.current?.setFile(fileName, fileType, filePrefix() + info.FilePath);
    }

    //根据附件文件类型，生成对应的ICON，点击事件都一样
    getFileIconCom(info, index) {
        let icon;
        if (info.FileType.indexOf('pdf') != -1) {
            icon = <FilePdfOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        } else if (info.FileType.indexOf('xls') != -1) {
            icon = <FileExcelOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        } else if (info.FileType.indexOf('doc') != -1) {
            icon = <FileWordOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        } else if (info.FileType.indexOf('png') != -1 || info.FileType.indexOf('jpg') != -1) {
            icon = <FileImageOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        } else if (info.FileType.indexOf('mp3') != -1 || info.FileType.indexOf('wav') != -1) {
            icon = <PlaySquareOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        } else if (info.FileType.indexOf('mp4') != -1 || info.FileType.indexOf('m3u8') != -1) {
            icon = <PlaySquareOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        } else {
            //如果不是上述文件后缀，则用一个通用ICON
            icon = <FileExclamationOutlined style={{ color: 'red' }} onClick={() => this.previewFile(info)} />;
        }
        return (
            <Tooltip key={String(this.props.index) + String(index) + info.FileName} title={info.FileName}>
                {icon}
            </Tooltip>
        )
    }

    //根据答案类型，生成对应的组件
    getAnswerCom = (options, answers, questionType) => {
        if (questionType == 1) {
            return <Col>
                {options[Number(answers)]}
            </Col>
        } else if (questionType == 2) {
            return (
                answers?.map((item, index) => {
                    return <Space key={this.props.index + "answer" + index}>
                        <Col key={this.props.index + "qa" + String(index)}>答案{index + 1}：{options[item]}</Col>
                        <Col key={this.props.index + "qs" + String(index)} span={1}> </Col>
                    </Space>
                })
            )
        } else if (questionType == 3) {
            return (
                <Col>{(answers == "1") ? ("正确") : ("错误")}</Col>
            )
        } else if (questionType == 4) {
            return (
                answers?.map((item, index) => {
                    return <Space key={this.props.index + "answer" + index}>
                        <Col key={this.props.index + "qa" + String(index)}>答案{index + 1}：{item}</Col>
                        <Col key={this.props.index + "qs" + String(index)} span={1}> </Col>
                    </Space>
                })
            )
        } else if (questionType == 5) {
            if (answers.hasOwnProperty('score') && answers.hasOwnProperty('steps')) {
                return <Col>上次实操得分：{answers.score}分</Col>
            }
            return <Col>实操题无标准答案</Col>
        }
        else if (questionType == 6) {
            return <p><br />参考代码：<br />{answers}</p>
        }
        else if (questionType == 7) {
            return <p><br />参考代码：<br />{answers}</p>
        }
        else if (questionType == 8) {
            return <p><br />参考代码：<br />{answers}</p>
        }
    }

    //检查答案是否正确，即答案与正确答案的对比
    checkAnswer(answer, questionType) {
        let result = false;
        let answerTemp = '';
        if (questionType == 1) {
            result = (Number(answer) == this.state.currentAnswer);
            answerTemp = String(this.state.currentAnswer);
        } else if (questionType == 2) {
            if (answer.length != this.state.currentAnswer?.length) {
                result = false;
            } else {
                let temp = true;
                answer.forEach(item => {
                    if (this.state.currentAnswer?.indexOf(item) == -1) {
                        temp = false;
                    }
                });
                result = temp;
            }
            answerTemp = this.state.currentAnswer;
        } else if (questionType == 3) {
            result = (Number(answer) == this.state.currentAnswer);
            answerTemp = String(this.state.currentAnswer);
        } else if (questionType == 4) {
            let temp = true;
            answer.forEach((item, index) => {
                const label = String(index);
                if (!this.state.currentAnswer || !this.state.currentAnswer[label] || item !== this.state.currentAnswer[label]) {
                    temp = false;
                }
            });
            result = temp;
            answerTemp = Object.values((this.state.currentAnswer) ? (this.state.currentAnswer) : ({}));
        } else if (questionType == 5) {
            console.log('operate score:', this.state.currentAnswer.score,
                "steps:", this.state.currentAnswer.steps);
            if (this.state.currentAnswer.score >= 60) {
                result = true;
            }
            answerTemp = this.state.currentAnswer;
        }
        else if (questionType == 6) {
            result = true;
            answerTemp = answer;
        }
        //检查完答案，可告知父组件，对应题目ID的对错情况
        if (this.props.returnResult) {
            this.props.returnResult(this.props.questionId, result, answerTemp);
        }
        return result;
    }

    render() {
        const data = this.props.detail;
        if (!data || Object.keys(data).length == 0) { //如果detail为空，则无需显示任何东西
            return <div></div>
        }
        let options = [];
        let answer = [];
        if (data.QuestionType) {
            options = JSON.parse((data.QuestionContent == "" || !data.QuestionContent) ? ("\"\"") : (data.QuestionContent));
            answer = JSON.parse((data.Answer == "" || !data.Answer) ? ("[]") : (data.Answer));
        }
        if (data.QuestionType == 4) {  //如果是填空题，由于content为空，则利用答案的数量去创建content
            options = answer;
        }
        if (data.QuestionType != 5 && typeof (options) !== "object") {
            options = [];
        }
        if (data.QuestionType == 6) {
            answer = data.Answer;
        }


        let extraAnswerValue;
        if (this.props.hasOwnProperty('extraAnswer') && Object.keys(this.props.extraAnswer).length != 0) {
            extraAnswerValue = JSON.parse((this.props.extraAnswer.AnswerSteps == "" || !this.props.extraAnswer.AnswerSteps) ? ("[]") : (this.props.extraAnswer.AnswerSteps));
        }

        return (data.QuestionType && <div key={"question" + String(this.props.index)}>
            <div style={{ display: this.state.operatorParam ? "block" : "none", position: 'fixed', top: "0", left: "0", width: "100vw", height: "100wh", zIndex: 999 }}>
                {this.state.operatorParam && <OperateQuestion
                    paramas={this.state.operatorParam} type={0}
                    questionFinished={(msg) => this.setState({ ...this.state, operatorParam: null, currentAnswer: msg })} />}
            </div>
            <FileViewCom ref={this.fileViewRef} />
            <Row>
                <Space>
                    <Col >第 {this.props.index + 1} 题：</Col>
                    <Col >{data.QuestionName}</Col>
                    { //根据showScore变量控制是否显示题目分数
                        (this.props.showScore) && (<Col >{"(" + String(data.QuestionScore) + "分)"}</Col>)
                    }
                    <Col>
                        <Space>
                            {(data.QuestionType != 5) &&
                                (data.FileInfo?.map((item, index) => {
                                    return (
                                        this.getFileIconCom(item, index)
                                    );
                                }))
                            }
                        </Space>
                    </Col>
                </Space>
            </Row>
            <br />
            <div>
                {this.contentCom(options, data.QuestionType, data.FileInfo, data.QuestionCategory)}
            </div>
            {//根据showAnswer决定是否显示该题的答案，默认情况下答案及答题正确与否会同时显示
                (this.props.showAnswer) && (
                    <div>
                        <br />
                        {//根据noCheckAnswer决定答题正确与否会同时显示
                            (!this.props.noCheckAnswer) && (
                                <Row style={{ color: 'red' }}>
                                    <Col>答案：</Col>
                                    <Col>{(this.checkAnswer(answer, data.QuestionType)) ? ("答对√") : ("答错×")}</Col>
                                    {(data.QuestionType == 5) && <Col>实操评分：{this.state.currentAnswer.score}/100</Col>}
                                </Row>
                            )
                        }
                        <Row>
                            <Col>正确答案：</Col>
                            {this.getAnswerCom(options, answer, data.QuestionType)}
                        </Row>
                    </div>
                )
            }
            { //判断是否有外部答案需要显示
                (this.props.hasOwnProperty('extraAnswer') && (Object.keys(this.props.extraAnswer).length != 0)) && (
                    <div>
                        <Row><Space >
                            <Col>答题答案：</Col>
                            {
                                this.getAnswerCom(
                                    (data.QuestionType == 4) ? (extraAnswerValue) : (options),
                                    extraAnswerValue,
                                    data.QuestionType
                                )
                            }
                        </Space></Row>
                        <Row><Space size={'large'}>
                            <Col>答题：{(this.props.extraAnswer.IsTrue) ? ("正确") : (<span style={{ color: 'red' }}>错误</span>)}</Col>
                            <Col>得分：{(this.props.extraAnswer.IsTrue) ? (this.props.extraAnswer.AnswerScore) : (0)}</Col>
                        </Space></Row>
                    </div>
                )
            }
        </div>)
    }
}
