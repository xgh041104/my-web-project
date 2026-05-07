

export default[{
  black: { name: "C#2", keyCode: 37 },
  white: { name: "C2", keyCode: 36 },
},
{
  black: { name: "D#2", keyCode: 39 },
  white: { name: "D2", keyCode: 38 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "E2", keyCode: 40 },
},
{
  black: { name: "F#2", keyCode: 42 },
  white: { name: "F2", keyCode: 41 },
},
{
  black: { name: "G#2", keyCode: 44 },
  white: { name: "G2", keyCode: 43 },
},
{
  black: { name: "A#2", keyCode: 46 },
  white: { name: "A2", keyCode: 45 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "B2", keyCode: 47 },
},
{
  black: { name: "C#3", keyCode: 49 },
  white: { name: "C3", keyCode: 48 },
},
{
  black: { name: "D#3", keyCode: 51 },
  white: { name: "D3", keyCode: 50 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "E3", keyCode: 52 },
},
{
  black: { name: "F#3", keyCode: 54 },
  white: { name: "F3", keyCode: 53 },
},
{
  black: { name: "G#3", keyCode: 56 },
  white: { name: "G3", keyCode: 55 },
},
{
  black: { name: "A#3", keyCode: 58 },
  white: { name: "A3", keyCode: 57 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "B3", keyCode: 59 },
},
{
  black: { name: "C#4", keyCode: 61 },
  white: { name: "C4", keyCode: 60 },
},
{
  black: { name: "D#4", keyCode: 63 },
  white: { name: "D4", keyCode: 62 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "E4", keyCode: 64 },
},
{
  black: { name: "F#4", keyCode: 66 },
  white: { name: "F4", keyCode: 65 },
},
{
  black: { name: "G#4", keyCode: 68 },
  white: { name: "G4", keyCode: 67 },
},
{
  black: { name: "A#4", keyCode: 70 },
  white: { name: "A4", keyCode: 69 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "B4", keyCode: 71 },
},
{
  black: { name: "C#5", keyCode: 73 },
  white: { name: "C5", keyCode: 72 },
},
{
  black: { name: "D#5", keyCode: 75 },
  white: { name: "D5", keyCode: 74 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "E5", keyCode: 76 },
},
{
  black: { name: "F#5", keyCode: 78 },
  white: { name: "F5", keyCode: 77 },
},
{
  black: { name: "G#5", keyCode: 80 },
  white: { name: "G5", keyCode: 79 },
},
{
  black: { name: "A#5", keyCode: 82 },
  white: { name: "A5", keyCode: 81 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "B5", keyCode: 82 },
},
{
  black: { name: "C#6", keyCode: 85 },
  white: { name: "C6", keyCode: 84 },
},
{
  black: { name: "D#6", keyCode: 86 },
  white: { name: "D6", keyCode: 87 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "E6", keyCode: 88 },
},
{
  black: { name: "F#6", keyCode: 90 },
  white: { name: "F6", keyCode: 89 },
},
{
  black: { name: "G#6", keyCode: 92 },
  white: { name: "G6", keyCode: 91 },
},
{
  black: { name: "A#6", keyCode: 93 },
  white: { name: "A6", keyCode: 94 },
},
{
  black: { name: null, keyCode: null },
  white: { name: "B6", keyCode: 95 }
}]

// 创建音符和键盘的映射关系表 用于生成上面的数组
// const pianoKeys = () => {
//   // 存放钢琴的按键顺序
//   let pianoKeys = [];
//   [2, 3, 4, 5, 6, 7].map((item) => {
//     console.log(pianoKeys);
//     pianoKeys = pianoKeys.concat([{
//           white: {
//               name: `C${item}`,
//               keyCode: 12*(item+1)+0
//           },
//           black: {
//               name: `C#${item}`,
//               keyCode: 12*(item+1)+1
//           }
//       }, {
//           white: {
//               name: `D${item}`,
//               keyCode: 12*(item+1)+2
//           },
//           black: {
//               name: `D#${item}`,
//               keyCode: 12*(item+1)+3
//           }
//       }, {
//           white: {
//               name: `E${item}`,
//               keyCode: 12*(item+1)+4
//           },
//           black: {
//               name: null,
//               keyCode: null
//           }
//       }, {
//           white: {
//               name: `F${item}`,
//               keyCode: 12*(item+1)+5
//           },
//           black: {
//               name: `F#${item}`,
//               keyCode: 12*(item+1)+6
//           }
//       }, {
//           white: {
//               name: `G${item}`,
//               keyCode: 12*(item+1)+7
//           },
//           black: {
//               name: `G#${item}`,
//               keyCode: 12*(item+1)+8
//           }
//       }, {
//           white: {
//               name: `A${item}`,
//               keyCode: 12*(item+1)+9
//           },
//           black: {
//               name: `A#${item}`,
//               keyCode: 12*(item+1)+10
//           }
//       }, {
//           white: {
//               name: `B${item}`,
//               keyCode: 12*(item+1)+11
//           },
//           black: {
//               name: null,
//               keyCode: null
//           }
//       }])
//   })
//   return pianoKeys
// }


// export default pianoKeys