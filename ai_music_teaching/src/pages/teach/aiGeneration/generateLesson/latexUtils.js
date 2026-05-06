
export function convertLatexToText(text) {
  return text
    .replace(/\$(.*?)\$/g, (match, p1) => {
      return p1
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\frac{(\d+)}{(\d+)}/g, '$1/$2')
        .replace(/\\pi/g, 'π')
        .replace(/\\sqrt{(\d+)}/g, '√$1')
        .replace(/\\pm/g, '±')
        .replace(/\\degree/g, '°')
    })
    .replace(/\\$(.+?)\\$/g, '$1')
    .replace(/\\$$(.+?)\\$$/g, '$1')
    .replace(/---/g, '');
}

