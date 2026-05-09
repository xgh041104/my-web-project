import React, { useEffect, useState, useRef } from "react";
import { Space, Button, Tabs, Select, message } from "antd";
import abcjs from "abcjs";
import "abcjs/abcjs-audio.css";
import { midiSound, setInputCallback } from "@/components/midiIO/midisound";
import Piano from "@/components/DetailPiano";
import pianoMap from "./pianoMap";
import instrumentList from "./instrumentList";
import { baseUrl } from "config";
import "./index.css";
import FiveDegreeCirculation from "./fiveDegreeCirculation";

//滚动函数，用于控制abcjs的滚动
function scrollToBottom(elementId) {
  var element = document.getElementById(elementId);
  element.scrollTop = element.scrollHeight - element.clientHeight;
}

//横向滚动函数，用于控制abcjs的横向滚动
function scrollHorizontally(elementClassName) {
  var element = document.getElementById(elementClassName);
  var svg = element.querySelector("svg");

  var originalWidth = svg.getAttribute("width"); //svg的宽度

  var parentDiv = document.createElement("div"); //创建一个div元素
  parentDiv.style.width = originalWidth + "px";
  parentDiv.style.overflow = "hidden";

  svg.parentNode.insertBefore(parentDiv, svg);
  parentDiv.appendChild(svg); //将svg元素插入到div元素中

  // element.scrollLeft = originalWidth - element.clientWidth;
  element.style.overflowX = "auto";
  element.scrollLeft = element.scrollWidth - element.clientWidth; //设置滚动条的位置
}

const minNote = "1/64";
var basicAbcStr = `X:1\nQ:100\nM:4/4\nL:${minNote}\nK:C\n`;

var sectionList = [
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
]; //单谱表外

var highSectionList = [
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
]; //大谱表高音部分

var lowSectionList = [
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
  { beats: 0, notes: "z16 z16 z16 z16" },
]; //大谱表低音部分

var tempBeats = 0; //临时节拍数
var lowTempBeats = 0; //大谱表低音临时节拍数
var highTempBeats = 0; //大谱表高音临时节拍数
var partIndex = 0; //当前谱表索引
var highPartIndex = 0; //大谱表高音表索引
var lowPartIndex = 0; //大谱表低音表索引
var index = 0; //当前谱表内索引
var backList = []; //回退索引列表

const noteList = {
  1: "C",
  2: "^C",
  3: "D",
  4: "^D",
  5: "E",
  6: "F",
  7: "^F",
  8: "G",
  9: "^G",
  10: "A",
  11: "^A",
  12: "B",
}; //C大调

const noteLists = {
  1: "C",
  2: "#C",
  3: "D",
  4: "#D",
  5: "E",
  6: "F",
  7: "#F",
  8: "G",
  9: "#G",
  10: "A",
  11: "#A",
  12: "B",
}; //C大调

const noteMap = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
  "C#": 1,
  "F#": 6,
  Cb: -1,
  Db: -2,
  Eb: -4,
  Fb: -5,
  Gb: -7,
  Ab: -9,
  Bb: -11,
};

const sharpBtnList = [
  { label: "/image/musicNote/^.png", value: "^" },
  { label: "/image/musicNote/^^.png", value: "^^" },
  { label: "/image/musicNote/=.png", value: "=" },
  { label: "/image/musicNote/_.png", value: "_" },
  { label: "/image/musicNote/_.png", value: "__" },
];

const noteBtnList = [
  { label: "/image/musicNote/0.png", value: 64 },
  { label: "/image/musicNote/2.png", value: 32 },
  { label: "/image/musicNote/4.png", value: 16 },
  { label: "/image/musicNote/8.png", value: 8 },
  { label: "/image/musicNote/16.png", value: 4 },
  { label: "/image/musicNote/32.png", value: 2 },
];

const timeSignatures = [
  { label: "四二拍", value: "2/4" },
  { label: "四三拍", value: "3/4" },
  { label: "四四拍", value: "4/4" },
  { label: "八六拍", value: "6/8" },
  { label: "二二拍", value: "2/2" },
  { label: "四五拍", value: "5/4" },
  { label: "四七拍", value: "7/4" },
  { label: "二三拍", value: "3/2" },
  { label: "八九拍", value: "9/8" },
  { label: "八十二拍", value: "12/8" },
  { label: "八五拍", value: "5/8" },
  { label: "八七拍", value: "7/8" },
  { label: "八一拍", value: "1/8" },
  { label: "四十六拍", value: "16/4" },
];

const keySignatures = [
  { label: "C大调", value: "C" },
  { label: "F大调", value: "F" },
  { label: "bB大调", value: "Bb" },
  { label: "bE大调", value: "Eb" },
  { label: "bA大调", value: "Ab" },
  { label: "bD大调", value: "Db" },
  { label: "bG大调", value: "Gb" },
  { label: "bC大调", value: "Cb" },
  { label: "#C大调", value: "C#" },
  { label: "#F大调", value: "F#" },
  { label: "B大调", value: "B" },
  { label: "E大调", value: "E" },
  { label: "A大调", value: "A" },
  { label: "D大调", value: "D" },
  { label: "G大调", value: "G" },
];

const clefList = [
  { label: "高音", value: "treble" },
  { label: "低音", value: "bass" },
  { label: "中音", value: "alto" },
  { label: "打击谱", value: "perc" },
  { label: "大谱表", value: "big" },
];

//音程
const noteTypeList = {
  0: "纯一度",
  1: "小二度",
  2: "大二度",
  3: "小三度",
  4: "大三度",
  5: "纯四度",
  6: "增四度/减五度",
  7: "纯五度",
  8: "小六度",
  9: "大六度",
  10: "小七度",
  11: "大七度",
  12: "纯八度",
  13: "小九度",
  14: "大九度",
  15: "小十度",
  16: "大十度",
  17: "纯十一度",
  18: "增十一度",
  19: "纯十二度",
  20: "小十三度",
  21: "大十三度",
  22: "小十四度",
  23: "大十四度",
  24: "复纯八度",
};

//三和弦
const threeChordMap = {
  "4,3": "大三和弦",
  "3,4": "小三和弦",
  "4,4": "增三和弦",
  "3,3": "减三和弦",
};

