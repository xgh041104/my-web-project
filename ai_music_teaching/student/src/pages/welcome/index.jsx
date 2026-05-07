
import { connect } from 'umi';
import React, { useEffect } from 'react'
import { message } from 'antd';
import { baseUrl } from 'urlList';

function Welcome({ firstEnter, dispatch }) {
    if (!firstEnter) {
        // history.push("/homepage")
        return <></>
    }

    // 进入全屏
    const playerFullscreen = (element) => {

        const reject = (e) => {
            console.log('无法全屏', e.message);
        }
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(reject)
        }
        else if (div.webkitRequestFullscreen) {
            element.webkitRequestFullscreen().catch(reject);
        }
        else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen().catch(reject);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen().catch(reject);
        } else if (element.oRequestFullscreen) {
            element.oRequestFullscreen().catch(reject);
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullScreen().catch(reject)
        } else {
            try {
                let docHtml = document.documentElement
                let docBody = document.body
                let videobox = document.getElementById('videobox')
                let cssText = 'width:100%;height:100%;overflow:hidden;'
                docHtml.style.cssText = cssText
                docBody.style.cssText = cssText
                videobox.style.cssText = cssText + ';' + 'margin:0px;padding:0px;'
                document.IsFullScreen = true
            } catch (e) {
                console.log('无法全屏', e.message);

            }
        }

    }

    const stopPlaying = () => {
        dispatch(
            { type: "welcome/stopPlaying" }
        )
    }
    const handleError = () => {
        message.error("进入视频播放错误, 正在跳转到主页")
        dispatch(
            { type: "welcome/stopPlaying" }
        )

    }

    return <>
        {/* <button ref={this.btnRef} onClick={() => this.playerFullscreen(this.playerRef.current)} /> */}
        < style >
            {`:fullscreen{
                controls: false;
            }`}
        </style >
        <video
            onEnded={stopPlaying}
            onError={handleError}
            style={{ left: "0", top: "0", width: "100vw", height: "100vh", position: "fixed", objectFit: "fill", zIndex: 999 }}
            src={baseUrl+"/testVideo/abc.mp4"}
            type="video/mp4"
            autoPlay
            muted
        />
    </>

}

export default connect(({ dispatch, welcome }) => ({ dispatch, firstEnter: welcome.firstEnter }))(Welcome)
