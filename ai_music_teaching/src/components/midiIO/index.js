import * as JZZ from 'jzz';

var midiIO = undefined;
var input = [];
var output = [];
var info = undefined;
var instrumentId = [0];


function midiInput(msg, playNoteCallBack) {
    console.log('midiInput: ', msg[0], msg[1], msg[2]);
    playNoteCallBack(msg);
}

function midiOutput(msg) {
    console.log('midiOutput: ', msg);
}

async function initJZZ(playNoteCallBack) {
    midiIO = await JZZ().or('JZZ Can not start MIDI engine!');
    info = await JZZ().info();
    console.log("initJZZ info", info);

    for (let i = 0; i < info.inputs.length; i++) {
        input[i] = await midiIO.openMidiIn(i).or("JZZ can not open MIDI in port!")
            .and(function () { console.log('MIDI IN open: ', this.name()); });
        input[i].connect(function (msg) { midiInput(msg, playNoteCallBack); });
    }
    // console.log(input);

    //TODO:怎么排除掉synth midi、tiny等设备，只保留真实的硬件外设
    for (let i = 0; i < info.outputs.length; i++) {
        output[i] = await midiIO.openMidiOut(i).or("JZZ can not open MIDI out port!")
            .and(function () { console.log('MIDI Out open: ', this.name()); });
    }
    // console.log(output);
}


export const initMIDIIO = (playNoteCallBack) => {
    initJZZ(playNoteCallBack);
}

export const closeMIDIIO = () => {
    for (let i = 0; i < input.length; i++) {
        input[i].disconnect();
        input[i].close();
    }
    for (let i = 0; i < output.length; i++) {
        output[i].close();
    }
}

//切换对应channel的音色，各个模块维护自己的音色channel
export const outSwitchID = (channel, id) => {
    if (output.length <= 0)
        return;

    if (id >= 128)
        id = 0;

    instrumentId[channel] = id;

    output[0].program(channel, id);

    console.log("MIDI IO: outSwitchID", channel, id);
}

export const outScorePlay = (midiId, id, duration) => {
    if (output.length <= 0)
        return;

    let channal = 0;
    for (channal; channal < instrumentId.length; channal++) {
        if (instrumentId[channal] == midiId)
            break;
    }

    output[0].noteOn(channal, id, 127).wait(duration).noteOff(channal, id);
}

//各个模块维护自己的音色channel
export const outChangeNote = (id, isOn, channelId) => {
    if (output.length <= 0)
        return;
    if (isOn)
        output[0].noteOn(channelId, id, 127);
    else
        output[0].noteOff(channelId, id);
}

export const outPlayNote = (msg) => {

}

