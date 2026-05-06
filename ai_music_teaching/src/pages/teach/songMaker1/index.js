import React, { useState, useEffect } from 'react'

export default function SongMaker1() {

  return <div style={{ width: '88vw', height: '90vh', left: '2vw', margin: '.3rem' }}>
    <iframe style={{ width: '97vw', height: '90vh', border: '0' }}
      src='https://ebarotech.cn/googlesongmaker/index.html'
      allow='autoplay; microphone; midi'
    >

    </iframe>
  </div>
}