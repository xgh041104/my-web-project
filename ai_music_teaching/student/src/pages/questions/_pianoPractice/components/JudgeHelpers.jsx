/**
 * @file 步进判断和演奏判断公用函数可放在此文件内
 */

export function getNoteKeyId(note){
    const fixedKey = note.ParentVoiceEntry.ParentVoice.Parent.SubInstruments[0].fixedKey || 0;
    // console.log("get currentNote"+note +" keyId "+(note.halfTone - fixedKey * 12))
    return note.halfTone - fixedKey * 12;
}

export function getMaxDuration(notes){

}