const sevenChordMap = {
  "4,3,4": "大大七和弦", // 大三和弦 + 大七度 (如 C-E-G-B)
  "4,3,3": "大小七和弦", // 大三和弦 + 小七度 (如 C-E-G-Bb)
  "3,4,4": "小大七和弦", // 小三和弦 + 大七度 (如 C-Eb-G-B)
  "3,4,3": "小小七和弦", // 小三和弦 + 小七度 (如 C-Eb-G-Bb)
  "3,3,3": "减减七和弦", // 减三和弦 + 小七度 (如 C-Eb-Gb-Bb)
  "3,3,4": "减小七和弦", // 减三和弦 + 减七度 (如 C-Eb-Gb-Bbb 或 C-Eb-Gb-A)
  "4,4,3": "增大七和弦", // 增三和弦 + 小七度 (如 C-E-G#-Bb)
};

const chordList = [
  { label: "大三和弦", value: [60, 64, 67] },
  { label: "小三和弦", value: [60, 63, 67] },
  { label: "增三和弦", value: [60, 64, 68] },
  { label: "减三和弦", value: [60, 63, 66] },
  { label: "大大七和弦", value: [60, 64, 67, 71] },
  { label: "大小七和弦", value: [60, 64, 67, 70] },
  { label: "小大七和弦", value: [60, 63, 67, 71] },
  { label: "小小七和弦", value: [60, 63, 67, 70] },
  { label: "减小七和弦", value: [60, 63, 66, 70] },
  { label: "减减七和弦", value: [60, 63, 66, 71] },
  { label: "增大七和弦", value: [60, 64, 68, 71] },
];

const drumBeats = {
  // the array is [0]=drum [1]=drumIntro
  "2/4": ["dd 76 77 60 30", 2],
  "3/4": ["ddd 76 77 77 60 30 30", 1],
  "4/4": ["dddd 76 77 77 77 60 30 30 30", 1],
  "5/4": ["ddddd 76 77 77 76 77 60 30 30 60 30", 1],
  "Cut Time": ["dd 76 77 60 30", 2],
  "6/8": ["dd 76 77 60 30", 2],
  "9/8": ["ddd 76 77 77 60 30 30", 1],
  "12/8": ["dddd 76 77 77 77 60 30 30 30", 1],
}; //鼓点参数

const simpleNoteList = {
  1: "1",
  2: "#1",
  3: "2",
  4: "#2",
  5: "3",
  6: "4",
  7: "#4",
  8: "5",
  9: "#5",
  10: "6",
  11: "#6",
  12: "7",
}; //简谱

const secondType = [
  { key: 0, label: "音符类型" },
  { key: 1, label: "节奏类型" },
  // { key: 2, label: "升降记号" },
];

var lastNoteId = [];

