import React from 'react'
import { Pie } from '@ant-design/plots';
import { Empty } from 'antd'

function ExamStatistic({ examResultDetail }) {

  const ranges = [
    { type: "优秀", max: 100, min: 90, key: "0" },
    { type: "良好", max: 89, min: 80, key: "1" },
    { type: "中等", max: 79, min: 70, key: "2" },
    { type: "及格", max: 69, min: 60, key: "3" },
    { type: "不及格", max: 59, min: 0, key: "4" },
  ];
  let statisticDatas = {};
  if(examResultDetail&&Array.isArray(examResultDetail)&&examResultDetail.length>0){
    examResultDetail.forEach(studentResult => {
      const targetRange = ranges.find(cond => cond.min <= studentResult.Score && studentResult.Score <= cond.max)
      if (!targetRange) {
        return;
      }
      if (!statisticDatas.hasOwnProperty(targetRange.key)) {
        statisticDatas[targetRange.key] = { type: targetRange.type, key: targetRange.key, results: [studentResult.TrueName,], value: 1 }
      }
      else {
        statisticDatas[targetRange.key].results.push(studentResult.TrueName)
        statisticDatas[targetRange.key].value += 1;
      }
  
    })
  }

  const config = {
    appendPadding: 10,
    data: Object.values(statisticDatas),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'inner',
      content: '{name} {percentage}',
    },
    tooltip: {
      fields: ['type', 'results'],
      formatter: (item) => ({
        name: item.type + "学生", value: item.results.join("、")
      }),
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };
  return examResultDetail && examResultDetail.length > 0 ? <Pie {...config} /> : <Empty />;
}

export default ExamStatistic