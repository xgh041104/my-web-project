import ReactHlsPlayer from 'react-hls-player';
import { Button, Slider, Row, Col, Select, ConfigProvider } from 'antd'
import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react'
import Icon, { CaretRightOutlined, PauseOutlined, FullscreenOutlined } from '@ant-design/icons'

const muteSoundSVG = () => (<svg t="1694744171332" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2108" xmlnsXlink="http://www.w3.org/1999/xlink" width=".3rem" height=".3rem"><path d="M596.194 138.74A87.977 87.977 0 0 1 622 200.984v624.03C622 873.608 582.6 913 534 913a88.008 88.008 0 0 1-62.257-25.801l-160.029-160.16a48 48 0 0 0-33.955-14.073l-61.759 0.001c-70.692 0-128-57.297-128-127.978V441.015c0-70.68 57.308-127.978 128-127.978h61.755a48 48 0 0 0 33.955-14.073L471.743 138.8c34.35-34.377 90.068-34.405 124.451-0.062z m-79.173 45.297L352.299 348.886a96 96 0 0 1-67.907 28.144H216c-35.346 0-64 28.648-64 63.987v143.97c0 35.339 28.654 63.987 64 63.987l68.394-0.001a96 96 0 0 1 67.91 28.144L517.02 841.964A24.003 24.003 0 0 0 534 849c13.255 0 24-10.743 24-23.995v-624.01a23.992 23.992 0 0 0-6.72-16.651l-0.318-0.325-0.292-0.286c-9.398-9.078-24.378-8.975-33.65 0.304z m421.866 196.628c12.517 12.517 12.517 32.811 0 45.329l-88.283 88.281 88.283 88.283c12.517 12.517 12.517 32.811 0 45.329-12.518 12.517-32.812 12.517-45.33 0l-88.282-88.283-88.281 88.283c-12.518 12.517-32.812 12.517-45.33 0-12.517-12.518-12.517-32.812 0-45.33l88.282-88.282-88.281-88.281c-12.518-12.518-12.518-32.812 0-45.33 12.517-12.517 32.811-12.517 45.329 0l88.281 88.282 88.283-88.281c12.517-12.518 32.811-12.518 45.329 0z" fill="white" p-id="2109"></path></svg>)

const soundSVG = () => (<svg t="1694744156595" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1954" xmlnsXlink="http://www.w3.org/1999/xlink" width=".3rem" height=".3rem"><path d="M596 139c16.71 16.242 26 38.634 26 62v624c0 48.608-39.423 88-88 88-23.423 0-45.833-9.282-62-26L312.059 727.059A48 48 0 0 0 278.118 713H216c-70.657 0.295-128-57.003-128-128V441c0-70.338 57.343-127.636 128-128h61.198a48 48 0 0 0 33.844-13.962L472 139c34.021-34.576 89.774-34.604 124 0z m-79 45L352.118 348.882A96 96 0 0 1 284.235 377H216c-35.323 0.358-64 29.006-64 64v144c0 35.297 28.106 63.728 62.942 64h69.293a96 96 0 0 1 67.883 28.118L517 842a24.112 24.112 0 0 0 17 7c13.246 0 24-10.743 24-24V201c0-6.221-2.415-12.189-7-17-9.741-9.345-24.733-9.242-34 0z m298.153 87.989C883.63 332.312 924 422.217 924 518.999c0 96.784-40.37 186.689-108.847 247.012-13.262 11.683-33.482 10.403-45.165-2.859-11.682-13.261-10.402-33.482 2.86-45.164C827.493 669.849 860 597.455 860 519s-32.507-150.85-87.152-198.988c-13.262-11.682-14.542-31.903-2.86-45.164 11.683-13.262 31.903-14.542 45.165-2.86z m-95.508 93.39C760.867 403.048 785 458.494 785 517.973c0 59.513-24.161 114.988-65.425 152.659-13.052 11.915-33.292 10.994-45.208-2.058-11.796-12.922-11.011-32.888 1.67-44.848l0.388-0.36 0.834-0.768C704.657 597.13 721 559.193 721 517.974c0-41.613-16.656-79.88-44.53-105.352-13.045-11.922-13.956-32.163-2.034-45.209 11.922-13.046 32.163-13.957 45.209-2.035z" fill="white" p-id="1955"></path></svg>)

const MuteSoundIcon = (props) => <Icon component={muteSoundSVG} {...props} />;
const SoundIcon = (props) => <Icon component={soundSVG} {...props} />;


const PlayerControls = forwardRef(function PlayerControlsUI(props, ref) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [totalTime, setTotalTime] = useState(0)
    const [volume, setVolume] = useState(0)
    const [mute, setMute] = useState(true);
    const [hoverVisible, setHoverVisible] = useState(false);

    const onPlay = () => {
        props.onPlay(isPlaying)
        setIsPlaying(play => !play)
    }
    const onVolumeSliderChange = (value) => {
        props.onVolumeControlChange(value);
        setVolume(value);
    }

    const onMuteClick = () => {
        props.onMuteTrigger(mute);
        setMute(mute => !mute);
    }

    const onFullScreenClick = () => {
        props.onFullScreenClick?.();
    }

    useImperativeHandle(
        ref,
        () => ({
            setTotalTime,
            setCurrentTime,
            setHoverVisible
        }),
        [],
    )

    useEffect(() => {
        setVolume(props.defaultVolume)
    }, [props.defaultVolume])


    useEffect(() => {
        if (volume == 0) {
            setMute(true);
        }
        else if (mute) {
            setMute(false);
        }
    }, [volume])


    return <div style={{
        // backgroundImage: "linear-gradient(rgba(125,125,125, 0.5), rgb(0,0,0,1))",
        backgroundColor: "black",
        marginTop: "-.15rem"
        // margin: "0rem 0.3rem 0rem 0.3rem",
        // opacity:hoverVisible?1:.01
    }} >
        <Row style={{ margin: "0.1rem .3rem 0px .3rem" }} justify='start' gutter={{ xs: 0, sm: 8, md: 16, lg: 24 }}>
            <Col >
                <Button onClick={onMuteClick} style={{ backgroundColor: "transparent", border: "none" }} icon={isPlaying ? <PauseOutlined style={{ color: "white", fontSize: '.3rem' }} /> : <CaretRightOutlined style={{ color: "white", fontSize: '.3rem' }} />} onClick={onPlay} />
            </Col>
            <Col style={{ color: 'white' }}>
                <span style={{ margin: "auto .1rem", color: 'white' }}>{`${parseInt(currentTime / 60)}:${String(parseInt(currentTime) % 60).padStart(2, '0')}`}</span>
                /<span style={{ marginLeft: ".1rem", color: 'white' }}>{`${parseInt(totalTime / 60)}:${String(parseInt(totalTime) % 60).padStart(2, '0')}`}</span>
            </Col>
            <Col offset={20}>
                <Slider value={volume} onChange={onVolumeSliderChange} style={{ minWidth: ".5rem" }} />
            </Col>
            <Col>
                <Button style={{ marginLeft: "-.24rem", backgroundColor: "transparent", border: "none" }} icon={mute ? <MuteSoundIcon /> : <SoundIcon />} />
            </Col>
            {/* 
                全屏后hls自带的播放控制组件UI会显示出来
            <Col>
                <Button onClick={onFullScreenClick} style={{ backgroundColor: "transparent", border: "none" }} icon={<FullscreenOutlined style={{ color: "white", fontSize: '.3rem' }} />} />
            </Col> */}
            {/* <Col >播放速度:<Select defaultValue={2} style={{ minWidth: "1rem" }} options={[{ label: "0.5倍速", value: 1 }, { label: "1倍速", value: 2 }, { label: "2倍速", value: 3 }]} /></Col> */}
        </Row>
        <Slider max={parseInt(totalTime)} value={parseInt(currentTime)}
            style={{
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                userSelect: "none",
                pointerEvents: "none", height: ".2rem", width: "92%",
                marginLeft: ".6rem"
            }} />
        {/* <Progress  percent={currentTime*100/totalTime} style={{ height: ".2rem", width: "100%" }} /> */}
        {/* <div style={{ width: "100%", height: ".2rem", color: "darkgray" }}><div style={{ width: `${Math.round(currentTime*100/totalTime)}%`, color:"white" }} /></div> */}
    </div>
})

function HlsPlayer(props) {
    const { startPosition, onLoadedData, onTimeUpdate, ...otherProps } = props
    const playerRef = useRef();
    const controlsRef = useRef();
    // const [isPlaying, setIsPlaying] = useState(false)

    const onPlay = (isPlaying) => {
        if (isPlaying) {
            playerRef.current.pause();
        }
        else {
            playerRef.current.play();
        }
    }

    const onVolumeControlChange = (value) => {
        playerRef.current.volume = value / 100
    }
    const onMuteTrigger = (value) => {
        playerRef.current.muted = !value;
    }
    const onFullScreenClick = () => {
        // playerRef.current.fullScreen()
        // console.log('fullScreen');        
        if (playerRef.current.requestFullscreen) {
            playerRef.current.requestFullscreen();
        } else if (playerRef.current.mozRequestFullScreen) {
            playerRef.current.mozRequestFullScreen();
        } else if (playerRef.current.webkitRequestFullscreen) {
            playerRef.current.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            playerRef.current.msRequestFullscreen();
        }
    }

    const defaultVolume = useMemo(() => {
        return playerRef.current?.defaultVolume
    }, [playerRef.current])

    return <div>
        < ReactHlsPlayer
            playerRef={playerRef}
            hlsConfig={{
                startPosition: startPosition,//设置开始时间
            }}
            {...otherProps}
            // controls={true} // 自定义播放控件
            onProgress={(event) => {
                console.log("on progress:", event.preventDefault())

                // return event.preventDefault();
                return false;
            }}
            onLoadedData={(event) => {
                onLoadedData(event);
                controlsRef.current.setTotalTime(event.target.duration)
            }}
            onTimeUpdate={(event) => {
                onTimeUpdate(event);
                controlsRef.current.setCurrentTime(event.target.currentTime);
            }}
            onMouseEnter={() => controlsRef.current?.setHoverVisible(true)} onMouseLeave={() => controlsRef.current?.setHoverVisible(false)}
        />
        <PlayerControls defaultVolume={defaultVolume}
            // onFullScreenClick={onFullScreenClick} 
            onMuteTrigger={onMuteTrigger} onVolumeControlChange={onVolumeControlChange} onPlay={onPlay} ref={controlsRef} />
    </div>
}

export default HlsPlayer