export default function MusicTheory() {
  const audioRef = useRef();
  const pianoRef = useRef();
  const container = useRef();

  const [noteBtn, setNoteBtn] = useState(16); //音符类型
  const [dotBtn, setDotBtn] = useState(0); //附点0表示无附点0.5表示有附点
  const [sharpBtn, setSharpBtn] = useState(""); //升降记号
  const [restBtn, setRestBtn] = useState(false); //是否是休止符
  const [timeSign, setTimeSign] = useState("4/4"); //拍号
  const [keySign, setKeySign] = useState("C"); //调号
  const [clefBtn, setClefBtn] = useState("treble"); //谱号
  const [unfold, setUnfold] = useState(false); //是否展开
  const [noteType, setNoteType] = useState(""); //当前按下的音符类型
  const [selectedNotes, setSelectedNotes] = useState({
    startChar: 0,
    endChar: 0,
  }); //选中的音符
  const [defaultAbcStr, setDefaultAbcStr] = useState(
    `X:1\nQ:100\nM:4/4\nL:1/64\nK:C\n%%MIDI program 0\n| | | | |`,
  );
  const [instrumentType, setInstrumentType] = useState(0); //乐器类型
  const [highPrefixStr, setHighPrefixStr] = useState("V:1 treble\n "); //高音前缀
  const [lowPrefixStr, setLowPrefixStr] = useState("V:2 bass\n "); //低音前缀
  const [isDisPlayNote, setIsDisPlayNote] = useState(false); //是否显示音符
  const [secondActiveKey, setSecondActiveKey] = useState(0); //当前选中的列表类型
  const [list, setList] = useState([]); //当前按下的音符id
  const [activeRotation, setActiveRotation] = useState(0);

  let pressedNotes = []; // 存储当前按下的音符
  let pressKey = []; //存储当前 按下的按键
  let timerId = null; // 定时器ID，用于取消未触发的定时器

  let lastNote = []; //存储字符

  const defaultOptions = {
    scale: 2,
    dragging: false,
    clickListener: clickListener,
    add_classes: true,
    responsive: "resize",
  };

  const audioParams = {
    // chordsOff: true,
    // drum: drumBeats[timeSign][0],
    // drumIntro: drumBeats[timeSign][1],
  };

  useEffect(() => {
    if (abcjs.synth.supportsAudio()) {
      const synthControl = new abcjs.synth.SynthController();
      const visualObj = abcjs.renderAbc(
        container.current,
        defaultAbcStr,
        defaultOptions,
      );
      // synthControl.pause = function () {
      //     console.log("Paused");
      // };
      // 初始化 SVG 容器
      function createCursor() {
        var svg = document.querySelector("#paper svg");
        var cursor = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        cursor.setAttribute("class", "abcjs-cursor");
        cursor.setAttributeNS(null, "x1", 0);
        cursor.setAttributeNS(null, "y1", 0);
        cursor.setAttributeNS(null, "x2", 0);
        cursor.setAttributeNS(null, "y2", 0);
        svg.appendChild(cursor);
        return cursor;
      }
      var cursor = createCursor();

      var CursorControl = function () {
        // this.onStart = function () {
        //     console.log("start");
        // };

        this.onFinished = function () {
          cursor.setAttribute("x1", 0);
          cursor.setAttribute("x2", 0);
          cursor.setAttribute("y1", 0);
          cursor.setAttribute("y2", 0);

          for (var i = 0; i < lastNote.length; i++) {
            for (var j = 0; j < lastNote[i].length; j++) {
              lastNote[i][j].classList.remove("noteColor");
            }
          }

          for (var i = 0; i < lastNoteId.length; i++) {
            pianoRef?.current?.changeNote(lastNoteId[i], false);
          }
        };

        this.onEvent = function (event) {
          //音符颜色改变
          changeNoteColor(event.elements);
          // console.log(event);
          //光标位置变化
          cursor.setAttribute("x1", event.left - 2);
          cursor.setAttribute("x2", event.left - 2);
          cursor.setAttribute("y1", event.top);
          cursor.setAttribute("y2", event.top + event.height);

          //piano对应显示
          var notes = defaultAbcStr.substring(event.startChar, event.endChar);

          changePiano(notes);
        };
      };

      var cursorControl = new CursorControl();

      synthControl.load("#audio", cursorControl, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });
      synthControl.disable(true);

      const createSynth = new abcjs.synth.CreateSynth();
      createSynth
        .init({
          visualObj: visualObj[0],
          options: {
            soundFontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
          },
        })
        .then(() => {
          synthControl
            .setTune(visualObj[0], false, audioParams)
            .then(() => {
              console.log("audio加载完成");

              synthControl.disable(false);
            })
            .catch((error) => {
              console.error("audio problem:", error);
            });
        })
        .catch((error) => {
          console.error("audio problem:", error);
        });
    } else {
      audioRef.current.innerHTML = "不支持audio播放";
    }
    // scrollHorizontally("paper");
  }, [defaultAbcStr]);

  //监听abcjs的点击事件
  function clickListener(
    abcelem,
    tuneNumber,
    classes,
    analysis,
    drag,
    mouseEvent,
  ) {
    // console.log(abcelem.startChar, abcelem.endChar);
    setSelectedNotes({
      startChar: abcelem.startChar,
      endChar: abcelem.endChar,
    });
    // console.log(tuneNumber);
    // console.log(analysis);
    // console.log(drag);
    // console.log(mouseEvent);
  }

  //监听键盘按下事件
  const handleKeyPress = (event) => {
    const noteId = pianoMap[event.key.toLowerCase()];
    const foundNote = pressedNotes.some((item) => item.noteId === noteId);
    if (noteId && !foundNote) {
      screenPianoChangeNote(noteId, true);
    }
  };

  //监听键盘松开事件
  const handleKeyUp = (event) => {
    const noteId = pianoMap[event.key.toLowerCase()];
    // console.log(noteId);
    if (noteId) {
      screenPianoChangeNote(noteId, false);
    }
  };

  //改变播放时音符颜色
  const changeNoteColor = (els) => {
    var i;
    var j;

    for (i = 0; i < lastNote.length; i++) {
      for (j = 0; j < lastNote[i].length; j++) {
        lastNote[i][j].classList.remove("noteColor");
      }
    }

    for (i = 0; i < els.length; i++) {
      for (j = 0; j < els[i].length; j++) {
        els[i][j].classList.add("noteColor");
      }
    }

    lastNote = els;
  };

  //把音符转换成pianoId
  const changePiano = (notes) => {
    //对音符进行处理
    var list = splitNotes(notes);

    var tempList = [];
    list.forEach((item) => {
      //转换成pianoId
      var noteId = restoreNoteId(item);

      if (noteId) {
        tempList.push(noteId);
      }
    });

    changePianoStatus(tempList);
  };

  //改变piano
  const changePianoStatus = (els) => {
    for (let i = 0; i < lastNoteId.length; i++) {
      pianoRef?.current?.changeNote(lastNoteId[i], false);
    }

    lastNoteId = els;

    for (let i = 0; i < els.length; i++) {
      pianoRef?.current?.changeNote(els[i], true);
    }
  };

  //拆分音符，去除多余空格并改成大写
  const splitNotes = (note) => {
    // 去除开头和结尾的空格
    note = note.trim();

    //判断是否为音程和弦
    if (note.startsWith("[") && note.endsWith("]")) {
      // 去掉方括号
      note = note.slice(1, -1);
    }

    // 使用正则表达式分隔，匹配大小写字母和 , '
    return note.match(/[A-Za-z,']+/g) || [];
  };

  //监听和弦按钮按下事件
  const handleMouseDown = (notes) => {
    // console.log(notes);
    notes.map((item) => screenPianoChangeNote(item, true));
  };

  //监听按钮松开事件
  const handleMouseUp = (notes) => {
    // console.log(notes);
    notes.map((item) => screenPianoChangeNote(item, false));
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [noteBtn, restBtn, dotBtn, sharpBtn, timeSign, keySign, clefBtn]);

  useEffect(() => {
    midiSound.switchID(11, 1); //本模块维护MIDI 11 channel
    setInputCallback(11, midiInputDeviceMsg); //注册接收midiinput消息
    return () => {
      setInputCallback(11, midiInputDeviceMsg, true); //卸载时，取消函数callback注册
    };
  }, []);

  const midiInputDeviceMsg = (noteId, isOn) => {
    // console.log('乐理 midiInputDeviceMsg', noteId, isOn);
    pianoRef?.current?.changeNote(noteId, isOn);

    if (!isOn) {
      const index = pressKey.findIndex((noteObj) => noteObj.noteId === noteId);
      if (index !== -1) pressKey.splice(index, 1);
      if (pressKey.every((noteObj) => noteObj.isOn === false)) {
        setNoteType("");
        setList([]);
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
          checkChord(pressedNotes);
          pressedNotes = [];
        }
      }
    }
    if (isOn) {
      pressKey.push({ noteId, isOn });
      pressedNotes.push({ noteId, isOn });
      if (!timerId) {
        timerId = setTimeout(() => {
          timerId = null;
          checkChord(pressedNotes);
          pressedNotes = [];
        }, 50);
      }
    }
  };

  const appendNotes = (section, note) => {
    //填充乐谱小节
    section.forEach((item) => {
      item.notes += note;
    });
  };
  function initNote(timeSigns, clefBtns) {
    //把键盘状态清空
    for (var i = 0; i < lastNoteId.length; i++) {
      pianoRef?.current?.changeNote(lastNoteId[i], false);
    }

    lastNoteId = [];

    var beatNum = parseInt(timeSigns.split("/")[0]); //拍数

    var beatValue = (8 / parseInt(timeSigns.split("/")[1])) * 8; //拍号* 8;

    var note = "";

    for (var i = 0; i < beatNum; i++) {
      note += "z" + beatValue + " ";
    }

    // console.log("note:", note)
    if (clefBtns === "big") {
      //大谱表
      highSectionList = [
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
      ]; //大谱表高音部分

      lowSectionList = [
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
      ]; //大谱表低音部分

      appendNotes(highSectionList, note);
      appendNotes(lowSectionList, note);

      basicAbcStr = `X:1\nQ:100\nM:${timeSigns}\nL:${minNote}\nK:${keySign}\n%%MIDI program ${instrumentType}\n`;
      var abc =
        basicAbcStr +
        highPrefixStr +
        highSectionList.map((item) => item.notes).join("| ") +
        "|" +
        "\n" +
        lowPrefixStr +
        lowSectionList.map((item) => item.notes).join("| ") +
        "|";
      setDefaultAbcStr(abc);
    } else {
      sectionList = [
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
        { beats: 0, notes: "" },
      ]; //单谱表外

      appendNotes(sectionList, note);

      basicAbcStr = `X:1\nQ:100\nM:${timeSigns}\nL:${minNote}\nK:${keySign} ${clefBtns}\n%%MIDI program ${instrumentType}\n`;
      var abc =
        basicAbcStr + sectionList.map((item) => item.notes).join("| ") + "|";
      setDefaultAbcStr(abc);
    }
    tempBeats = 0; //临时节拍数
    lowTempBeats = 0; //大谱表低音临时节拍数
    highTempBeats = 0; //大谱表高音临时节拍数
    partIndex = 0; //当前谱表索引
    highPartIndex = 0; //大谱表高音表索引
    lowPartIndex = 0; //大谱表低音表索引
    index = 0; //当前谱表内索引
    backList = []; //回退索引列表
  }

  useEffect(() => {
    //初始化乐谱
    if (clefBtn === "big") {
      //大谱表
      basicAbcStr = `X:1\nQ:100\nM:${timeSign}\nL:${minNote}\nK:${keySign}\n%%MIDI program ${instrumentType}\n`;
      var abc =
        basicAbcStr +
        highPrefixStr +
        highSectionList.map((item) => item.notes).join("| ") +
        "|" +
        "\n" +
        lowPrefixStr +
        lowSectionList.map((item) => item.notes).join("| ") +
        "|";
      setDefaultAbcStr(abc);
    } else {
      basicAbcStr = `X:1\nQ:100\nM:${timeSign}\nL:${minNote}\nK:${keySign} ${clefBtn}\n%%MIDI program ${instrumentType}\n`;
      var abc =
        basicAbcStr + sectionList.map((item) => item.notes).join("| ") + "|";
      setDefaultAbcStr(abc);
    }
    // abcjs.renderAbc('paper', defaultAbcStr, defaultOptions);
    // scrollHorizontally("paper")
  }, [keySign, instrumentType]);

  const transformNote = (noteId) => {
    return noteId - noteMap[keySign];
  };

  const displayNote = (noteId, noteList) => {
    noteId = transformNote(noteId, keySign);

    const pitchOffset = noteId % 12;
    const octaveNum = Math.floor(noteId / 12);

    var pitchStr = noteList[pitchOffset + 1];
    return pitchStr;
  };

  // 更新大调状态
  const handleDataFromChild = (data) => {
    const index = data / 24;
    setKeySign(keySignatures[index]?.value);
  };

  const displayNotes = (noteId) => {
    noteId = transformNote(noteId, keySign);

    const octaveNum = Math.floor(noteId / 12);
    var pitchStr = "";

    if (octaveNum > 5) {
      let dots = "";
      for (let i = 0; i < octaveNum - 5; i++) {
        dots += ".";
      }
      pitchStr = dots;
    } else if (octaveNum < 5) {
      let dots = "";
      for (let i = 0; i < 5 - octaveNum; i++) {
        dots += ".";
      }
      pitchStr = dots;
    }
    return { octaveNum, pitchStr };
  };

  //键位id转为字符串
  const calcNotePitch = (noteId) => {
    // console.log("noteId", noteId)
    noteId = transformNote(noteId, keySign);

    if (restBtn) {
      var pitchStr = "z";
    } else {
      const pitchOffset = noteId % 12;
      const octaveNum = Math.floor(noteId / 12);

      if (pitchOffset < 0 || pitchOffset >= 12) {
        // console.log('音高计算错误')
        return "C";
      }

      var pitchStr = sharpBtn;

      pitchStr += noteList[pitchOffset + 1];
      if (!pitchStr) {
        // console.log('音高计算错误')
        return "C";
      }

      if (octaveNum > 6) {
        pitchStr = pitchStr.toLowerCase();
        for (let i = 0; i < octaveNum - 5; i++) {
          pitchStr += "'"; // ' 号表示小字二组以上的八度
        }
      } else if (octaveNum == 6) {
        pitchStr = pitchStr.toLowerCase(); //小字二组，小写表示
      } else if (octaveNum < 5) {
        for (let i = 0; i < 5 - octaveNum; i++) {
          pitchStr += ","; // , 号表示小字一组以下的八度
        }
      } else {
        //小字一组，符号不变
      }
    }
    // console.log("pitchStr", pitchStr);
    pitchStr += String((1 + dotBtn) * noteBtn);

    return pitchStr;
  };

  //字符串转为键位id
  const restoreNoteId = (pitchStr) => {
    var octaveNum = 5;

    const highOctave = (pitchStr.match(/'/g) || []).length;
    const lowOctave = (pitchStr.match(/,/g) || []).length;

    pitchStr = pitchStr.replace(/,+/, ""); //去掉降八度符号（`,`）

    pitchStr = pitchStr.replace(/'/g, ""); //去掉升八度符号（`'`）

    if (highOctave > 0) {
      octaveNum += highOctave;
    } else if (lowOctave > 0) {
      octaveNum -= lowOctave;
    } else if (/^[a-z]$/.test(pitchStr)) {
      octaveNum = 6;
    }

    pitchStr = pitchStr.toUpperCase();

    //计算 noteId
    var pitchOffset =
      Object.keys(noteList).find((key) => noteList[key] === pitchStr) - 1;

    var noteId = octaveNum * 12 + parseInt(pitchOffset);

    noteId += noteMap[keySign];

    return noteId;
  };

  //添加音符
  const addNote = (
    section,
    noteBtn,
    note,
    beatNum,
    beatValue,
    tempBeats,
    partIndex,
  ) => {
    // console.log(section)
    for (var i = 0; i < section.length + 1; i++) {
      // if (i >= 4) return tempBeats, message.warning("乐谱已满，无法继续添加小节");
      if (i >= 4 && i === section.length) {
        //超出加小节，4是初始乐谱小节数，
        section.push({ beats: 0, notes: " " });
      }

      if (i % 4 === 0 && i === section.length - 1 && section[i].beats === 0) {
        //每4小节换行
        section[i].notes += "\n";
      }

      if (section[i].beats === 0 && section[i].notes.lastIndexOf("z") !== -1) {
        section[i].notes = " ";
      }

      if (section[i].beats + noteBtn <= beatNum * beatValue) {
        //容纳小节
        if (section[i].notes.length == 1) {
          //新小节将拍数置为0
          tempBeats = 0;
        }

        if (section[i].notes.lastIndexOf(" ") !== -1) {
          var noteList = section[i].notes.substring(
            section[i].notes.lastIndexOf(" "),
            section[i].notes.length,
          );
          const numbers = noteList.match(/\d+/g);

          tempBeats = numbers
            ? numbers.reduce((acc, num) => acc + parseInt(num), 0)
            : 0;

          // console.log("tempBeats",tempBeats);
        }

        //添加音符
        if (tempBeats + noteBtn > beatValue) {
          //一个小节中
          section[i].notes += " ";
          tempBeats = 0;
        }

        section[i].beats += noteBtn; //更新小节拍值
        section[i].notes += note; // 添加音符
        tempBeats += noteBtn;

        return tempBeats;
      }
    }

    // if (section[partIndex].beats + noteBtn > beatNum * beatValue) {//超出则换下一小节
    //     partIndex++;
    //     if (partIndex >= 8) {//超出加小节
    //         section.push({ beats: 0, notes: "" })
    //     }
    // }

    // if (section[partIndex].notes.length == 0) {//新小节将拍数置为0
    //     tempBeats = 0;
    // }

    // //添加音符
    // if (tempBeats + noteBtn > beatValue) { //一个小节中
    //     section[partIndex].notes += " ";
    //     tempBeats = 0;
    // }

    // section[partIndex].beats += noteBtn; //更新小节拍值
    // section[partIndex].notes += note; // 添加音符
    // tempBeats += noteBtn;

    // return partIndex;
  };

  const addNoteAtEnd = (notePitch) => {
    var beatNum = parseInt(timeSign.split("/")[0]); //拍数

    var beatValue = (8 / parseInt(timeSign.split("/")[1])) * 8; //拍号* 8;

    var tempNoteBtn = noteBtn;

    if (tempNoteBtn > beatNum * beatValue)
      return message.warning("超出拍数，请重新选择音符");

    if (clefBtn === "big") {
      if (notePitch.indexOf(",") !== -1) {
        //低音区
        lowTempBeats = addNote(
          lowSectionList,
          tempNoteBtn,
          notePitch,
          beatNum,
          beatValue,
          lowTempBeats,
          lowPartIndex,
        );
      } else {
        //高音区
        highTempBeats = addNote(
          highSectionList,
          tempNoteBtn,
          notePitch,
          beatNum,
          beatValue,
          highTempBeats,
          highPartIndex,
        );
      }
      setDefaultAbcStr(
        basicAbcStr +
          highPrefixStr +
          highSectionList.map((item) => item.notes).join("|") +
          "|" +
          "\n" +
          lowPrefixStr +
          lowSectionList.map((item) => item.notes).join("| ") +
          "|",
      );
    } else {
      //单谱表
      tempBeats = addNote(
        sectionList,
        tempNoteBtn,
        notePitch,
        beatNum,
        beatValue,
        tempBeats,
        partIndex,
      );
      setDefaultAbcStr(
        basicAbcStr + sectionList.map((item) => item.notes).join("|") + "|",
      );
    }

    scrollHorizontally("paper");
    // console.log("section", sectionList)
    // 自动滚动到底部
    // scrollToBottom("abcjs");
  };

  const screenPianoChangeNote = (noteId, isOn) => {
    // console.log("beforenoteId", noteId)
    if (isOn && pressKey.some((item) => item.noteId === noteId)) return; //节流
    pianoRef?.current?.changeNote(noteId, isOn);
    midiSound.changeNote(noteId, isOn, 11);
    if (!isOn) {
      const index = pressKey.findIndex((noteObj) => noteObj.noteId === noteId);
      if (index !== -1) pressKey.splice(index, 1);
      if (pressKey.every((noteObj) => noteObj.isOn === false)) {
        setNoteType("");
        setList([]);
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
          checkChord(pressedNotes);
          pressedNotes = [];
        }
      }
    }
    if (isOn) {
      pressKey.push({ noteId, isOn });
      pressedNotes.push({ noteId, isOn });
      if (!timerId) {
        timerId = setTimeout(() => {
          timerId = null;
          checkChord(pressedNotes);
          pressedNotes = [];
        }, 50);
      }
    }
  };

  //判断是否为音程和弦,并添加音符
  const checkChord = (lists) => {
    const list = lists.map((item) => {
      return item.noteId;
    });
    var notePitch = "";
    // console.log("list", lists)
    var n = list.length;
    list.sort();
    setList(list);

    //音程
    if (n === 2) {
      var type = noteTypeList[(list[1] - list[0]) % 24];
      if (list[1] - list[0] >= 24) {
        //超过八度
        type = "复" + type;
      }

      setNoteType(type);
      notePitch = "[" + calcNotePitch(list[0]) + calcNotePitch(list[1]) + "]";
      addNoteAtEnd(notePitch);

      return;
    }

    //三和弦
    if (n === 3) {
      var first = list[1] - list[0];
      var second = list[2] - list[1];

      // 创建一个键，用于在threeChordMap中查找
      var key = `${first},${second}`;

      // 利用键在字典中查找对应的和弦名称
      var chordName = threeChordMap[key];

      if (chordName) {
        setNoteType(chordName);
        notePitch =
          "[" +
          calcNotePitch(list[0]) +
          calcNotePitch(list[1]) +
          calcNotePitch(list[2]) +
          "]";
        addNoteAtEnd(notePitch);
      } else {
        setNoteType("未知的和弦类型");

        list.map((noteId) => {
          notePitch = calcNotePitch(noteId);
          addNoteAtEnd(notePitch);
        });
      }
      return;
    }

    //七和弦
    if (n === 4) {
      var first = list[1] - list[0];
      var second = list[2] - list[1];
      var three = list[3] - list[2];

      // 创建一个键，用于在threeChordMap中查找
      var key = `${first},${second},${three}`;

      // 利用键在字典中查找对应的和弦名称
      var chordName = sevenChordMap[key];

      if (chordName) {
        setNoteType(chordName);
        notePitch =
          "[" +
          calcNotePitch(list[0]) +
          calcNotePitch(list[1]) +
          calcNotePitch(list[2]) +
          calcNotePitch(list[3]) +
          "]";
        addNoteAtEnd(notePitch);
      } else {
        setNoteType("未知的和弦类型");

        list.map((noteId) => {
          notePitch = calcNotePitch(noteId);
          addNoteAtEnd(notePitch);
        });
      }

      return;
    }

    //不是和弦
    list.map((noteId) => {
      notePitch = calcNotePitch(noteId);
      addNoteAtEnd(notePitch);
    });
  };

  //切换拍号
  const changeTimeSignature = (timeSignature) => {
    setTimeSign(timeSignature);
    initNote(timeSignature, clefBtn);
  };

  //切换调号
  const changeKeySignature = (keySignature) => {
    const index = keySignatures.findIndex(
      (item) => item.value === keySignature,
    );
    setActiveRotation(index * 24);
    // console.log('调用了按钮修改', keySignature)
    setKeySign(keySignature);
  };

  //切换谱号
  const changeClef = (clefBtn) => {
    setClefBtn(clefBtn);
    initNote(timeSign, clefBtn);
  };

  //TODO 回退未完成
  const handDelete = () => {
    var lastIndex = backList[backList.length - 1];
    var lastSecondIndex = backList[backList.length - 2];
    // console.log('backList:', backList)
    backList.pop();

    basicAbcStr = `X:1\nQ:100\nM:${timeSign}\nL:${minNote}\nK:${keySign}\n%%MIDI program ${instrumentType}\n`;
    var section = sectionList.map((item) => item.notes).join("|");
    setDefaultAbcStr(
      basicAbcStr +
        section.substring(0, lastSecondIndex) +
        section.substring(lastIndex, section.length - 1),
    );

    // console.log(defaultAbcStr);
    // abcjs.renderAbc('paper', defaultAbcStr, defaultOptions);
  };

  //清空
  const handClear = () => {
    initNote(timeSign, clefBtn);
  };

  //删除音符
  const deleteNote = (section, start, end, tempBeats) => {
    var i = 0,
      j = 0;
    while (start >= 0) {
      j = section[i].notes.length + 1; //需要加上"|"
      if (start >= j) {
        start -= j;
        end -= j;
        i++;
      } else {
        var noteList = section[i].notes.substring(start, end);
        var beat = 0;
        var numbers = noteList.match(/\d+/g);

        //删除小节对应的节拍数
        beat = numbers
          ? numbers.reduce((acc, num) => acc + parseInt(num), 0)
          : 0;

        section[i].beats -= beat;

        //删除小节的单一节拍数

        var startIndex =
          section[i].notes.lastIndexOf(" ", start) !== -1
            ? section[i].notes.lastIndexOf(" ", start)
            : 0;
        var endIndex =
          section[i].notes.indexOf(" ", end) !== -1
            ? section[i].notes.indexOf(" ", end)
            : section[i].notes.length;

        noteList = section[i].notes.substring(startIndex, endIndex);
        numbers = noteList.match(/\d+/g);

        tempBeats = numbers
          ? numbers.reduce((acc, num) => acc + parseInt(num), 0)
          : 0;

        // //根据前后节拍数判断是否合并
        // noteList = shighSectionList[i].notes.substring(section[i].notes.lastIndexOf(" ", start), section[i].notes.length);
        // numbers = noteList.match(/\d+/g);

        section[i].notes =
          section[i].notes.substring(0, start) +
          " " +
          section[i].notes.substring(end, section[i].notes.length);
        message.success("删除成功");
        break;
      }
    }

    return tempBeats;
  };

  // 删除选中的音符
  const deleteSelectNote = () => {
    if (clefBtn === "big") {
      //大谱表
      // 计算索引是否大于高音谱的长度
      var n = basicAbcStr.length + highPrefixStr.length;
      var highNotesLength =
        n +
        highSectionList.reduce((sum, item) => sum + item.notes.length + 1, 0);

      if (selectedNotes.startChar < highNotesLength) {
        //高音部
        var start = selectedNotes.startChar - n;
        var end = selectedNotes.endChar - n;

        tempBeats = deleteNote(highSectionList, start, end, highTempBeats);
      } else {
        //低音部
        var start =
          selectedNotes.startChar - highNotesLength - 1 - lowPrefixStr.length; //减去 "\n"和低音前缀
        var end =
          selectedNotes.endChar - highNotesLength - 1 - lowPrefixStr.length; //减去 "\n"和低音前拽

        lowTempBeats = deleteNote(lowSectionList, start, end, lowTempBeats);
      }
      setDefaultAbcStr(
        basicAbcStr +
          highPrefixStr +
          highSectionList.map((item) => item.notes).join("|") +
          "|" +
          "\n" +
          lowPrefixStr +
          lowSectionList.map((item) => item.notes).join("|") +
          "|",
      );
    } else {
      var n = basicAbcStr.length;
      var start = selectedNotes.startChar - n;
      var end = selectedNotes.endChar - n;

      tempBeats = deleteNote(sectionList, start, end, tempBeats);

      setDefaultAbcStr(
        basicAbcStr + sectionList.map((item) => item.notes).join("|") + "|",
      );
    }

    // abcjs.renderAbc('paper', defaultAbcStr, defaultOptions);
    // console.log(defaultAbcStr);
    // console.log(selectedNotes);

    setSelectedNotes({ startChar: 0, endChar: 0 });
  };

  //删除选中音符的小节
  const deleteSelectSection = () => {
    if (clefBtn === "big") {
      //大谱表
      // 计算索引是否大于高音谱的长度
      var n = basicAbcStr.length + highPrefixStr.length;
      var highNotesLength =
        n +
        highSectionList.reduce((sum, item) => sum + item.notes.length + 1, 0);

      if (selectedNotes.startChar < highNotesLength) {
        //高音部
        var n = basicAbcStr.length;
        var start = selectedNotes.startChar - n;

        var i = 0,
          sum = 0;

        while (sum <= start) {
          sum += highSectionList[i].notes.length + 1;
          i++;
        }

        if (i == 1) {
          highSectionList[i - 1].notes = "V:1 treble\n ";
        } else {
          highSectionList[i - 1].notes = " ";
        }

        highSectionList[i - 1].beats = 0;
        highTempBeats = 0;
      } else {
        //低音部
        var start =
          selectedNotes.startChar - highNotesLength - 1 - lowPrefixStr.length;
        var i = 0,
          sum = 0;

        while (sum <= start) {
          sum += lowSectionList[i].notes.length + 1;
          i++;
        }

        if (i == 1) {
          lowSectionList[i - 1].notes = "V:2 bass\n ";
        } else {
          lowSectionList[i - 1].notes = " ";
        }

        lowSectionList[i - 1].beats = 0;
        lowTempBeats = 0;
      }
      setDefaultAbcStr(
        basicAbcStr +
          highPrefixStr +
          highSectionList.map((item) => item.notes).join("|") +
          "|" +
          "\n" +
          lowPrefixStr +
          lowSectionList.map((item) => item.notes).join("| ") +
          "|",
      );
    } else {
      var n = basicAbcStr.length;
      var start = selectedNotes.startChar - n;
      var i = 0,
        sum = 0;

      while (sum <= start) {
        sum += sectionList[i].notes.length + 1;
        i++;
      }

      sectionList[i - 1].notes = " ";
      sectionList[i - 1].beats = 0;
      tempBeats = 0;

      setDefaultAbcStr(
        basicAbcStr + sectionList.map((item) => item.notes).join("|") + "|",
      );
    }

    // abcjs.renderAbc('paper', defaultAbcStr, defaultOptions);
    // console.log(defaultAbcStr);
    // console.log(selectedNotes);

    setSelectedNotes({ startChar: 0, endChar: 0 });
  };

  //切换音色
  const changeInstrument = (instrument) => {
    setInstrumentType(instrument);
    midiSound.switchID(11, instrument); //本模块维护MIDI 11 channel ，将11channel切换为对应音色
  };

  return (
    <div
      style={{
        width: "auto",
        height: "90vh",
        left: "2vw",
        margin: ".3rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {!unfold && (
        <div
          style={{
            width: "100%",
            height: "35vh",
            overflow: "auto",
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ width: "70%", marginLeft: "2vw", marginTop: "2vh" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "33%",
                  display: "flex",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "0.42rem",
                    height: "0.76rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    background: "#FC6874",
                    boxShadow: "0px 0px 0.06rem 0px rgba(0,0,0,0.32)",
                    borderRadius: "0.07rem",
                  }}
                >
                  <p
                    style={{
                      writingMode: "vertical-lr",
                      fontFamily: "SimHei",
                      fontWeight: 400,
                      fontSize: "0.2rem",
                      color: "#FFFFFF",
                    }}
                  >
                    音程
                  </p>
                </div>
                <div
                  style={{
                    width: "2.75rem",
                    height: "1.4rem",
                    background: " #FDFDFB",
                    boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                    borderRadius: "0.18rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "SimHei",
                      fontWeight: 400,
                      fontSize: "0.3rem",
                      textAlign: "center",
                    }}
                  >
                    {noteType}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "33%",
                  display: "flex",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "0.42rem",
                    height: "0.76rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    background: "#FC6874",
                    boxShadow: "0px 0px 0.06rem 0px rgba(0,0,0,0.32)",
                    borderRadius: "0.07rem",
                  }}
                >
                  <p
                    style={{
                      writingMode: "vertical-lr",
                      fontFamily: "SimHei",
                      fontWeight: 400,
                      fontSize: "0.2rem",
                      color: "#FFFFFF",
                    }}
                  >
                    简谱
                  </p>
                </div>
                <div
                  style={{
                    width: "2.75rem",
                    height: "1.4rem",
                    background: " #FDFDFB",
                    boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                    borderRadius: "0.18rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {list.map((item, index) => {
                    return (
                      <div
                        key={"jinapu" + index}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          alignContent: "space-between",
                        }}
                      >
                        {displayNotes(item).octaveNum > 5 && (
                          <div
                            style={{
                              writingMode: "vertical-lr",
                              width: "0.5rem",
                              color: "black",
                              textAlign: "center",
                              fontSize: "0.6rem",
                            }}
                          >
                            {displayNotes(item).pitchStr}
                          </div>
                        )}
                        <div
                          style={{
                            color: "black",
                            textAlign: "center",
                            fontSize: "0.3rem",
                            fontWeight: 400,
                            width: "0.4rem",
                          }}
                        >
                          {displayNote(item, simpleNoteList)}
                        </div>
                        {displayNotes(item).octaveNum < 6 && (
                          <div
                            style={{
                              writingMode: "vertical-lr",
                              width: "0.5rem",
                              color: "black",
                              textAlign: "center",
                              fontSize: "0.6rem",
                            }}
                          >
                            {displayNotes(item).pitchStr}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                style={{
                  width: "33%",
                  display: "flex",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "0.42rem",
                    height: "0.76rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    background: "#FC6874",
                    boxShadow: "0px 0px 0.06rem 0px rgba(0,0,0,0.32)",
                    borderRadius: "0.07rem",
                  }}
                >
                  <p
                    style={{
                      writingMode: "vertical-lr",
                      fontFamily: "SimHei",
                      fontWeight: 400,
                      fontSize: "0.2rem",
                      color: "#FFFFFF",
                    }}
                  >
                    音名
                  </p>
                </div>
                <div
                  style={{
                    width: "2.75rem",
                    height: "1.4rem",
                    background: " #FDFDFB",
                    boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                    borderRadius: "0.18rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {" "}
                  {list.map((item, index) => {
                    return (
                      <div
                        key={"yinming" + index}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          alignContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            color: "black",
                            textAlign: "center",
                            fontSize: "0.3rem",
                            fontWeight: 400,
                            width: "0.4rem",
                          }}
                        >
                          {displayNote(item, noteLists)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <FiveDegreeCirculation
              activeRotation={activeRotation}
              onData={handleDataFromChild}
            />
            <Tabs
              className="music-theory-tab"
              activeKey={secondActiveKey}
              onChange={(key) => {
                setSecondActiveKey(key);
              }}
              items={secondType}
              style={{ fontSize: ".2rem" }}
            />
            {secondActiveKey == 0 && (
              <Space size={"large"}>
                {noteBtnList.map((item) => {
                  return (
                    <div
                      key={"noteBtn: " + item.value}
                      value={item.value}
                      style={{
                        background: item.value === noteBtn ? "#FA5B39" : "#fff",
                        width: "0.62rem",
                        height: "0.62rem",
                        cursor: "pointer",
                        boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                        borderRadius: "0.06rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onClick={() => {
                        setNoteBtn(item.value);
                      }}
                    >
                      <div
                        style={{
                          filter:
                            (item.value === noteBtn && noteBtn !== 16) ||
                            (noteBtn !== 16 && item.value === 16)
                              ? "invert(100%)"
                              : "",
                        }}
                      >
                        <img
                          src={baseUrl + item.label}
                          style={{
                            maxHeight: "0.4rem",
                            width: item.value === 64 ? "0.25rem" : "auto",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    background: restBtn ? "#FA5B39" : "#fff",
                    width: ".62rem",
                    height: ".62rem",
                    cursor: "pointer",
                    boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                    borderRadius: "0.06rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onClick={() => {
                    setRestBtn(!restBtn);
                  }}
                >
                  <div style={{ filter: restBtn ? "invert(100%)" : "" }}>
                    <img
                      src={baseUrl + "/image/musicNote/left.png"}
                      style={{ height: ".4rem" }}
                    />
                    <img
                      src={baseUrl + "/image/musicNote/right.png"}
                      style={{ height: ".4rem" }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    background: dotBtn === 0.5 ? "#FA5B39" : "#fff",
                    width: ".62rem",
                    height: ".62rem",
                    cursor: "pointer",
                    boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                    borderRadius: "0.06rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onClick={() => {
                    setDotBtn(dotBtn === 0.5 ? 0 : 0.5);
                  }}
                >
                  <div style={{ filter: dotBtn === 0.5 ? "invert(100%)" : "" }}>
                    <img src={baseUrl + "/image/musicNote/dot.png"} />
                  </div>
                </div>
                {sharpBtnList.map((item) => {
                  return (
                    <div
                      style={{
                        background:
                          sharpBtn === item.value ? "#FA5B39" : "#fff",
                        width: ".62rem",
                        height: ".62rem",
                        cursor: "pointer",
                        boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                        borderRadius: "0.06rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onClick={() => {
                        setSharpBtn(sharpBtn === item.value ? "" : item.value);
                      }}
                      key={"sharpBtn: " + item.value}
                    >
                      <div
                        style={{
                          filter: sharpBtn === item.value ? "invert(100%)" : "",
                        }}
                      >
                        <img
                          src={baseUrl + item.label}
                          style={{
                            maxHeight:
                              item.value === "^^" ? ".23rem" : "0.3rem",
                          }}
                        />
                        {item.value === "__" && (
                          <img
                            src={baseUrl + item.label}
                            style={{ maxHeight: "0.3rem" }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </Space>
            )}
            {secondActiveKey == 1 && (
              <Space size={"large"}>
                {chordList.map((item) => {
                  return (
                    <Button
                      onMouseDown={() => handleMouseDown(item.value)}
                      onMouseUp={() => handleMouseUp(item.value)}
                      key={item.label}
                      type="button"
                      style={{
                        width: "1rem",
                        height: "0.62rem",
                        cursor: "pointer",
                        boxShadow: "0px 0px 6px 1px rgba(0,0,0,0.32)",
                        borderRadius: "0.06rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Space>
            )}
          </div>
          <div style={{ width: "30%", height: "100%" }}></div>
        </div>
      )}
      <div
        id="abcjs"
        style={{
          height: unfold ? "66vh" : "27vh",
          overflowY: "auto",
          backgroundColor: "#fff",
        }}
      >
        <div id="paper" ref={container} />
      </div>
      <div style={{ backgroundColor: "#fff" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#1E1D22",
            padding: "0 0.1rem",
            height: "0.6rem",
          }}
        >
          <div id="audio" ref={audioRef}></div>
          <Select
            className="music-theory-select "
            value={instrumentType}
            options={instrumentList}
            onChange={(e) => changeInstrument(e)}
          ></Select>
          <div>
            <Select
              className="music-theory-select "
              value={timeSign}
              options={timeSignatures}
              onChange={(e) => changeTimeSignature(e)}
            ></Select>
            <Select
              className="music-theory-select "
              value={clefBtn}
              options={clefList}
              onChange={(e) => changeClef(e)}
            ></Select>
            <Select
              className="music-theory-select "
              value={keySign}
              options={keySignatures}
              onChange={(e) => changeKeySignature(e)}
            ></Select>
          </div>
          <div>
            <Button
              className="musicTheory-button"
              type="button"
              style={{}}
              onClick={handClear}
            >
              清空
            </Button>
            <Button
              className="musicTheory-button"
              type="button"
              onClick={() => {
                setUnfold(!unfold);
              }}
            >
              {unfold ? "收起" : "展开"}
            </Button>
            <Button
              className="musicTheory-button"
              type="button"
              onClick={() => {
                setIsDisPlayNote(!isDisPlayNote);
              }}
            >
              {isDisPlayNote ? "隐藏键盘提示" : "显示键盘提示"}
            </Button>
            <Button
              className="musicTheory-button"
              type="button"
              disabled={selectedNotes.endChar === 0}
              onClick={deleteSelectNote}
            >
              删除选中音符
            </Button>
            <Button
              className="musicTheory-button"
              type="button"
              disabled={selectedNotes.endChar === 0}
              onClick={deleteSelectSection}
            >
              删除选中小节
            </Button>
          </div>
        </div>
        <Piano
          notePlay={(id, isOn) => screenPianoChangeNote(id, isOn)}
          ref={pianoRef}
          keySign={keySign}
          isDisPlayNote={isDisPlayNote}
        />
      </div>
    </div>
  );
}
