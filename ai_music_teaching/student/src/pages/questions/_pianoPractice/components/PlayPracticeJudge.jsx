
import { getNoteKeyId } from "./JudgeHelpers";


export default class PlayPracticeJudge {

    constructor(notesMatched){
        this._notesMatched = notesMatched;
        this._detectIntervalHandle = null;
        this._detectInterval = 5;
        this._keys = [];
        this._notes = null;
        this._matchResults = [];
        // this._previousNotes = null;
        this._matchCount = 0;
        this._maxMatchCount = 0;
        this.HMFlag = 0;// hand model
        // this._noteMatchHandles = [];
        this.staffNum = 0;
    }

    setNotesMatched(notesMatched,staffNum){
        this._notesMatched = notesMatched;
        this.staffNum = staffNum;
        // console.log(staffNum,this.staffNum);
    }

    setHM(HMFlag){
        this.HMFlag = HMFlag;
    }

    getCurrentDetectedNote(noteIndex){
        if(!this._notes){
            return -1
        }

        return this._notes[noteIndex];
    }

    addKey(key) {
        if (!key) {
            return;
        }
        if (key.isOn) {
            this._keys.push(key);
        }
        else {
            const index = this._keys.findIndex(_key => _key.id === key.id);
            if (index != -1) {
                this._keys.splice(index);
            }
        }
    }

    setNotes(notes, maxNoteDuration) {
        console.log("get notes count: " + notes.length+"   "+maxNoteDuration);
        console.log(notes[0].NoteToGraphicalNoteObjectId);
        this._matchCount = 0;
        // 获取音符最大时值除以interval
        this._maxMatchCount = maxNoteDuration/this._detectInterval;
        this._notes = notes;
        // this._previousNotes = this._notes;
        this._matchResults = [];
        for(const note of this._notes){
            this._matchResults.push(-1);
        }
        // for(const handle of this._noteMatchHandles){
        //     clearTimeout(handle);
        // }
    }

    startDetectedKeys(isStart,HMFlag) {
        this._notes = null;

        this.setHM(HMFlag);

        if (isStart) {
            // if (!this._detectIntervalHandle) {
                this._detectIntervalHandle = window.setInterval(() => this.judgePlayKeys(), this._detectInterval);
            // }
        }
        else {
            clearInterval(this._detectIntervalHandle);
            this._detectIntervalHandle = null;
        }
    }

    stop(){
        this._keys = [];
        this._notes = null;
        this._matchResults = [];

    }

    judgePlayKeys() {
        // console.log("@@@@@@@@@@@@",);

        if(!this._notes){
            return;
        }
        // console.log("!!!!!!!!!!!!!!!!!");
        /**
          * 1. 以当前notes为标准，匹配到keyId的note为正确，匹配不到的为错误
          *  a. 在notes第n次(time = n*200ms)才匹配上keyId，则按下时机过慢，n可以作为误差调节
          *  b. 在notes有m次判断成功，>m+1次没有成功，则按下时间过短，m可以作为误差调节
          * 2. 其中错误的和previous的notes对比，如果匹配得上，则按下时间太长
          * 3. 其中错误的和next的notes对比，如果匹配得上，则按下时间太快
          * */
        const n = 1;
        const m = this._maxMatchCount-1;

        let hasChanged = false;

        for (let i = 0; i < this._notes.length; ++i) {
            // this._matchResults[i] = 1;
            // hasChanged = true;
            // continue;
            const note = this._notes[i];
            if (note.isRest()) {
                this._matchResults[i] = -1;
                continue;
            }

            let parentStaffTemp  = note.parentStaffEntry.parentStaff.idInMusicSheet+1;
            if(this.staffNum == 3)
            {
                (parentStaffTemp != 3)?(parentStaffTemp = 1):(parentStaffTemp = 2);
            }

            // console.log("parentStaffTemp",parentStaffTemp,this.HMFlag,this.staffNum);
            if(this.HMFlag != 0 && parentStaffTemp != this.HMFlag){
                this._matchResults[i] = -1;
                continue;
            }
            const noteKeyId = getNoteKeyId(note);
            const matchKeyId = this._keys.findIndex(_key => _key.id === noteKeyId);
            if(this._matchResults[i] < 1 && matchKeyId === -1 && this._matchCount > n){
                // 暂时完全错误
                if(this._matchResults[i] != 0){
                    this._matchResults[i] = 0;
                    hasChanged = true;
                }
                continue;
            }
            if(this._matchResults[i] < 1 && matchKeyId !== -1){
                if (this._matchCount <= n) {
                    // 暂时完全正确
                    if(this._matchResults[i] != 1){
                        this._matchResults[i] = 1;
                        hasChanged = true;
                    }
                    continue;
                }
                else{
                    // 第n次才判断正确,即按下时机过慢
                    if(this._matchResults[i] != 2){
                        this._matchResults[i] = 2;
                        hasChanged = true;
                    }
                    continue;
                }
            }
            // if(this._matchCount > m && note.isMatch === true && matchKeyId === -1){
                // 之前匹配成功，但第m次之后没有匹配成功，即松起时间过快
                // this._matchResults[i] = 3;
            // }

            // if (matchKeyId !== -1) {
            //     this._matchResults[i] = 1;
            // }
            // else {
            //     this._matchResults[i] = 0;
            // }

        }
        if (this._notes) {
            this._matchCount++;
        }

        // console.log(this._notes[0].NoteToGraphicalNoteObjectId,hasChanged);
        // if(this._notes[0].NoteToGraphicalNoteObjectId === 6)
        // {
        //     console.log(this._matchResults[0],hasChanged);
        // }

        this._notesMatched(this._matchResults, this._notes, hasChanged);
        // const results = this._matchResults;
        // const notes = this._notes;
        // this._noteMatchHandles.push(window.setTimeout(()=>{
        //     this._notesMatched(results, notes);
        // }, 1));

        // return this._notes;
    }
}
