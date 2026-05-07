let __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import PlaybackScheduler from "./PlaybackScheduler";
import { SoundfontPlayer } from "./players/SoundfontPlayer";
import { getNoteDuration, getNoteVolume, getNoteArticulationStyle } from "./internals/noteHelpers";
import { EventEmitter } from "./internals/EventEmitter";
import { AudioContext } from "standardized-audio-context";
import MidiSound from '../../midiIO/midisound';

export let PlaybackState;
(function (PlaybackState) {
    PlaybackState["INIT"] = "INIT";
    PlaybackState["PLAYING"] = "PLAYING";
    PlaybackState["STOPPED"] = "STOPPED";
    PlaybackState["PAUSED"] = "PAUSED";
})(PlaybackState || (PlaybackState = {}));
export let PlaybackEvent;
(function (PlaybackEvent) {
    PlaybackEvent["STATE_CHANGE"] = "state-change";
    PlaybackEvent["ITERATION"] = "iteration";
})(PlaybackEvent || (PlaybackEvent = {}));
export default class PlaybackEngine {
    constructor(soundfontUrl, initSoundSuccess = null, initSoundFailed = null, context = new AudioContext()) {
        this.defaultBpm = 100;
        this.scoreInstruments = [];
        this.ready = false;
        this.ac = context;
        this.ac.suspend();
        this.instrumentPlayer = new SoundfontPlayer(soundfontUrl);
        this.instrumentPlayer.init(this.ac);
        this.availableInstruments = this.instrumentPlayer.instruments;
        this.events = new EventEmitter();
        this.cursor = null;
        this.sheet = null;

        this.denominator = null;
        this.numerator = null;
        this.scheduler = null;
        this.schedulerMetronome = null;
        this.numeratorIndex = 0;
        this.iterationSteps = 0;
        this.currentIterationStep = 0;
        this.timeoutHandles = [];
        this.playbackSettings = {
            bpm: this.defaultBpm,
            masterVolume: 1,
        };

        this.notePlayCallBack = null;
        this.soundMode = true;
        // this.playMode = false;
        this.midi = new MidiSound(this.notePlayCallBack, initSoundSuccess, initSoundFailed);
        this.isMute = false;
        this.setState(PlaybackState.INIT);
        this.allNoteNum = 0;
    }

    setNotePlayCallback(judgeNoteCallBack) {
        this.notePlayCallBack = (id, isOn) => { judgeNoteCallBack(id, isOn); }

        this.midi.setNotePlayCallBack(this.notePlayCallBack);
    }

