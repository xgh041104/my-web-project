import React from 'react';
import Unity, { UnityContent } from 'react-unity-webgl'; //7.x.x版本写法
import { baseUrl } from 'urlList'


export class UnityWebGL18_19 extends React.Component {
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
        if (this.props.onFinished) {
            window.onQuestionFinished = this.questionFinish.bind(this);
            window.onStepRecord = this.stepRecord.bind(this);
            window.onUnityWebReady = this.loadReady.bind(this);
        }

        // this.unityContent.on("progress", (progression) => {
        //     this.setState({ progression: progression })
        //     console.log("加载进度：", progression);
        // })
        this.unityContent.on("loaded", () => {
            this.setState({ isLoaded: true })
            // console.log("unity loaded");
        })
        this.unityContent.on("error", (error) => {
            console.log("unity error:", error);
        })
    }

    questionFinish(score) {
        this.props.onFinished({ steps: this.state?.steps || null, score })
    }

    loadReady() {
        this.unityContent.send("MessageControl", "GetTime", "-1")
    }

    stepRecord(msg) {
        console.log('set step state:', msg);

        this.setState({ steps: msg })
    }

    render() {
        return <>
            {/* {this.props.needButton && <div style={{ textAlign: 'center', background: "black", height: '.5rem', width: '100vw' }}>
                <Button style={{ width: '2rem' }} onClick={this.questionFinish}>完成练习</Button>
            </div>}
            <div style={{ height: '100vh', width: '132vh' }}>
                <Unity unityContent={this.unityContent} ></Unity>
            </div> */}
            <div className='unity-frame'>
                {!this.state.isLoaded ? <img width={'100%'} src={baseUrl + "/image/UnityLoading/loading.png"}></img> : ""}
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
    window.onQuestionFinished(msg);
}
window.istrue = (stepMsg) => {
    console.log("recv step msg:", stepMsg);
    window.onStepRecord(stepMsg)
}
window.ready = () => {
    console.log("unity web load ready");
    window.onUnityWebReady()
}


export default UnityWebGL18_19;