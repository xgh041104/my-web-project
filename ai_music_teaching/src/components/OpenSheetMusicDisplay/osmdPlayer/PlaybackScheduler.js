import StepQueue from "./internals/StepQueue";
export default class PlaybackScheduler {
    constructor(denominator, wholeNoteLength, audioContext, noteSchedulingCallback,stateCallback) {
        this.stepQueue = new StepQueue();
        this.stepQueueIndex = 0;
        this.scheduledTicks = new Set();
        this.currentTick = 0;
        this.currentTickTimestamp = 0;
        this.audioContextStartTime = 0;
        this.schedulerIntervalHandle = null;
        this.scheduleInterval = 5; // Milliseconds
        this.schedulePeriod = 500;
        this.tickDenominator = 1000;
        this.lastTickOffset = 300; // Hack to get the initial notes play better
        this.playing = false;
        this.noteSchedulingCallback = noteSchedulingCallback;
        this.stateCallback = stateCallback;
        this.denominator = denominator;
        this.wholeNoteLength = wholeNoteLength;
        this.audioContext = audioContext;
    }
    get schedulePeriodTicks() {
        return this.schedulePeriod / this.tickDuration;
    }
    get audioContextTime() {
        if (!this.audioContext)
            return 0;
        return (this.audioContext.currentTime - this.audioContextStartTime) * 1000;
    }
    get tickDuration() {
        return this.wholeNoteLength / this.tickDenominator;
    }
    get calculatedTick() {
        return this.currentTick + Math.round((this.audioContextTime - this.currentTickTimestamp) / this.tickDuration);
    }
    start() {
        this.playing = true;
        this.stepQueue.sort();
        // console.log(this.stepQueue.steps);
        this.audioContextStartTime = this.audioContext.currentTime;
        this.currentTickTimestamp = this.audioContextTime;
        if (!this.schedulerIntervalHandle) {
            this.schedulerIntervalHandle = window.setInterval(() => this.scheduleIterationStep(), this.scheduleInterval);
        }
    }
    setIterationStep(step) {
        step = Math.min(this.stepQueue.steps.length - 1, step);
        this.stepQueueIndex = step;
        this.currentTick = this.stepQueue.steps[this.stepQueueIndex].tick;
    }
    pause() {
        this.playing = false;
    }
    resume() {
        this.playing = true;
        this.currentTickTimestamp = this.audioContextTime;
    }
    reset() {
        this.playing = false;
        this.currentTick = 0;
        this.currentTickTimestamp = 0;
        this.stepQueueIndex = 0;
        clearInterval(this.schedulerIntervalHandle);
        this.schedulerIntervalHandle = null;
    }
    loadNotes(currentVoiceEntries) {
        let thisTick = this.lastTickOffset;
        if (this.stepQueue.steps.length > 0) {
            thisTick = this.stepQueue.getFirstEmptyTick();
        }
        // console.log(thisTick,currentVoiceEntries);

        let index = 0;
        for (let entry of currentVoiceEntries) {
            // console.log(thisTick,entry.ParentSourceStaffEntry.parentStaff.id);

            if (!entry.IsGrace) {
                for (let note of entry.Notes) {
                    this.stepQueue.addNote(thisTick, note);
                    // console.log(note.Length.RealValue,this.tickDenominator);
                    this.stepQueue.createStep(thisTick + note.Length.RealValue * this.tickDenominator);
                    index++;
                }
            }
        }

        return index;
        // console.log(thisTick,currentVoiceEntries,this.stepQueue.steps.length);

    }
    scheduleIterationStep() {
        var _a, _b;
        if (!this.playing)
            return;
        this.currentTick = this.calculatedTick;
        this.currentTickTimestamp = this.audioContextTime;
        let nextTick = (_a = this.stepQueue.steps[this.stepQueueIndex]) === null || _a === void 0 ? void 0 : _a.tick;

        while (this.nextTickAvailableAndWithinSchedulePeriod(nextTick)) {
            let step = this.stepQueue.steps[this.stepQueueIndex];
            let timeToTick = (step.tick - this.currentTick) * this.tickDuration;
            if (timeToTick < 0)
                timeToTick = 0;
            this.scheduledTicks.add(step.tick);
            console.log("timeToTick",timeToTick,step.tick);
            this.noteSchedulingCallback(timeToTick / 1000, step.notes);
            this.stepQueueIndex++;
            nextTick = (_b = this.stepQueue.steps[this.stepQueueIndex]) === null || _b === void 0 ? void 0 : _b.tick;
        }
        for (let tick of this.scheduledTicks) {
            if (tick <= this.currentTick) {
                this.scheduledTicks.delete(tick);
            }
        }
        // console.log(this.currentTick,nextTick);

        if(nextTick == undefined)
        {
            let lastTick = (_a = this.stepQueue.steps[this.stepQueueIndex-1]) === null || _a === void 0 ? void 0 : _a.tick;
            let step = this.stepQueue.steps[this.stepQueueIndex - 1];
            let timeToTick = (step.tick - this.currentTick) * this.tickDuration;
            // console.log(this.currentTick,lastTick+timeToTick);
            if(this.currentTick>lastTick+timeToTick)
            {
                this.stateCallback("STOPPED");
            }
        }
    }
    nextTickAvailableAndWithinSchedulePeriod(nextTick) {
        return (nextTick &&
            this.currentTickTimestamp + (nextTick - this.currentTick) * this.tickDuration <=
                this.currentTickTimestamp + this.schedulePeriod);
    }
}
