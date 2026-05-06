import { initMIDIIO, closeMIDIIO, outSwitchID, outScorePlay, outChangeNote } from '.';
import supportedSoundfontInstruments from "../OpenSheetMusicDisplay/osmdPlayer/players/musyngkiteInstruments";

import * as JZZ from 'JZZ';
import MIDI from 'midi.js';
require('./JZZ.synth.MIDIjs')(JZZ);

import { baseUrl } from 'config';

// 输入回调管理，每个模块占用一个 channelId
const inputCallbackList = {};
export function setInputCallback(channelId, callback, isRemove = false) {
    if (isRemove || !callback) {
        inputCallbackList[channelId] = null;
    } else {
        inputCallbackList[channelId] = callback;
    }
}

// OSMD 播放专用，传递到屏幕键盘联动
let reactionPianoRef = undefined;
export function setReactionPianoRef(pianoRef) {
    reactionPianoRef = pianoRef || undefined;
}

// OSMD 播放时手动触发屏幕键盘变色
export function osmdPlayNote(midiId, noteId, duration) {
    if (reactionPianoRef) {
        reactionPianoRef?.current.changeNote(noteId, true);
        setTimeout(() => {
            reactionPianoRef?.current.changeNote(noteId, false);
        }, duration);
    }
}

export default class MidiSound {
    constructor(notePlayCallBack, initSuccess, initFailed) {
        this.instrumentId = [0];
        this.playNoteCallBack = (msg) => this.playNoteCallbackInternal(msg);
        this.notePlayCallBack = notePlayCallBack;
        this.soundMode = true; // true：电脑发声；false：外设发声
        this.close = false;
        this.isInIt = false;

        initMIDIIO(this.playNoteCallBack);
        this.componentMount().then(initSuccess).catch(initFailed);
    }

    // 设置 input 回调
    setNotePlayCallBack(notePlayCallBack) {
        this.notePlayCallBack = notePlayCallBack;
    }

    // 接收来自 MIDI Input 设备的信号
    playNoteCallbackInternal(msg) {
        const id = msg[1];
        let isOn = msg[0] === 144;
        if (msg[2] === 0) isOn = false;

        this.notePlayCallBack?.(id, isOn);
        for (const key of Object.keys(inputCallbackList)) {
            inputCallbackList[key]?.(id, isOn);
        }
    }

    // 模块播放或软键盘操作
    async changeNote(id, isOn, channelId = 0) {
        if (!this.soundMode) {
            outChangeNote(id, isOn, channelId);
            return;
        }

        if (isOn) {
            await this.synthMIDI.noteOn(channelId, id, 127);
        } else {
            await this.synthMIDI.noteOff(channelId, id);
        }
    }

    // 乐谱播放用（含 duration）
    scorePlay(midiId, id, duration) {
        if (!this.soundMode) {
            outScorePlay(midiId, id, duration);
            return;
        }

        let channel = 0;
        for (channel = 0; channel < this.instrumentId.length; channel++) {
            if (this.instrumentId[channel] === midiId) break;
        }

        this.synthMIDI.noteOn(channel, id, 127).wait(duration).noteOff(channel, id);

        if (reactionPianoRef) {
            reactionPianoRef?.current.changeNote(id, true);
            setTimeout(() => {
                reactionPianoRef?.current.changeNote(id, false);
            }, duration);
        }
    }

    // 切换指定 channel 的音色
    switchID(channel, id) {
        if (this.close) return;
        if (id >= 130) id = 0;

        this.instrumentId[channel] = id;

        console.log("midisound: switch ID ", channel, id, supportedSoundfontInstruments[id]);

        MIDI.loadPlugin({
            soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
            instrument: supportedSoundfontInstruments[id],
            onsuccess: () => {
                MIDI.programChange(channel, id);
                console.log("midisound: switch ID loadPlugin success!");
            },
            onerror: (e) => {
                console.log('Error loading MIDI plugin:', e);
            }
        });

        outSwitchID(channel, id);
    }

    // 切换发声模式：true 使用电脑播放；false 使用外部设备
    async switchSoundMode(isComputer) {
        this.soundMode = isComputer;
        console.log("MIDI sound: switch SoundMode: ", isComputer);
    }

    // 初始化音源和插件
    async loadJS() {
        if (this.close) throw new Error("midisound 组件已卸载");

        await JZZ.synth.MIDIjs.register('Synth MIDI');
        if (this.close) throw new Error("midisound 组件已卸载");

        this.synth = await JZZ.synth.MIDIjs({
            soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/"
        })
            .or((e) => alert('无法加载 synth MIDI.js!\n' + e?.message))
            .and(() => console.log('已加载 synth MIDI.js'));

        await MIDI.loadPlugin({
            soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
            instrument: supportedSoundfontInstruments[0],
            onsuccess: () => {
                MIDI.programChange(0, 0);
                console.log("MIDI sound 加载成功");
            },
            onerror: () => console.log("插件加载失败")
        });

        this.synthMIDI = await JZZ().openMidiOut("Synth MIDI")
            .or('找不到 Synth MIDI 输出端口！')
            .and(() => console.log("Synth MIDI 打开成功"));
    }

    // 类初始化
    async componentMount() {
        console.log("midisound componentMount 初始化");
        this.close = false;
        await this.loadJS();
    }

    // 卸载方法
    componentUnmount() {
        console.log("midisound componentWillUnmount 正在卸载");
        this.close = true;
        closeMIDIIO();
    }
}

// 默认导出一个全局单例
export const midiSound = new MidiSound();
