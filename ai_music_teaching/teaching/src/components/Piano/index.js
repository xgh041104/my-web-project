import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
// 音符文件
import notes from './notes.js'

// 音符和键盘的映射关系表
import pianoKeys from './pianoKeys.js'
import { PianoStyle } from './styles.js';

const Piano = React.forwardRef((props, ref) => {
  const [state, setState] = useState({ notes, pianoKeys });
  const refs = useRef({});
  const isTouching = useRef(false);

  const { notePlay } = props;


  useImperativeHandle(ref, () => ({
    changeNote: (id, isOn) => {
      changeNoteState(id, isOn);
    }
  }));

  const changeNoteState = (id, isOn) => {
    if (isOn) {
      // console.log(state.pianoKeys)
      refs.current[id].style.background = `linear-gradient(-20deg, #3330fb, #000, #222)`
      // 设置对应的音符为正在播放，相当于节流的开关
      state.notes[id]["isPlay"] = true
    }
    else {
      state.notes[id]["isPlay"] = false
      refs.current[id].getAttribute('data-type') === 'white' ? refs.current[id].style.background = `linear-gradient(-30deg, #f8f8f8, #fff)` : refs.current[id].style.background = `linear-gradient(-20deg, #222, #000, #222)`
    }
  }

  const playNote = (isOn, id) => {
    // console.log(isOn,id)
    if (id > 108 || id < 21) { //扩展piano的判断到21-108键位
      return;
    }

    if (state.notes[id]["isPlay"] != isOn)
      notePlay(id, isOn);

    changeNoteState(id, isOn);
  }

  return (
    <PianoStyle>
      <div className="">
        {/* <div className="child-wrap">
                    <p>子组件{props.changeNote.id}</p>
                  </div> */}
        <div className="piano">
          {state.pianoKeys.map((item, index) => {
            return (
              <div key={index} className="piano-key">
                <div data-type="white" ref={e => { refs.current[item.white.keyCode] = e }} className="piano-key__white"
                  onMouseDown={() => {
                    if (isTouching.current) return;
                    playNote(true, item.white.keyCode)
                  }}
                  onTouchStart={() => {
                    isTouching.current = true;
                    playNote(true, item.white.keyCode)
                  }}
                  onMouseUp={() => {
                    isTouching.current = false;
                    playNote(false, item.white.keyCode)
                  }}
                  onTouchEnd={() => {
                    playNote(false, item.white.keyCode)
                  }}
                  onMouseLeave={() => playNote(false, item.white.keyCode)}
                  onTouchMove={() => playNote(false, item.white.keyCode)}
                  // onMouseEnter={() => playNote(true, item.white.keyCode)}
                  data-key={item.white.keyCode}
                  data-note={item.white.keyCode}>
                  <span className="piano-note">{item.white.keyCode}</span>
                </div>
                <div data-type="black" ref={e => { refs.current[item.black.keyCode] = e }} style={{
                  display: item.black.name ? 'block' : 'none'
                }} className="piano-key__black" data-key={item.black.keyCode}
                  onMouseDown={() => {
                    if (isTouching.current) return;
                    playNote(true, item.black.keyCode)
                  }}
                  // onMouseEnter={() => playNote(true, item.black.keyCode)}
                  onMouseUp={() => {
                    isTouching.current = false;
                    playNote(false, item.black.keyCode)
                  }}
                  onTouchStart={() => {
                    isTouching.current = true;
                    playNote(true, item.black.keyCode)
                  }}
                  onMouseLeave={() => playNote(false, item.black.keyCode)}
                  onTouchEnd={() => playNote(false, item.black.keyCode)}
                  onTouchMove={() => playNote(true, item.black.keyCode)}
                  data-note={item.black.keyCode}>
                  <span className="piano-note" style={{ color: "#fff" }}>{item.black.keyCode}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PianoStyle>
  );
})

export default Piano