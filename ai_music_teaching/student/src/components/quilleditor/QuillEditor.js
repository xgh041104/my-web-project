import React, { useRef, useMemo } from 'react'

import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import quillEmoji from 'quill-emoji';
import "quill-emoji/dist/quill-emoji.css"; //这个不引入的话会出现emoji框一直在输入框下面的情况
import { ImageDrop } from 'quill-image-drop-module'; //讲图片拖进文本框，可以直接安装quill-image-drop-module；但由于我的webpack版本过低，无法兼容es6，所以把插件拿出来了

const { EmojiBlot, ShortNameEmoji, ToolbarEmoji, TextAreaEmoji } = quillEmoji;
Quill.register({
  'formats/emoji': EmojiBlot,
  // 'formats/video': VideoBlot,
  'modules/emoji-shortname': ShortNameEmoji,
  'modules/emoji-toolbar': ToolbarEmoji,
  'modules/emoji-textarea': TextAreaEmoji,
  'modules/ImageDrop': ImageDrop, //复制粘贴组件
}, true);

export default function QuillEditor(props) {

  const quillRef = useRef();

  const appendFile = (type, url) => {
    let quill = quillRef.current.getEditor();//获取到编辑器本身
    const cursorPosition = quill.getSelection().index;//获取当前光标位置
    console.log(`get ${type} url:`, url);
    quill.insertEmbed(cursorPosition, type, url);//插入图片
    quill.setSelection(cursorPosition + 1);//光标位置加1
  }

  const isSupportFiles = (input, acceptFiles = ["jpg", "jpeg", "png"]) => {
    if (input.files.length == 0) {
      return false;
    }
    let unsupportfiles = []
    input.files.forEach((f, key) => {
      if (!acceptFiles.includes(f.name.split('.').pop())) {
        unsupportfiles.push(f.name);
      }
    })
    if (unsupportfiles.length > 0) {
      message.error(`不支持此格式的文件:【${unsupportfiles.join("|")}】`, 5)
      return false;
    }
    return true;
  }

  const imageHandler = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', ".jpg, .jpeg, .png")
    input.setAttribute('multiple', 'multiple')
    input.click()
    input.onchange = () => {
      if (!isSupportFiles(input)) {
        return false;
      }
      // TODO:多个文件上传时需显示文件上传进度
      props.onfileUpload && props.onfileUpload(input.files)
        .then(url => {
          appendFile("image", url);
        })
    }
  }
  const videoHandler = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', ".avi, .mp4, .mov, .wmv, .flv, .mkv, .mpg, .rmvb")
    input.setAttribute('multiple', 'multiple')
    input.click()
    input.onchange = () => {
      if (!isSupportFiles(input, ["avi", "mp4", "mov", "wmv", "flv", "mkv", "mpg", "rmvb"])) {
        return false;
      }
      // TODO:多个文件上传时需显示文件上传进度
      props.onfileUpload && props.onfileUpload(input.files)
        .then(url => {
          appendFile("video", url);
          // }
        })
    }

  }

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }], //标题字号，不能设置单个字大小
        [{ 'size': ['small', false, 'large', 'huge'] }], //字体设置
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image', 'video'], // a链接和图片的显示
        [{ 'align': [] }],
        [{
          'background': ['rgb(  0,   0,   0)', 'rgb(230,   0,   0)', 'rgb(255, 153,   0)',
            'rgb(255, 255,   0)', 'rgb(  0, 138,   0)', 'rgb(  0, 102, 204)',
            'rgb(153,  51, 255)', 'rgb(255, 255, 255)', 'rgb(250, 204, 204)',
            'rgb(255, 235, 204)', 'rgb(255, 255, 204)', 'rgb(204, 232, 204)',
            'rgb(204, 224, 245)', 'rgb(235, 214, 255)', 'rgb(187, 187, 187)',
            'rgb(240, 102, 102)', 'rgb(255, 194, 102)', 'rgb(255, 255, 102)',
            'rgb(102, 185, 102)', 'rgb(102, 163, 224)', 'rgb(194, 133, 255)',
            'rgb(136, 136, 136)', 'rgb(161,   0,   0)', 'rgb(178, 107,   0)',
            'rgb(178, 178,   0)', 'rgb(  0,  97,   0)', 'rgb(  0,  71, 178)',
            'rgb(107,  36, 178)', 'rgb( 68,  68,  68)', 'rgb( 92,   0,   0)',
            'rgb(102,  61,   0)', 'rgb(102, 102,   0)', 'rgb(  0,  55,   0)',
            'rgb(  0,  41, 102)', 'rgb( 61,  20,  10)']
        }],
        [{
          'color': ['rgb(  0,   0,   0)', 'rgb(230,   0,   0)', 'rgb(255, 153,   0)',
            'rgb(255, 255,   0)', 'rgb(  0, 138,   0)', 'rgb(  0, 102, 204)',
            'rgb(153,  51, 255)', 'rgb(255, 255, 255)', 'rgb(250, 204, 204)',
            'rgb(255, 235, 204)', 'rgb(255, 255, 204)', 'rgb(204, 232, 204)',
            'rgb(204, 224, 245)', 'rgb(235, 214, 255)', 'rgb(187, 187, 187)',
            'rgb(240, 102, 102)', 'rgb(255, 194, 102)', 'rgb(255, 255, 102)',
            'rgb(102, 185, 102)', 'rgb(102, 163, 224)', 'rgb(194, 133, 255)',
            'rgb(136, 136, 136)', 'rgb(161,   0,   0)', 'rgb(178, 107,   0)',
            'rgb(178, 178,   0)', 'rgb(  0,  97,   0)', 'rgb(  0,  71, 178)',
            'rgb(107,  36, 178)', 'rgb( 68,  68,  68)', 'rgb( 92,   0,   0)',
            'rgb(102,  61,   0)', 'rgb(102, 102,   0)', 'rgb(  0,  55,   0)',
            'rgb(  0,  41, 102)', 'rgb( 61,  20,  10)']
        }],
        ['clean'], //清空
        ['emoji'], //emoji表情，设置了才能显示
      ],
      handlers: {
        'video': videoHandler,
        'image': imageHandler,
      },
    },
    ImageDrop: true,
    'emoji-toolbar': true,  //是否展示出来
    "emoji-textarea": false, //我不需要emoji展示在文本框所以设置为false
    "emoji-shortname": true,
  }), []);
  // 修改ReactQuill onChange content为空的情况
  const onChnage = (content, delta, source, editor) => {
    if (content === "<p><br></p>") {
      props.onChange && props.onChange("", delta, source, editor)
      return;
    }
    props.onChange && props.onChange(content, delta, source, editor)
  }

  return <ReactQuill ref={quillRef} modules={quillModules} theme="snow" {...props}
      onChange={onChnage} />
}
