import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import PlaybackEngine from "./osmdPlayer";
const msg = { name: "", arr: "" };

class OpenSheetMusicDisplay {
  constructor(file, playNotes, soundfontUrl, initSoundSuccess = null, initSoundFailed = null) {
    this.file = file;
    this.callback = null;
    this.state = { dataReady: false };
    this.osmd = undefined;
    this.divRef = React.createRef();
    // this.audioPlayer = undefined;
    this._startPractice = false;

    this.notePlay = null;
    this.playNotes = playNotes;

    // this.changeInstrument = this.changeInstrument.bind(this);

    this.hand = 0;

    this.StaffNum = 1;//谱子的行数

    this.audioPlayer = new PlaybackEngine(soundfontUrl, initSoundSuccess, initSoundFailed);
  }

  setMsgCallback(callback) {
    this.callback = callback;
  }

  setNotePlayCallback(notePlay) {
    this.notePlay = notePlay;

    this.audioPlayer.setNotePlayCallback(this.notePlay);
  }

  getStaffNum() {
    return this.StaffNum;
  }

  setSoundMode(isComputer) {
    this.audioPlayer.setSoundMode(isComputer);
  }

  setHand(hand) {
    this.hand = hand;
  }

  getRef() {
    return this.divRef;
  }

  getIsStart() {
    return this._startPractice;
  }

  // setPlayMode(isPlay)
  // {
  //   this.playMode = isPlay;
  //   this.audioPlayer.setPlayMode(isPlay);
  // }

  changeNote(id, isOn) {
    this.audioPlayer.playNote(id, isOn);
  }

  setupOsmd(autoResize = undefined, drawTitle = undefined) {
    const options = {
      autoResize: autoResize !== undefined ? autoResize : true,
      drawTitle: drawTitle !== undefined ? drawTitle : true,
      followCursor: true,
    }
    this.osmd = new OSMD(this.divRef.current, options);
    // this.osmd.setCustomPageFormat(500,300);
    console.log("setupOsmd, this file is emtpy?", this.file === "");
    this.osmd.load(this.file).then(() => this.osmd.render()).then(() => this.initScoreImformation()).catch(err => {
      console.error("osmd load failed, " + err);
    });
  }

  loadScoreData(data) {
    if (!data) {
      return;
    }
    console.log("loadScoreData");
    this.osmd.load(data).then(() => this.osmd.render()).then(() => this.initScoreImformation());
  }

  //获取乐器id
  getInstrument() {
    // console.log("获取声部列表：",this.osmd.GraphicSheet.ParentMusicSheet.instruments)
    let instruments = []
    for (let i = 0; i < this.osmd.GraphicSheet.ParentMusicSheet.instruments.length; i++) {
      const subInstrument = this.osmd.GraphicSheet.ParentMusicSheet.instruments[i].subInstruments[0];
      console.log("get sub instrument:", subInstrument, this.osmd.GraphicSheet.ParentMusicSheet.instruments[i]);
      const instrumentId = subInstrument.midiInstrumentID;
      const name = subInstrument.name;
      // this.changeInstrument(i, id, name);
      instruments.push({ instrumentId, name });
    }
    return instruments;
  }

  // changeInstrument(i, id, name) {
  //   msg.name = "Instrument";
  //   msg.arr = { index: i, id: id, name: name };

  //   this.callback(msg);
  // }

  //设置播放速度
  setBpm(value) {
    this.audioPlayer.setBpm(value);
  }

  startPractice(isStart) {
    this.audioPlayer.isMute = isStart;
    this._startPractice = isStart;
    console.log("startPractice", isStart);
    if (isStart) {
      this.osmd.cursor.reset();
      this.audioPlayer.play();
    }
    else {
      this.audioPlayer.stop();
    }
  }

  play(isPlay) {
    if (isPlay) {
      // this.osmd.cursor.reset();
      this.audioPlayer.play();
    }
    else
      this.audioPlayer.pause();
  }

  stop() {
    this.audioPlayer.stop();
    //播放器停止后发送stop信号进行清理
  }

  reset() {
    this.osmd.cursor.reset();
    this.osmd.cursor.show();
    this.clearAllNote();
  }

