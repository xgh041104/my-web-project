import React from 'react'
import { baseUrl } from 'config'

export default function Rhythm() {

  return <div style={{ width: '88vw', height: '90vh', left: '2vw', margin: '.3rem' }}>
    <div style={{
      position: 'absolute',
      left: '50%',
      fontSize: '.45rem',
      fontWeight: '600',
    }}>节奏教学</div>
    <iframe style={{ width: '97vw', height: '90vh', border: '0' }}
      src={baseUrl + '/rhythm/index.html'}
      allow='autoplay; microphone; midi'
    >

    </iframe>
  </div>
}
