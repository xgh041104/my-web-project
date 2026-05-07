import React from 'react';
import Unity, { UnityContent } from 'react-unity-webgl'; //7.x.x版本写法
import { connect } from 'umi';
import './18-19.css'
import { baseUrl } from 'urlList';
import { message } from 'antd';

export class UnityWebGL18_19 extends React.Component {

    static isUnityWebFinished = false;
    constructor(props) {
        super(props);
        // console.log("UnityWebGL18_19:", props.urlPrefix, props.urlName);
        this.state = {
            steps: "",
            isLoaded: false,
            progression: 0.00,
        }
        
        this.unityContent = new UnityContent(
            this.props.urlPrefix + this.props.urlName + ".json",
            this.props.urlPrefix + "UnityLoader.js"
        );
        if (this.props.onFinished) {// 判断是否有finished回调
            window.onQuestionFinished = this.questionFinish.bind(this);
            window.onStepRecord = this.stepRecord.bind(this);
            window.onUnityWebReady = this.loadReady.bind(this);
            UnityWebGL18_19.isUnityWebFinished = false;
        }

        // this.unityContent.on("progress", (progression) => {
        //     this.setState({ progression: progression })
        //     console.log("加载进度：", progression);
        // })
        this.unityContent.on("loaded", () => {
            this.setState({ isLoaded: true })
            // console.log("unity loaded");
        });
        this.unityContent.on("error", (error) => {
            console.log("unity error:", error);
        });
        this.unityContent.on("unloaded", () => {
            console.log("unity unloaded");
            isUnityWebFinished = true;
        })
    }


    componentWillUnmount() {
        window.onQuestionFinished = null;
        window.onStepRecord = null;
        window.onUnityWebReady = null;
        this.unityContent.remove();
        this.unityContent = null;
    }

    loadReady() {
        this.props.dispatch({
            type: "user/querySystemTime", callback: (res) => {
                // console.log("get sever time", res.toString())
                this.unityContent.send("MessageControl", "GetTime", res.toISOString())
            }
        })
    }


    questionFinish = (score) => {
        this.props.onFinished({ steps: this.state.steps, score })
    }

    stepRecord(msg) {
        console.log('set step state:', msg);

        this.setState({ steps: msg })
    }

    render() {
        return <>
            {/* {this.props.needButton && 
             <Button className='unityexitbutton' style={{ display:'inline',position:'absolute',zIndex:'99999',
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        }} onClick={this.questionFinish}>结束练习</Button>  
            } */}
            <div className='unity-frame'>
                {!this.state.isLoaded ? <img width={'100%'}  src={baseUrl + "/image/UnityLoading/loading.png"}></img> : ""}
                <div className='unity-container'>
                    <Unity style={{ display: this.state.isLoaded ? "block" : "none" }} unityContent={this.unityContent} >        </Unity>
                </div>
            </div>
            <style>
                {`
                .ant-message{
                    display: ${!this.unityContent ? "block" : "none"} !important;
                }
                `}
            </style>
        </>;
    }
}


window.btnExmaSumit1_onclick = (msg) => {
    console.log("recv unity msg", msg);
    if(UnityWebGL18_19.isUnityWebFinished){
        message.warn("练习已结束！");
        return
    }
    window.onQuestionFinished(msg);
}
window.istrue = (stepMsg) => {
    console.log("recv step msg:", stepMsg);
    if(UnityWebGL18_19.isUnityWebFinished){
        message.warn("练习已结束！");
        return
    }
    window.onStepRecord(stepMsg)
}
window.ready = () => {
    console.log("unity web load ready");
    window.onUnityWebReady()
}


export default connect(({ location }) => ({ location }))(UnityWebGL18_19);