  metronomePlay(state) {
    this.audioPlayer.metronomePlay(state);
  }

  //设置乐器
  setInstrument(index, midi_id, name, onLoadingInstrumentSuccessed, onLoadingInstrumentError) {
    for (let i = 0; i < this.osmd.GraphicSheet.ParentMusicSheet.instruments[index].Voices.length; i++) {
      this.audioPlayer.setInstrument(index, this.osmd.GraphicSheet.ParentMusicSheet.instruments[index].Voices[i], midi_id)
        .then(() => onLoadingInstrumentSuccessed(index, midi_id))
        .catch(e => onLoadingInstrumentError(e));
    }
  }

  getNotesMaxduration(notes) {
    if (!this.audioPlayer) {
      return 0;
    }
    let maxRealValue = 0;
    for (let note of notes) {
      let duration = note.Length.RealValue;
      if (note.NoteTie) {
        if (Object.is(note.NoteTie.StartNote, note) && note.NoteTie.Notes[1]) {
          duration += note.NoteTie.Notes[1].Length.RealValue;
        }
        else {
          duration = 0;
        }
      }
      if (duration > maxRealValue) {
        maxRealValue = duration;
      }
    }
    return this.audioPlayer.wholeNoteLength * maxRealValue;
  }


  //初始化光标和播放器
  async initScoreImformation() {
    this.osmd.cursor.update();
    this.osmd.cursor.show();

    this.StaffNum = this.osmd.GraphicSheet.ParentMusicSheet.getCompleteNumberOfStaves();
    // console.log("getCompleteNumberOfStaves"+num);

    // this.audioPlayer = new PlaybackEngine(this.notePlay);

    this.audioPlayer.on("iteration", notes => {
      console.log(notes);
      this.osmd.cursor.next();
      this.osmd.cursor.update();

      if (this._startPractice) {
        // console.log("audio player iteration:", this);
        this.playNotes(notes, this.getNotesMaxduration(notes));
        return;
      }

      notes.forEach(element => {
        if (element.pitch === undefined)
          return;
        this.updateNoteColor(element);
      });
    });

    this.audioPlayer.on("state-change", state => {
      console.log("osmd component state change", state);
      if (state == "STOPPED") {
        if (!this._startPractice)
          this.reset();
        console.log("STOPPED", this._startPractice);
        msg.name = "stop";
        msg.arr = { bool: this._startPractice };
        this.callback(msg);
        // this._startPractice = false;
      }
    });

    this.audioPlayer.loadScore(this.osmd)
      .then(() => this.audioPlayer.setOneInstrument(115))
      .then(() => this.audioPlayer.setOneInstrument(0))
      .then(() => {
        console.log('audio load score ready');

        msg.name = "loadScoreReady";
        const instruments = this.getInstrument();
        msg.arr = { instruments };
        this.callback(msg);
      })
      .catch(error => {
        console.log('audio load score error', error);
        msg.name = "error";
        msg.errMsg = error.message
        this.callback(msg);
      });
    // console.log();
    // this.getInstrument();
    // this.play();

  }

  //清除所有颜色
  clearAllNote() {
    const measures = this.osmd.GraphicSheet.ParentMusicSheet.sourceMeasures
    for (let u = 0; u < measures.length; u++) {
      const measure = measures[u];

      for (let p = 0; p < measure.VerticalSourceStaffEntryContainers.length; p++) {
        const staffEntries = measure.VerticalSourceStaffEntryContainers[p].staffEntries;
        for (let i = 0; i < staffEntries.length; i++) {
          if (!staffEntries[i])
            continue;
          // console.log(staffEntries,staffEntries.length,i,u);
          const v = staffEntries[i].voiceEntries;
          for (let q = 0; q < v.length; q++) {
            const n = v[q].notes;
            for (let j = 0; j < n.length; j++) {
              const pitch = n[j];
              this.updateNoteColor(pitch, '#000');
            }
          }
        }
      }
    }
  }

