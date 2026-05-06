import { baseUrl } from 'config'

export default function AICreateMusic() {
  return (
    <div style={{ width: '88vw', height: '90vh', left: '2vw', margin: '.3rem' }}>
      <iframe style={{ width: '97vw', height: '90vh', border: '0' }}
        src={baseUrl + '/AiCreate/dist/edit.html'}
        allow='autoplay; microphone; midi'
      >
      </iframe>
    </div>
  )
}
