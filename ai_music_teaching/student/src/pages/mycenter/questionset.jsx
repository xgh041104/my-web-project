import React, { Fragment } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Rate, Modal, Row, Col } from 'antd';
import QuestionsCom from '../questions/_questions';
import { connect } from 'dva';

@connect(({ dispatch, user }) => ({ dispatch, userInfo: user.userInfo }))
class PracticeModal extends React.Component {
    //props: title,isOpen,closeModal(),  questionDetail, wrongId, showWrongAnswer, wrongAnswer
    constructor(props) {
        super(props);
        this.state = {
            showAnswer: false,
        };
        this.questionRef = React.createRef();
        this.checkAnswerFlag = false; //用一个标志位记录重练正确与否
    }

    //结束练习，关闭窗口，处理练习数据
    endPractice = () => {
        this.props.closeModal();

        if (this.checkAnswerFlag) {
            Modal.confirm({
                content: '错题重练完成，是否删除该项错题？',
                okText: '删除',
                cancelText: '不删除',
                onOk: () => {
                    const data = {
                        userId: this.props.userInfo.userId,
                        questionId: [{ Id: this.props.wrongId }],
                    };
                    this.props.dispatch({ type: 'myCenter/removeWrongQuestion', payload: data });
                },
            });
        }

        this.setState({
            showAnswer: false,
        });
        this.checkAnswerFlag = false;
    }

    //题目组件内比对答案后，返回题目ID出来做记录，用于错题集归档的功能
    questionResult = (QuestionId, isCorrect, answer) => {
        if (isCorrect) {
            this.checkAnswerFlag = true;
        }
    }

    //根据答案类型，生成对应的组件
    getAnswerCom(options, answers, questionType) {
        if (questionType == 1) {
            return <Col>
                {options[Number(answers)]}
            </Col>
        } else if (questionType == 2) {
            return (
                answers?.map((item, index) => {
                    return <>
                        <Col key={"a" + String(index)}>答案{index + 1}：{options[item]}</Col>
                        <Col key={"s" + String(index)} span={1}> </Col>
                    </>
                })
            )
        } else if (questionType == 3) {
            return (
                <Col>{(answers == "1") ? ("正确") : ("错误")}</Col>
            )
        } else if (questionType == 4) {
            return (
                answers?.map((item, index) => {
                    return <Fragment key={index}>
                        <Col key={"a" + String(index)}>答案{index + 1}：{item}</Col>
                        <Col key={"s" + String(index)} span={1}> </Col>
                    </Fragment>
                })
            )
        } else if (questionType == 5) {
            if (answers.hasOwnProperty('score') && answers.hasOwnProperty('steps')) {
                return <Col>上次实操得分：{answers.score}分</Col>
            }
            return <Col>实操题无标准答案</Col>
        }
    }

    render() {
        let footerCom = [
            <Button key='check' type='primary' onClick={() => {
                this.setState({ showAnswer: true });
                this.questionRef?.current?.checkAnswer();
            }}>检查答案</Button>,
            <Button key='ok' type='danger' onClick={() => this.endPractice()}>结束练习</Button>,
        ];

        let content, w_answer, answer, questionType;
        if (this.props.showWrongAnswer) {
            content = JSON.parse(this.props.questionDetail.QuestionContent);
            w_answer = JSON.parse((this.props.wrongAnswer == "") ? ("[]") : (this.props.wrongAnswer));
            answer = JSON.parse((this.props.questionDetail.Answer == "") ? ("[]") : (this.props.questionDetail.Answer));
            questionType = this.props.questionDetail.QuestionType;
        }

        return (
            <Modal
                title={this.props.title ? (this.props.title) : ("练习窗口")}
                open={this.props.isOpen}
                maskClosable={(this.props.showWrongAnswer) ? (true) : (false)} closable={(this.props.showWrongAnswer) ? (true) : (false)} //centered
                width='60vw'
                footer={(!this.props.showWrongAnswer) && footerCom}
                destroyOnClose
                onCancel={() => {
                    this.props.closeModal();
                }}
            >
                <QuestionsCom ref={this.questionRef} detail={this.props.questionDetail} index={0} showAnswer={this.state.showAnswer} returnResult={this.questionResult} />
                <br />
                {
                    (this.props.showWrongAnswer) && (
                        <Space direction='vertical'>
                            <Row style={{ color: 'red' }}>
                                <Col>错题答题记录：</Col>
                                {this.getAnswerCom(content, w_answer, questionType)}
                            </Row>
                            <Row>
                                <Col>正确答案：</Col>
                                {this.getAnswerCom(content, answer, questionType)}
                            </Row>
                        </Space>
                    )
                }
            </Modal>
        );
    }
}

