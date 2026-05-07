import React from 'react';
import { ProCard } from '@ant-design/pro-components';
import UnityWebGLCom from 'components/unityWebGL';  //最新版
import UnityWebGL18_19 from './18-19'; //7.xx版
import { filePrefix } from 'urlList';
import { connect } from 'dva';
import { history } from 'umi';

// @connect(({ questionsModel }) => ({ paramas: questionsModel.paramas, type: questionsModel.operateType }))
export default class OperateQuestion extends React.Component {
    constructor(props){
        super(props)
        this.commitQuestion = this.commitQuestion.bind(this);
    }

    commitQuestion(msg){
        console.log('commitQuestion');
        this.props.questionFinished(msg||null);
        // history.go(-1);
    }

    render() {
        let value = '';
        let name = '';
        if (this.props.paramas.type == 0) { //unity
            name = this.props.paramas.urlUnity.split('/').pop();
            value = filePrefix() + this.props.paramas.urlUnity + "/Build/";
            return <UnityWebGL18_19 urlPrefix={value} urlName={name} onFinished={this.commitQuestion} needButton={this.props.paramas.needButton}/>
        }
        if (this.props.paramas.type == 1) { // 钢琴练习
            // return <PianoPractice scoreFileUrl={this.props.paramas.scoreFileUrl} onFinished={this.commitQuestion} />
            return <div>
                <Empty description="没有此类型的操作题" />
                <Button onClick={this.commitQuestion}>返回题目列表</Button>
            </div>
        }
        return <div>
            <Empty description="没有此类型的操作题" />
            <Button onClick={this.commitQuestion}>返回题目列表</Button>
        </div>
    }
}