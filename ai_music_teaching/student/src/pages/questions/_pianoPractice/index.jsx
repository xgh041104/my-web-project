import React, { useState, useRef, useEffect } from 'react';
import { Layout, Spin, Space, Button, message } from 'antd';
import { connect } from 'dva';
import { history } from 'umi';
import dayjs from 'dayjs';

import Piano from 'components/paino';
import OpenSheetMusicDisplay from 'components/OpenSheetMusicDisplay';

import Buttons from './_buttons';
import StepPracticJudge from './components/StepPracticeJudge';
import PlayPracticeJudge from './components/PlayPracticeJudge';
import ScreenShot from './components/screenShoot';
import CommitModal from './components/CommitModal';
import InstrumentSelecter from './_instrumentselecter';
import { filePrefix, baseUrl, rootAddr } from 'urlList';

const { Header, Footer } = Layout;

const Practice = ({ scoreFileUrl, onFinished }) => {

    // 乐谱数据加载完成后再加载osmd，midi等模块,以防多次重复加载造成未知错误
    const painoRef = useRef();
    const buttonsRef = useRef();
    const ScreenShootRef = useRef();
    const scoreContentRef = useRef();
    const modalRef = useRef();
    const selecterRef = useRef();

    const [PMFlag, setPMFlag] = useState(false);// practice mode标志位，false：步进，true：演奏，default：false
    const [HMFlag, setHMFlag] = useState(0);// hand mode手模式，handID 1：右手 2：左手 0：双手, default:0
    const [SMFlag, setSMFlag] = useState(true);//sound mode发声模式， true：电脑  false：外设 , default：true
    const [screenShotImage, setScreenShotImage] = useState("");
    const [spinLoading, setSpinLoading] = useState(true);
    const [partInfo, setPartInfo] = useState([])

    const [osmd, setOsmd] = useState(null);

    //osmd加载乐谱后，解析信息完成后的回调
    const callback = (msg) => {
        console.log('callback');

        switch (msg.name) {
            case "loadScoreReady":
                setPartInfo(msg.arr.instruments.map(({ instrumentId, name }) => ({ instrumentId, name, loading: false })))
                setSpinLoading(false);
                break;
            case "stop":
                if (!buttonsRef.current)
                    return;

                if (!osmd?.getIsStart())
                    buttonsRef.current.setPlayState();
                else {
                    // buttonsRef.current.setPracticeState();
                    playPracticeJudge.stop();
                    playPracticeJudge.startDetectedKeys(false, HMFlag);
                    // console.log('rightNotes',rightNotes);
                    //加载乐谱 停止播放都会产生事件回调，不能在此提交练习结果
                    // if (msg.arr.bool)
                    //     commitResult(() => {
                    //         osmd.reset();
                    //     });//跟随播放结束提交成绩
                }
                break;
            case "error":
                const errMsg = "osmd error: " + msg.errMsg;
                console.error(errMsg);
                message.error(errMsg, 3)
                break;
            default:
                break;
        }
    }


    // 提交练习结果
    const commitResult = () => {
        console.log('开始提交练习结果', buttonsRef.current.getRightNotes());
        const temp = buttonsRef.current.getRightNotes();
        // 先不提供练习截图
        setEndScore(temp);
        modalRef.current.openModal();


        // ScreenShootRef.current.getImage(osmd.getRef()).then(image => {
        //     setSpinLoading(false);
        //     setScreenShotImage(image);
        //     setEndScore(temp);
        //     modalRef.current.setImagePreview(image);
        //     modalRef.current.openModal();
        // }).catch(err => {
        //     message.success(`无法获取练习截图：${err}`);
        // });
        // setSpinLoading(true);
        // console.log("get image: \n" + image);

    }

    //计算好分值后，利用此函数将分值设置到右上角的评分组件上，rateValue：0-5，步进0.5
    const updateSheetScore = (rateValue) => {
        // console.log("updateSheetScore",rateValue,rightNotes);
        buttonsRef?.current?.setScoreRate(rateValue, rightNotes);
    }

    let allNotes = 0;//用于实时评分的，为已打谱音符
    let rightNotes = 0;//正确音符
    const [endScore, setEndScore] = useState(0);

    const changeNotesColor = (matchReults, notes, hasChanged) => {
        const colors = ["rgb(255,21,21)", "rgb(97,211,98)", "rgb(238,157,28)", "rgb(113,185,203)"];
        if (!hasChanged) {
            return;
        }
        for (let i = 0; i < matchReults.length; ++i) {
            if (matchReults[i] === -1) {
                continue;
            }
            allNotes++;
            if (matchReults[i] !== 0) {
                rightNotes++;
            }

            osmd.updateNoteColor(notes[i], colors[matchReults[i]]);

            if (allNotes != 0)
                updateSheetScore(rightNotes / allNotes * 5.0);
        }

        console.log("rightNotes", rightNotes);
    }

    const stepPracticJudge = new StepPracticJudge();
    const [playPracticeJudge, setPlayPracticeJudge] = useState(new PlayPracticeJudge(changeNotesColor));


    //midi键盘和软键盘按下后跳转
    const notePlay = (id, isOn) => {

        painoRef.current.changeNote(id, isOn);
        // console.log("osmd 对象",osmd);
        osmd.changeNote(id, isOn);// 按键发声

        if (PMFlag) {
            playPracticeJudge.addKey({ id, isOn });
        }
        else {
            const shouldNext = stepPracticJudge.judgeStepKeys(id, isOn);
            // console.log("should next: " + shouldNext);
            if (shouldNext) {
                changeNotesColor(stepPracticJudge.matchResults, stepPracticJudge.judgeNotes, true);
                osmd.nextCursor();
                judgetNextNote();
                stepPracticJudge.setNotes(osmd.getCursorNotes(), HMFlag, osmd.getStaffNum());

                // if(!osmdRef.hasNextCursor())
                // {
                //     buttonsRef.current.setPlayState();
                // }
            }
        }
    }
    // 1：右手 2：左手 0：双手, default:0
    //判断下一个是否为休止符
    const judgeIsRest = () => {
        let notes = osmd.getCursorNotes();

        let isNext = true;

        for (let i = 0; i < notes.length; ++i) {
            let parentStaffTemp = notes[i].parentStaffEntry.parentStaff.idInMusicSheet + 1;
            if (osmd.getStaffNum() == 3) {
                (parentStaffTemp != 3) ? (parentStaffTemp = 1) : (parentStaffTemp = 2);
            }

            if (parentStaffTemp != HMFlag && osmd.getStaffNum() != 1) {
                isNext = false;
                continue;
            }
            else {
                if (notes[i].isRest() && osmd.hasNextCursor()) {
                    isNext = true;
                }
                else {
                    isNext = false;
                }
            }
        }

        if (isNext) {
            osmd.nextCursor();
            judgetIsHMF();
        }

    }

    //判断下一个音符的单双手
    const judgetIsHMF = () => {
        // console.log("judgetIsHMF1",HMFlag);
        if (HMFlag == 0 && osmd.getStaffNum() != 1)
            return;

        // console.log("judgetIsHMF2");

        let notes = osmd.getCursorNotes();
        let isNext = true;


        for (let i = 0; i < notes.length; ++i) {
            let parentStaffTemp = notes[i].parentStaffEntry.parentStaff.idInMusicSheet + 1;
            if (osmd.getStaffNum() == 3) {
                (parentStaffTemp != 3) ? (parentStaffTemp = 1) : (parentStaffTemp = 2);
            }


            if (parentStaffTemp == HMFlag || osmd.getStaffNum() == 1) {
                isNext = false;
                judgeIsRest();
                break;
            }
        }

        if (isNext && osmd.hasNextCursor()) {
            osmd.nextCursor();
            judgetIsHMF();
        }

    }

    //判断下个音符是否符合要求
    const judgetNextNote = () => {
        judgetIsHMF();
        judgeIsRest();
    }

    const onPlayNotes = notes => {
        playPracticeJudge.setNotes(notes, osmd.getNotesMaxduration(notes));
    }

    //按钮组调节速度
    const tempoChanged = (tempo) => {
        console.log("tempo is: ", tempo)
        osmd.setBpm(tempo);
    }

    //按钮播放暂停状态变化
    const playStateChanged = (isPlay) => {
        console.log("play state is: ", isPlay)
        osmd.play(isPlay);
    }

    //按钮停止播放
    const stopClicked = () => {
        console.log("stop clicked!")
        osmd.stop();
    }

    //按钮组内，切换声部音色，arr结构[{id:0, name:"piano"},{...}]
    const onInstrumentChanged = (index, id, name) => {
        osmd.setInstrument(
            index, id, name,
            () => {
                selecterRef?.current.setLoading(index, false);
            },
            e => {
                selecterRef?.current.setLoading(index, false);
                console.log("change instrument error:", e)
                message.error(e, 3)
            }
        )
    }

    //按钮练习模式切换，flag true：演奏模式； false：步进模式，default：false
    const practiceMode = (flag) => {
        // PMFlag = flag;
        setPMFlag(flag);
        console.log('练习模式切换：', flag);
        // osmd?.setMsgCallback(callback);
    }

    const startPlayModePractice = (isStart) => {
        playPracticeJudge.startDetectedKeys(isStart, HMFlag);
        osmd.startPractice(isStart);// 会触发callback(msg.name == "stop")回调
    }
    //按钮开始练习
    const startPractice = (isStart) => {
        console.log('按钮点击开始练习状态：', isStart, rightNotes);
        osmd?.setNotePlayCallback(notePlay);
        if (isStart) {
            allNotes = 0;
            rightNotes = 0;
            updateSheetScore(0.0);
            playPracticeJudge.setNotesMatched(changeNotesColor, osmd?.getStaffNum());
        }
        if (PMFlag) {
            if (isStart) {
                startPlayModePractice(true);
            }
            else {
                commitResult();
                startPlayModePractice(false);
            }
            // osmdRef.play(true);
        }
        else {
            if (isStart) {
                judgetNextNote();
                stepPracticJudge.setNotes(osmd.getCursorNotes(), HMFlag, osmd.getStaffNum());
            }
            else {
                commitResult();//步进手动提交成绩
                osmd.reset();
                stepPracticJudge.setNotes([]);
            }
        }
    }

    //按钮切换手模式，handID 2：左手 1：右手 0：双手
    const switchHandMode = (handID) => {
        setHMFlag(handID)
        console.log('切换手模式：', handID);
        osmd.setHand(handID);
    }

    //按钮切换发声模式， isComputer true：电脑  false：外设 default：true
    const switchSoundMode = (isComputer) => {
        osmd.setSoundMode(isComputer);
        setSMFlag(isComputer);
        console.log('切换发声模式：', isComputer);
    }

    //按钮开启节拍器
    const metronomeStateChanged = (state) => {
        // ScreenShootRef.current.setRef(osmdRef.getRef());
        osmd.metronomePlay(state);
    }



    const commitRequest = () => {
        console.log("已获得练习结果图片！");
        const allNotes = osmd.getAllNoteNum();
        let sheetScore = endScore / osmd.getAllNoteNum() * 100;
        console.log(osmd.getAllNoteNum(), endScore, sheetScore);

        // const [imageBlob, imageType] = base64ToBlob(screenShotImage);  // 获取处理好的 和文件类型
        //   formData.append('file', imageBlob, `${Date.now()}.${imageType}`); // 添加到表单，传入文件名
        // dispatch({
        //     type: "practice/addPracticeRecord", payload: {
        //         "CompletionDate": dayjs().format('YYYY-MM-DD HH:mm:ss'),
        //         "Score": sheetScore,
        //         "ScoreData": "",
        //         "fileData": imageBlob,
        //         "fileName": `${Date.now()}.${imageType}`,
        //     }
        // });
        onFinished({
            score: sheetScore.toFixed(2),
            steps: JSON.stringify({ trueScore: endScore, totalScore: allNotes })
        })
    }

    const osmdInitResult = () => {

    }
    // const rootAddr = "http://localhost:8000";

    useEffect(() => {
        if (scoreFileUrl && scoreFileUrl !== "") {
            const scoreUrl = filePrefix() + scoreFileUrl;
            console.log("get score url:", scoreUrl)

            // 直接使用乐谱网络url
            setOsmd(() => new OpenSheetMusicDisplay(
                scoreUrl,
                (notes, notesMaxduration) => {
                    playPracticeJudge.setNotes(notes, notesMaxduration);
                },
                "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM",
                () => {
                    // message.success("osmd初始化成功！");
                    setSpinLoading(false);
                },
                error => {
                    message.error("音源文件加载失败!", error);
                    setSpinLoading(false);
                }
            ));
            // dispatch({
            //     type: "questionsModel/queryScoreFile", payload: filePrefix() + scoreFileUrl,
            //     callback: (scoreData) => {
            //         setOsmd(() => new OpenSheetMusicDisplay(
            //             scoreData,
            //             (notes, notesMaxduration) => {
            //                 playPracticeJudge.setNotes(notes, notesMaxduration);
            //             }
            //         ));
            //         setSpinLoading(false)
            //     }
            // })
        }
        // setSpinLoading(loading.effects["questionsModel/queryScoreFile"])
    }, [])

    useEffect(() => {
        // playPracticeJudge.setNotesMatched(changeNotesColor,osmd?.getStaffNum());
        osmd?.setupOsmd();
        osmd?.setMsgCallback(callback);
        osmd?.setNotePlayCallback(notePlay);
        return function willUnmount() { osmd?.componentWillUnmount(); }
    }, [osmd]);

    useEffect(() => {
        console.log("useEffect PMFlag", PMFlag);
    }, [PMFlag]);


    const back2ScoreList = () => {
        // console.log("back2ScoreList!!!!!!!!!!!!!!");
        playPracticeJudge?.stop();
        playPracticeJudge?.startDetectedKeys(false, HMFlag);
        osmd?.stop();
        osmd?.metronomePlay(false);

        // history.push({ pathname: "/scores/publicScores" });
        // onFinished({
        //     score: null,
        //     steps: null,
        // })
        onFinished(null);
    }

    // render() {
    return (<>
        <CommitModal ref={modalRef} onComfirm={commitRequest} />
        <ScreenShot ref={ScreenShootRef} />
        <div style={{ background: "white" }}>
            <Spin
                spinning={spinLoading}
                size='large'
            // delay={500}
            >
                <Header style={{ background: '#f1f1f1', textAlign: 'center', padding: 0 }}>
                    <Buttons
                        ref={buttonsRef}
                        back2ScoreList={back2ScoreList}
                        tempoChanged={tempoChanged} playStateChanged={playStateChanged}
                        stopClicked={stopClicked}
                        practiceMode={practiceMode} startPractice={startPractice}
                        switchHandMode={switchHandMode}
                        switchSoundMode={switchSoundMode}
                        metronomeStateChanged={metronomeStateChanged}
                    />
                </Header>
                <InstrumentSelecter
                    ref={selecterRef}
                    style={{ position: "absolute" }}
                    partInfo={partInfo}
                    onChanged={onInstrumentChanged}
                />
                <div style={{ height: 660, overflowY: 'auto', overflowX: 'hidden', background: "white" }} >
                    <div ref={scoreContentRef}>
                        {osmd?.render()}
                    </div>
                </div>


                <Footer style={{ textAlign: 'center' }}>
                    <Piano notePlay={(id, isOn) => notePlay(id, isOn)}
                        ref={painoRef}
                    />
                    {/* Copyright © 2022 上海艺埠教育科技有限公司版权所有 */}
                </Footer>
            </Spin>
        </div>
    </>);
}

export default connect(({ loading, dispatch }) => ({ loading, dispatch }))(Practice);
