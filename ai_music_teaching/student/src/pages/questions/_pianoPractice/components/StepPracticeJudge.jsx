import { getNoteKeyId } from "./JudgeHelpers";

export default class StepPracticJudge {
    _matchResults = [];
    _notes = [];
    _matchCount = 0;
    _resetCount = 0;
    _otherCount = 0;//单手
    _sameCount = 0;//相同音符

    get matchResults(){
        return this._matchResults;
    }

    get judgeNotes() {
        return this._notes;
    }

    setNotes(newNotes,HMFlag,staffNum){
        this._matchCount = 0;
        this._resetCount = 0;
        this._otherCount = 0;
        this._sameCount = 0;
        this._notes = newNotes;

        this._matchResults = [];
        for(const note of this._notes){

            if(HMFlag != 0){
                let parentStaffTemp  = note.parentStaffEntry.parentStaff.idInMusicSheet+1;
                if(staffNum == 3)
                {
                    (parentStaffTemp != 3)?(parentStaffTemp = 1):(parentStaffTemp = 2);
                }


                if(parentStaffTemp != HMFlag){
                    this._otherCount++;
                    this._matchResults.push(-1);
                }
                else
                {
                    if(note.isRest()){
                        this._resetCount++;
                    }
                    this._matchResults.push(0);
                }
            }
            else
            {
                if(note.isRest()){
                    this._resetCount++;
                }
                this._matchResults.push(0);
            }
            // console.log(getNoteKeyId(note));
        }

        this.judgeSameNote();
    }

    judgeSameNote(){
        for(let i = 0;i<this._notes.length;i++){
            for(let j = i+1;j<this._notes.length;j++){
                if(getNoteKeyId(this._notes[i]) == getNoteKeyId(this._notes[j]))
                    this._sameCount++;
            }
        }
    }

    judgeStepKeys (keyId, isPressed){
        console.log("has input "+keyId+" "+ isPressed);
        if(this._notes.length < 1 || isPressed===false){
            return false;
        }

        for(let i = 0; i < this._notes.length; ++i){
            const note = this._notes[i];
            if(note.isRest()){
                this._matchResults[i] = -1;
                continue;
            }
            if(keyId === getNoteKeyId(note)){
                if(this._matchResults[i] == 1)
                    continue;
                this._matchResults[i] = 1;
            }
        }
        this._matchCount++;
        let isAllMatched = true;
        for(let i of this._matchResults){
            if(i === 0){
                isAllMatched = false;
                break;
            }
        }

        return this._matchCount >= this._matchResults.length-this._sameCount-this._resetCount-this._otherCount || isAllMatched
    }
}
