import { initMIDIIO, closeMIDIIO, outSwitchID, outScorePlay, outChangeNote, outPlayNote } from '.';
import supportedSoundfontInstruments from "../OpenSheetMusicDisplay/osmdPlayer/players/musyngkiteInstruments";

import JZZ from 'jzz';
import MIDI from 'midi.js';
if (typeof window !== "undefined") {
    window.MIDI = MIDI;
}
import JZZSynthMIDIjs from './JZZ.synth.MIDIjs';
JZZSynthMIDIjs(JZZ);

export default class MidiSound {
    constructor(notePlayCallBack, initSuccesss, initFailed) {
        // this.asciiInput = null;
        this.instrumentId = [0];
        this.playNoteCallBack = (msg) => this.playNoteCallBackf(msg); //input设备传递midi消息到this
        initMIDIIO(this.playNoteCallBack);
        this.componentMount().then(
            initSuccesss
        ).catch(
            initFailed
        );
        this.notePlayCallBack = notePlayCallBack; //接收MIDI input设备消息后，回调给判断的方法
        this.soundMode = true;  //发声模式标识位，默认true：电脑发声，false为切换到外设发声
        this.close = false;
        this.isInIt = false;
    }

    setNotePlayCallBack(notePlayCallBack) {
        this.notePlayCallBack = notePlayCallBack;
    }

    //接收来至于 MIDI input device的midi消息
    playNoteCallBackf(msg) {
        // console.log("playNoteCallBackf",msg);
        let id = msg[1];
        let isOn = msg[0] == 144;
        if (msg[2] == 0)
            isOn = false;
        // console.log('midiOutput: ', msg,id,isOn);
        this.notePlayCallBack(id, isOn); //回调给判断音符的方法
    }

    //接收来至于软键盘的按下松起消息
    async changeNote(id, isOn) {
        console.log(this.instrumentId);

        if (!this.soundMode) { //外设发声模式，则将消息转到外设outputPort
            outChangeNote(id, isOn);
            return;
        }

        if (isOn)
            await this.synthMIDI.noteOn(0, id, 127);
        else
            await this.synthMIDI.noteOff(0, id);
    }

    //乐谱播放时，调用发声 
    //TODO: velocity 力度参数怎么获取，统一使用127力度，播放时会略有失真
    scorePlay(midiId, id, duration) {
        // console.log(midiId,this.instrumentId);
        if (!this.soundMode) {  //外设发声模式，则将消息转到外设outputPort
            outScorePlay(midiId, id, duration);
            return;
        }

        let channal = 0;
        for (channal; channal < this.instrumentId.length; channal++) {
            if (this.instrumentId[channal] == midiId)
                break;
        }

        this.synthMIDI.noteOn(channal, id, 127).wait(duration).noteOff(channal, id);
    }

    //轨道音色设置，从乐谱读取，或下拉框选择
    switchID(channal, id) {
        if (this.close) {
            return;
        }
        if (id >= 128)
            id = 0;

        this.instrumentId[channal] = id;

        // await this.outPort.program(channal, id);
        console.log("midisound: switch ID ", channal, id, supportedSoundfontInstruments[id]);

        MIDI.loadPlugin({
            soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
            instrument: supportedSoundfontInstruments[id],
            onsuccess: function () {
                MIDI.programChange(channal, id);
                console.log("midisound: switch ID loadPlugin success!");
            }
        });

        outSwitchID(channal, id); //无论soundmode是什么状态，所有发声port都需要切换对应的音色
    }

    async switchSoundMode(isComputer) {
        this.soundMode = isComputer;
        console.log("MIDI sound: switch SoundMode: ", isComputer);
    }

    //初始化MIDI 播放设备，播放直接初始化MIDI模拟的电脑发声，使用fluidR3_GM音源
    async loadJS() {
        if (this.close) {
            throw new Exception("midisound 组件已经卸载");
        }

        await JZZ.synth.MIDIjs.register('Synth MIDI');
        if (this.close) {
            throw new Exception("midisound 组件已经卸载");
        }
        console.log("loadJS  " + this.close);
        this.synth = await JZZ.synth.MIDIjs({ soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/" })
            .or(function () { alert('Cannot load synth MIDI.js!\n' + this.err()); })
            .and(function () { console.log('load synth MIDI.js!\n'); });
        // console.log("loadJS midisound: switch ID ");
        if (this.close) {
            throw new Exception("midisound 组件已经卸载");
        }
        console.log("loadJS  " + this.close);
        await MIDI.loadPlugin({
            soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
            instrument: supportedSoundfontInstruments[0],
            onsuccess: function () {
                MIDI.programChange(0, 0);
                console.log("midi sound load success");
            },
            onerror: function () {
                console.log('');
            }
        });
        if (this.close) {
            throw new Exception("midisound 组件已经卸载");
        }
        console.log("loadJS  " + this.close);
        this.synthMIDI = await JZZ().openMidiOut("Synth MIDI")
            .or('Synth MIDI not found！')
            .and(function () {
                console.log("Synth MIDI Open succeed!");
            });
        return
    }

    //类对象不触发生命周期
    async componentMount() {
        console.log("midisound componentMount~~~~~~~~~~~~~~~~~~~componentMount ");
        this.close = false;
        return await this.loadJS();
    }

    componentUnmount() {
        console.log("midisound componentWillUnmount~~~~~~~~~~~~~~~~~~~componentWillUnmount ");
        this.close = true;

        closeMIDIIO();
    }
}