@connect(({ dispatch, myCenter, user }) => ({ dispatch, myCenter, user }))
export default class QuestionSet extends React.Component {

    constructor(props) {
        super(props);
        this.tableRef = React.createRef();
        this.state = {
            openPractice: false,
            practiceTitle: '练习窗口',
            questionDetail: {},
            wrongId: 0,
            showWrongAnswer: false,
            wrongAnswer: "",
        };
    }

    componentDidUpdate() {
        this.tableRef.current?.reload();
    }

    closePracticeModal = () => {
        this.setState({
            openPractice: false,
            showWrongAnswer: false,
        });
    }

    render() {
        const data = this.props.myCenter.questionList?.map(item => {
            return {
                ...item,
                ...item.QuestionViewEntity,
            }
        });
        return (<div>
            <PracticeModal
                title={this.state.practiceTitle}
                isOpen={this.state.openPractice}
                closeModal={this.closePracticeModal}
                questionDetail={this.state.questionDetail}
                wrongId={this.state.wrongId}
                showWrongAnswer={this.state.showWrongAnswer}
                wrongAnswer={this.state.wrongAnswer}
            />
            <ProTable
                actionRef={this.tableRef}
                headerTitle="错题集"
                rowKey={(record) => record.Id} //错题Id
                cardBordered
                pagination={{
                    defaultPageSize: 6,
                    showQuickJumper: true,
                }}
                columns={[
                    {
                        title: '题目ID',
                        dataIndex: 'QuestionId',
                        sorter: (a, b) => a.QuestionId - b.QuestionId,
                        search: false,
                        align: 'center'
                    },
                    {
                        title: '题干',
                        dataIndex: 'QuestionName',
                    },
                    {
                        //1：单选、2：多选、3：判断、4：填空、5：实操
                        title: '题目类型',
                        dataIndex: 'QuestionType',
                        // render: (value) => ["单选题", "多选题", "判断题", "填空题", "实操题"][value - 1]
                        valueEnum: {
                            1: "单选题",
                            2: "多选题",
                            3: "判断题",
                            4: "填空题",
                            5: "实操题",
                        }
                    },
                    {
                        title: '所属课程',
                        dataIndex: 'CourseName',
                    },
                    {
                        title: '所属专业',
                        dataIndex: 'MajorName',
                    },
                    {
                        title: '所属学院',
                        dataIndex: 'CollegeName',
                    },
                    {
                        key: "operation",
                        title: '操作',
                        render: (text, record, _, action) => [
                            <Popconfirm
                                key={"practice"}
                                title="确认开始练习？"
                                onConfirm={() => {
                                    this.setState({
                                        questionDetail: record.QuestionViewEntity,
                                        openPractice: true,
                                        practiceTitle: '错题重练',
                                        wrongId: record.Id,
                                    });
                                }}
                                okText="练习"
                                cancelText="取消"
                            >
                                <Button danger type='link'>重新练习</Button>
                            </Popconfirm>,
                            <Button key={'view'} type='link' onClick={() => {
                                this.setState({
                                    questionDetail: record.QuestionViewEntity,
                                    openPractice: true,
                                    practiceTitle: '错题重练',
                                    wrongId: record.Id,
                                    showWrongAnswer: true,
                                    wrongAnswer: record.AnswerSteps,
                                });
                            }}>查看</Button>
                        ],
                        search: false,
                        align: 'center',
                    }
                ]}
                request={(params, sort, filter) => {
                    return Promise.resolve({
                        data: () => {
                            return data?.filter((item) => {
                                let result = true;
                                if (params.QuestionName) {
                                    result = (result && item.QuestionName.indexOf(params.QuestionName) != -1);
                                }
                                if (params.QuestionType) {
                                    result = (result && item.QuestionType == params.QuestionType);
                                }
                                if (params.CourseName) {
                                    result = (result && item.CourseName.indexOf(params.CourseName) != -1);
                                }
                                if (params.MajorName) {
                                    result = (result && item.MajorName.indexOf(params.MajorName) != -1);
                                }
                                if (params.CollegeName) {
                                    result = (result && item.CollegeName.indexOf(params.CollegeName) != -1);
                                }
                                return result;
                            });
                        },
                        success: true,
                    });
                }}
            />
        </div>
        )
    }
}