    setSoundMode(isComputer) {
        this.soundMode = isComputer;
        this.midi.switchSoundMode(isComputer);
    }
    // setPlayMode(isPlay){
    //     this.playMode = isPlay;
    // }
    get wholeNoteLength() {
        // console.log((60 / this.playbackSettings.bpm) * (4/this.denominator)*this.denominator * 1000);
        return Math.round((60 / this.playbackSettings.bpm) * (4 / this.denominator) * this.denominator * 1000);
    }
    getPlaybackInstrument(voiceId) {
        if (!this.sheet)
            return null;
        const voice = this.sheet.Instruments.flatMap(i => i.Voices).find(v => v.VoiceId === voiceId);
        return this.availableInstruments.find(i => i.midiId === voice.midiInstrumentId);
    }
    setInstrument(index, voice, midiInstrumentId) {
        console.log("setInstrument!!!!!!!!!!!!!!!!!!!!!!!!!!");
        this.midi.switchID(index, midiInstrumentId);
        return __awaiter(this, void 0, void 0, function* () {
            yield this.instrumentPlayer.load(midiInstrumentId);
            voice.midiInstrumentId = midiInstrumentId;
        });
    }
    setOneInstrument(midiInstrumentId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.instrumentPlayer.load(midiInstrumentId);
        });
    }
    loadScore(osmd) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ready = false;
            this.sheet = osmd.Sheet;
            this.scoreInstruments = this.sheet.Instruments;
            this.cursor = osmd.cursor;
            this.denominator = this.sheet.SheetPlaybackSetting.rhythm.Denominator;
            this.numerator = this.sheet.SheetPlaybackSetting.rhythm.numerator;
            if (this.sheet.HasBPMInfo) {
                this.setBpm(this.sheet.DefaultStartTempoInBpm);
            }
            yield this.loadInstruments();
            this.initInstruments();
            this.scheduler = new PlaybackScheduler(this.denominator, this.wholeNoteLength, this.ac, (delay, notes) => this.notePlaybackCallback(delay, notes), (state) => this.setStop(state));
            this.countAndSetIterationSteps();
            this.ready = true;
            this.setState(PlaybackState.STOPPED);
            this.ac.resume();
        });
    }
    initInstruments() {
        for (const i of this.sheet.Instruments) {
            for (const v of i.Voices) {
                v.midiInstrumentId = i.MidiInstrumentId;
            }
        }
    }
    loadInstruments() {
        console.log("PlaybackEngine loadInstruments");
        return __awaiter(this, void 0, void 0, function* () {
            let playerPromises = [];
            let index = 0;
            for (const i of this.sheet.Instruments) {
                const pbInstrument = this.availableInstruments.find(pbi => pbi.midiId === i.MidiInstrumentId);
                if (pbInstrument == null) {
                    this.fallbackToPiano(i);
                }
                // console.log("loadInstruments",i.MidiInstrumentId);
                this.midi.switchID(index, i.MidiInstrumentId);
                playerPromises.push(this.instrumentPlayer.load(i.MidiInstrumentId));
                index++;
            }
            yield Promise.all(playerPromises);
        });
    }
    fallbackToPiano(i) {
        console.warn(`Can't find playback instrument for midiInstrumentId ${i.MidiInstrumentId}. Falling back to piano`);
        i.MidiInstrumentId = 0;
        if (this.availableInstruments.find(i => i.midiId === 0) == null) {
            throw new Error("Piano fallback failed, grand piano not supported");
        }
    }
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ac.resume();
            // this.scheduler.reset();

            if (this.state === PlaybackState.INIT || this.state === PlaybackState.STOPPED) {
                this.cursor.show();
            }
            this.setState(PlaybackState.PLAYING);
            this.scheduler.start();
            // this.metronomePlay(true);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setState(PlaybackState.STOPPED);
            this.stopPlayers();
            this.clearTimeouts();
            this.scheduler.reset();
            this.cursor.reset();
            this.currentIterationStep = 0;
            // this.cursor.hide();
            // this.metronomePlay(false);

        });
    }
    pause() {
        this.setState(PlaybackState.PAUSED);
        // this.ac.suspend();
        this.stopPlayers();
        this.scheduler.setIterationStep(this.currentIterationStep);
        this.scheduler.pause();
        this.clearTimeouts();
    }

    jumpToStep(step) {
        this.pause();
        if (this.currentIterationStep > step) {
            this.cursor.reset();
            this.currentIterationStep = 0;
        }
        while (this.currentIterationStep < step) {
            this.cursor.next();
            ++this.currentIterationStep;
        }
        let schedulerStep = this.currentIterationStep;
        if (this.currentIterationStep > 0 && this.currentIterationStep < this.iterationSteps)
            ++schedulerStep;
        this.scheduler.setIterationStep(schedulerStep);
    }
    setBpm(bpm) {
        this.playbackSettings.bpm = bpm;
        if (this.scheduler)
            this.scheduler.wholeNoteLength = this.wholeNoteLength;
    }
    on(event, cb) {
        this.events.on(event, cb);
    }
    countAndSetIterationSteps() {
        this.cursor.reset();
        let steps = 0;
        this.allNoteNum = 0;
        while (!this.cursor.Iterator.EndReached) {
            if (this.cursor.Iterator.CurrentVoiceEntries) {
                this.allNoteNum += this.scheduler.loadNotes(this.cursor.Iterator.CurrentVoiceEntries);
            }
            this.cursor.next();
            ++steps;
        }
        this.iterationSteps = steps;
        this.cursor.reset();
        console.log("allNoteNum", this.allNoteNum);
    }
    getAllNoteNum() {
        return this.allNoteNum;
    }
    notePlaybackCallback(audioDelay, notes) {
        if (this.state !== PlaybackState.PLAYING)
            return;
        if (notes.length == 0)
            return;
        let scheduledNotes = new Map();
        let minDuration = 0;
        for (let note of notes) {
            if (note.isRest()) {
                continue;
            }
            const noteDuration = getNoteDuration(note, this.wholeNoteLength);

            if (noteDuration === 0)
                continue;
            if (minDuration === 0)
                minDuration = noteDuration;
            if (noteDuration < minDuration)
                minDuration = noteDuration;

            const noteVolume = getNoteVolume(note);
            const noteArticulation = getNoteArticulationStyle(note);
            const midiPlaybackInstrument = note.ParentVoiceEntry.ParentVoice.midiInstrumentId;
            const fixedKey = note.ParentVoiceEntry.ParentVoice.Parent.SubInstruments[0].fixedKey || 0;
            if (!scheduledNotes.has(midiPlaybackInstrument)) {
                scheduledNotes.set(midiPlaybackInstrument, []);
            }
            scheduledNotes.get(midiPlaybackInstrument).push({
                note: note.halfTone - fixedKey * 12,
                duration: noteDuration / 1000,
                gain: noteVolume,
                articulation: noteArticulation,
            });
        }

        if (!this.isMute) {
            for (const [midiId, notes] of scheduledNotes) {
                if (this.soundMode)
                    this.instrumentPlayer.schedule(midiId, this.ac.currentTime + audioDelay, notes);
                else {
                    for (let i = 0; i < notes.length; i++) {
                        this.midi.scorePlay(midiId, notes[i].note, notes[i].duration * 1000);
                    }
                }
                console.log(midiId, audioDelay * 1000, notes);
            }
        }

        this.timeoutHandles.push(window.setTimeout(() => this.iterationCallback(), Math.max(0, audioDelay * 1000 - 35)), // Subtracting 35 milliseconds to compensate for update delay
            window.setTimeout(() => this.events.emit(PlaybackEvent.ITERATION, notes), minDuration));
    }
    setStop(state) {
        this.stop();
        this.setState(state);
    }

    setState(state) {
        this.state = state;
        this.events.emit(PlaybackEvent.STATE_CHANGE, state);
    }
    stopPlayers() {
        for (const i of this.sheet.Instruments) {
            for (const v of i.Voices) {
                this.instrumentPlayer.stop(v.midiInstrumentId);
            }
        }
    }
    // Used to avoid duplicate cursor movements after a rapid pause/resume action
    clearTimeouts() {
        for (let h of this.timeoutHandles) {
            clearTimeout(h);
        }
        this.timeoutHandles = [];
    }
    iterationCallback() {
        if (this.state !== PlaybackState.PLAYING)
            return;
        // if (this.currentIterationStep > 0)
        //     this.cursor.next();
        ++this.currentIterationStep;
    }
    playNote(id, isOn) {
        if (this.soundMode)
            this.instrumentPlayer.playNote(0, id, isOn);
        else
            this.midi.changeNote(id, isOn);
    }
    playMetronome(duration) {
        this.numeratorIndex++;
        if (this.numeratorIndex % this.numerator == 1)
            this.instrumentPlayer.playMetronome(72, duration);
        else
            this.instrumentPlayer.playMetronome(60, duration);

        // console.log("playMetronome!!!!!!!!!!!!!!!",duration);

    }
    metronomePlay(state) {
        // console.log("metronomePlay!!!!!!!!!!!!!!!",state,this.schedulerMetronome);

        let duration = (60 / this.playbackSettings.bpm) * (4 / this.denominator) * 1000;
        if (!this.schedulerMetronome && state) {
            this.schedulerMetronome = window.setInterval(() => this.playMetronome(duration), duration);
        }
        else {
            window.clearInterval(this.schedulerMetronome);
            this.schedulerMetronome = null;
            this.numeratorIndex = 0;
        }

    }
    setDelet() {
        this.midi.componentUnmount();
    }
    deletePlayer() {
        this.instrumentPlayer.deletePlayer();
    }
}
