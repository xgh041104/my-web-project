import { Button, Slider, Space, Switch, Divider, Radio, Rate } from 'antd';
import { PlayCircleOutlined, BorderOutlined, PauseCircleOutlined } from '@ant-design/icons'
import React from 'react'


const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];

export default class Buttons extends React.Component {
    constructor(props) {
        super(props); //预设一个声部数量partInfo的属性，用于动态展示声部对应的音色选择框
        this.state = {
            defaultTempo: 60,
            playState: false,
            playCom: <><PlayCircleOutlined /> 播放乐谱</>,
            Metronome: false,
            MetronomeCom: <><PlayCircleOutlined /> 节拍器</>,
            practiceState: false,
            practiceCom: <><PlayCircleOutlined /> 开始练习</>,
            pmf :false,
            rightNotes:0,
            ratevalue: props.scoreRate,
        };
    }

    //设置得分rate，rateValue：0-5，步进0.5
    setScoreRate = (rateValue,rightNotes) => {
        // console.log("setScoreRate",rateValue,rightNotes);
        this.setState({
            ratevalue: rateValue,
            rightNotes:rightNotes
        });
    }


    getRightNotes = () => {
        return this.state.rightNotes;
    }


    //下拉框切换乐器
    instrumentChanged = (index, id, name) => {
        this.partArr[index].id = id;
        this.partArr[index].name = name;
        // console.log("instrument changed: ", this.partArr[index]);

        this.setLoading(index, true);
        this.props.instrumentChanged(this.partArr);
    }

    //找到声部音色等待图标
    setLoading = (index, flag) => {
        // console.log("setLoading!!!!!!!!!",flag);
        console.log("will set partInfo:", JSON.stringify(this.partArr));
        this.partArr[index].loading = flag;
        this.setState({
            partinfo: this.partArr,
        });
        // console.log(this.partArr[index],flag);
    }

    //读取乐谱乐器，设置乐器下拉框


    //重置所有的状态，包括播放、速度调节等
    resumeStatus() {
        this.setState({
            defaultTempo: 60,
            playState: false,
            playCom: <><PlayCircleOutlined />播放乐谱</>,
            Metronome: false,
            MetronomeCom: <><PlayCircleOutlined />节拍器</>,
            practiceState: false,
            practiceCom: <><PlayCircleOutlined /> 开始练习</>,
            ratevalue: 0.0
        });
    }

    //停止按钮被点击，重置播放状态
    stopClicked() {
        this.props.stopClicked();
        this.setState({
            playState: false,
            playCom: <><PlayCircleOutlined />播放乐谱</>
        })
    }
    setPlayState() {
        this.setState({
            playState: false,
            playCom: <><PlayCircleOutlined />播放乐谱</>,
            practiceCom: <><PlayCircleOutlined /> 开始练习</>,
            // practiceState: false
        })
    }
    setPracticeState() {
        // let tempstate = this.state.practiceState;
        this.setState({
            practiceState: false,
            playState: false,
            playCom: <><PlayCircleOutlined />播放乐谱</>,
            practiceCom: <><PlayCircleOutlined /> 开始练习</>
        });
    }

    //播放和暂停按钮被点击，需要切换播放和暂停两种状态
    playClicked() {
        let tempstate = this.state.playState;
        this.setState({
            playState: !tempstate,
        });
        if (!tempstate) {
            this.setState({
                playCom: <><BorderOutlined />暂停播放</>
            });
        }
        else {
            this.setState({
                playCom: <><PlayCircleOutlined />播放乐谱</>
            });
        }
        this.props.playStateChanged(!tempstate);
    }

    MetronomeClick() {
        let tempstate = this.state.Metronome;

        this.setState({
            Metronome: !tempstate,
        });
        if (!tempstate) {
            this.setState({
                MetronomeCom: <><BorderOutlined />节拍器</>
            });
        }
        else {
            this.setState({
                MetronomeCom: <><PlayCircleOutlined />节拍器</>
            });
        }
        this.props.metronomeStateChanged(!tempstate);
    }

    practiceClick() {
        // this.stopClicked(); // 此处会触发this.props.stopClicked();造成两次页面刷新,而且会在截图之前将结果重置初始状态

        let tempstate = this.state.practiceState;

        this.setState({
            practiceState: !tempstate,
            playState: false,
            playCom: <><PlayCircleOutlined />播放乐谱</>
        });
        if (!tempstate) {
            // this.stopClicked(); //开始练习时，需要先执行停止播放的状态

            this.setState({
                practiceCom: <><BorderOutlined /> 停止练习</>
            });
        }
        else {
            this.setState({
                practiceCom: <><PlayCircleOutlined /> 开始练习</>
            });
        }
        // console.log("practiceClick:"  +tempstate + this.state.practiceState);
        if (tempstate === this.state.practiceState)
            this.props.startPractice(!tempstate);
    }

    isPMFChecked(){
        return this.state.pmf;
    }

    setPMF(check){
        this.setState({
            pmf : check
        });
        this.props.practiceMode(check);
    }

    render() {

        return <Space>
            <Button type="primary" onClick={this.props.back2ScoreList}>返回</Button>
            <nobr>速度调节:</nobr>
            <Slider min={40} max={240} defaultValue={90} style={{ width: 100 }}
                step={1}
                onChange={(newValue) => this.props.tempoChanged(newValue)}
            />
            <Button onClick={() => this.MetronomeClick()}>{this.state.MetronomeCom}</Button>
            <Button type='primary' danger onClick={() => this.playClicked()}>{this.state.playCom}</Button>
            <Button type='primary' onClick={() => this.stopClicked()}><BorderOutlined />停止播放</Button>
            <Divider type="vertical" height="100%" />
            <nobr>练习选项：</nobr>
            <Switch checkedChildren="演奏模式" unCheckedChildren="步进模式"
                onChange={(checked) => this.setPMF(checked)}
            />
            <Divider type="vertical" height="100%" />
            <Radio.Group defaultValue={0}
                onChange={(e) => this.props.switchHandMode(e.target.value)}
            >
                <Space>
                    <Radio value={2}><nobr>左手</nobr></Radio>
                    <Radio value={1}><nobr>右手</nobr></Radio>
                    <Radio value={0}><nobr>双手</nobr></Radio>
                </Space>
            </Radio.Group>
            <Button type='primary' danger onClick={() => this.practiceClick()}>{this.state.practiceCom}</Button>
            <Divider type="vertical" height="100%" />
            <nobr>综合得分：</nobr>
            <Rate tooltips={desc} disabled allowHalf value={this.state.ratevalue} />
            <Divider type="vertical" height="100%" />
            {/* <nobr>发声选项：</nobr> */}
            <Switch checkedChildren="电脑发声" unCheckedChildren="外设发声" defaultChecked
                onChange={(isChecked) => this.props.switchSoundMode(isChecked)}
            />
        </Space>
    }
}
