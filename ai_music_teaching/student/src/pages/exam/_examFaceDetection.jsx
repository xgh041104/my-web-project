import { message, Button, Modal, Space, Row, Col, Spin } from 'antd'
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { history } from 'umi';

function ExamFaceDetection({ dispatch }, ref) {


  const shouldEnterExam = (examState = null, faceVerify = null) => {
    dispatch({ type: "examCenter/updateState", payload: { captureEnable: true } })
    history.push({
      pathname: '/exam/exampage',
      state: examState
    });
    return;
  }


  useImperativeHandle(
    ref,
    () => ({
      shouldEnterExam
    }),
    [],
  )
}

export default forwardRef(ExamFaceDetection);
