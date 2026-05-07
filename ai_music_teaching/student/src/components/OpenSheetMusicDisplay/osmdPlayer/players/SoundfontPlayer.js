let __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    // eslint-disable-next-line no-param-reassign
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        // eslint-disable-next-line no-param-reassign
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArticulationStyle } from "./NotePlaybackOptions";
import supportedSoundfontInstruments from "./musyngkiteInstruments";
import * as Soundfont from "soundfont-player";
export class SoundfontPlayer {
    constructor(soundfontUrl) {
        this.players = new Map();
        this.instruments = supportedSoundfontInstruments
            // .filter(i => supportedSoundfontInstruments.includes(this.getSoundfontInstrumentName(i[1])))
            .map((i, index) => ({
                midiId: index,
                name: i,
                loaded: false,
            }));
        this.soundfontUrl = soundfontUrl;
        console.log("constructor", this.instruments);

        this.notes = new Map();

    }
    init(audioContext) {
        this.audioContext = audioContext;
    }
    load(midiId) {
        return __awaiter(this, void 0, void 0, function* () {
            const instrument = this.instruments.find(i => i.midiId === midiId);
            if (!instrument) {
                throw new Error("SoundfontPlayer does not support midi instrument ID " + midiId);
            }
            if (this.players.has(midiId))
                return;
            console.log("load midi wait", midiId);
            const player = yield Soundfont.instrument(
                //@ts-ignore
                this.audioContext, this.getSoundfontInstrumentName(instrument.name), {
                nameToUrl: (name, sf, format) => {
                    // format = format === 'ogg' ? format : 'mp3'
                    // sf = sf === 'FluidR3_GM' ? sf : 'MusyngKite'
                    // return  'https://gleitz.github.io/midi-js-soundfonts/' + sf + '/' + name + '-' + format + '.js'
                    return this.soundfontUrl + '/' + name + '-' + 'mp3.js'
                }
            });
            //,{ soundfont: 'MusyngKite', }
            // sf = sf === 'FluidR3_GM' ? sf : 'MusyngKite'

            console.log("load midi !!!!!!", midiId);

            this.players.set(midiId, player);
        });
    }
    deletePlayer() {
        this.players = new Map();
    }
    stop(midiId) {
        if (!this.players.has(midiId))
            return;
        this.players.get(midiId).stop();
    }
    schedule(midiId, time, notes) {
        this.verifyPlayerLoaded(midiId);
        this.applyDynamics(notes);
        // console.log(midiId,time,notes);
        this.players.get(midiId).schedule(time, notes);
    }
    playNote(midiId, id, isOn) {
        if (!this.players.has(midiId)) {
            this.load(midiId,  this.soundfontUrl);
            return;
        }

        if (isOn)
            this.notes.set(id, this.players.get(midiId).play(id));
        else {
            if (!this.notes.has(id))
                return;

            this.notes.get(id).stop();
        }
    }
    playMetronome(id, duration) {
        this.players.get(115).play(id).stop(duration);
    }
    applyDynamics(notes) {
        for (const note of notes) {
            if (note.articulation === ArticulationStyle.Staccato) {
                note.gain = Math.max(note.gain + 0.3, note.gain * 1.3);
                note.duration = Math.min(note.duration * 0.4, 0.4);
            }
        }
    }
    verifyPlayerLoaded(midiId) {
        if (!this.players.has(midiId))
            throw new Error("No soundfont player loaded for midi instrument " + midiId);
    }
    getSoundfontInstrumentName(midiName) {
        return midiName.toLowerCase().replace(/\s+/g, "_");
    }
}