  //音符变色
  updateNoteColor(note, color = '#36ba0d') {

    let hand = note.parentStaffEntry.parentStaff.idInMusicSheet + 1;
    if (this.getStaffNum() == 3) {
      (hand != 3) ? (hand = 1) : (hand = 2);
    }

    // console.log("hand",hand,this.hand,note,color);
    if (hand != this.hand && this.hand != 0)
      return;

    const gNote = this.osmd.rules.GNote(note);
    let el = gNote.getSVGGElement()
    // console.log(note,gNote.notehead(),el);
    // 过滤掉吉他谱的数字部分.
    if (el != null) {
      el.querySelectorAll('path').forEach(item => {
        // console.log(item.getAttribute('d'));
        // if(note.sourceMeasure.measureNumber == 94){
        //   if(item.getAttribute('d').includes(gNote.notehead().y) && !item.getAttribute('d').includes(gNote.notehead().x)){
        //     console.log(gNote.notehead(),gNote.notehead().x - gNote.notehead().width,item);
        //     color = "blue";
        //   }
        // }
        if (item.getAttribute('d').includes(gNote.notehead().y) && item.getAttribute('d').includes(gNote.notehead().x - gNote.notehead().width + 0.75))
          item.setAttribute('fill', color);
        if (item.getAttribute('d').includes(gNote.notehead().y) && item.getAttribute('d').includes(gNote.notehead().x + gNote.notehead().width - 0.75))
          item.setAttribute('fill', color);
        if (item.getAttribute('d').includes(gNote.notehead().y) && item.getAttribute('d').includes(gNote.notehead().x))
          item.setAttribute('fill', color);
      })
    }
  }

  getCursorNotes() {
    let currentVoiceEntries = this.osmd.cursor.iterator.currentVoiceEntries
    let notes = [];
    if (typeof currentVoiceEntries != "undefined") {
      for (let i = 0; i < currentVoiceEntries.length; i++) {
        notes.push(...currentVoiceEntries[i].notes)
      }
    }
    return notes;
  }

  hasNextCursor() {
    return !this.osmd.cursor.iterator.EndReached;
  }

  nextCursor() {
    this.osmd.cursor.next();
    this.osmd.cursor.update();
  }

  //光标音符变色
  updateNoteColorByCursor(state = true) {
    let currentVoiceEntries = this.osmd.cursor.iterator.currentVoiceEntries
    if (typeof currentVoiceEntries != "undefined") {
      for (let i = 0; i < currentVoiceEntries.length; i++) {
        let note = currentVoiceEntries[i].notes[0]
        // let gNote = GraphicalNote.FromNote(note, this.osmd.rules)
        const gNote = this.osmd.rules.GNote(note);
        let el = gNote.getSVGGElement()
        let noteColor;
        if (state) {
          noteColor = '#36ba0d'
        } else {
          noteColor = '#000000'
        }
        // 过滤掉吉他谱的数字部分
        if (el != null) {
          el.querySelectorAll('path').forEach(item => {
            item.setAttribute('fill', noteColor);
          })
        }
      }
    }
  }

  getAllNoteNum() {
    return this.audioPlayer.getAllNoteNum();
  }

  // resize() {
  // this.forceUpdate();
  // this.resizable.updateSize({ width: 200, height: 300 });
  // }

  componentWillUnmount() {

    console.log("osmd will unmount")
    this.audioPlayer.setDelet();
    // window.removeEventListener('resize', this.resize)
  }

  //生命周期 通过setstate传参
  componentDidUpdate(prevProps) {
    // this.stop();
    console.log("osmd componentDidUpdate");
    this.audioPlayer.deletePlayer();
    this.audioPlayer = null;
    if (!prevProps.soundfontUrl) {
      console.error("OSMD组件未设置soundfont url!");
      return;
    }
    this.audioPlayer = new PlaybackEngine(prevProps.soundfontUrl);

    this.osmd.load(this.file).then(() => this.osmd.render()).then(() => this.initScoreImformation())
      .then(() => prevProps.notePlay && this.audioPlayer.setNotePlayCallback(prevProps.notePlay));


    // window.addEventListener('resize', this.resize)
  }

  render() {
    return (
      <div ref={this.divRef} />
    );
  }
}

// OpenSheetMusicDisplay.propTypes = {
//   callback: PropTypes.func,
//   playNotes: PropTypes.func
// };

export default OpenSheetMusicDisplay;
