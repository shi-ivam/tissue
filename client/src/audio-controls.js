const css = require('dom-css')

module.exports = function createAudioControls (audio, tracks) {
  tracks = tracks.map(t => Object.assign({}, t))
  const controlsContainer = document.querySelector('.controls-container')
  const trackSelector = document.querySelector('.track-selector')
  const titleEl = document.querySelector('.title')
  const artistEl = document.querySelector('.artist')
  const timeEl = document.querySelector('.elapsed-time')
  const seekerEl = document.querySelector('.seeker')
  const progressEl = document.querySelector('.progress')
  const width = 290 // must match .controls-container width

  tracks.map((track, i) => {
    const trackEl = trackSelector.appendChild(document.createElement('li'))
    trackEl.classList.add('track')
    trackEl.addEventListener('click', () => {
      setTrack(tracks[i])
      audio.play()
    })
    trackEl.innerHTML = '<span>0' + (1 + i) + '.</span> ' + track.title
    track.el = trackEl
  })

  function setTrack (track) {
    audio.src = track.path
    tracks.forEach(t => t.el.classList.remove('selected'))
    track.el.classList.add('selected')
    titleEl.innerText = track.title
    artistEl.innerText = track.artist
  }

  setTrack(tracks[0])

  function tick () {
    const t = audio.currentTime / audio.duration
    css(progressEl, 'width', `${t * 100}%`)
    timeEl.innerText = formatSeconds(audio.currentTime)
  }

  seekerEl.addEventListener('click', e => {
    const { left } = seekerEl.getBoundingClientRect()
    const t = (e.clientX - left) / width
    audio.currentTime = t * audio.duration
  })

  window.addEventListener('keypress', (e) => {
    if (e.key === ' ') {
      togglePlay()
    }
  })

  return {
    el: controlsContainer,
    tick: tick
  }

  function togglePlay () {
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }
}

function formatSeconds (seconds) {
  const minutes = seconds / 60 | 0
  seconds = '' + (seconds % 60 | 0)
  if (seconds.length === 1) {
    seconds = `0${seconds}`
  }
  return `${minutes}:${seconds}`
}

const gitHubSVG = `
  <svg width="30px" height="30px" viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M15,0.0576923077 C6.72580645,0.0576923077 0.00806451613,6.91483516 0.00806451613,15.3791209 C0.00806451613,22.1456044 4.30645161,27.8901099 10.2580645,29.9175824 C11.0080645,30.0576923 11.25,29.5879121 11.25,29.1840659 L11.25,26.3241758 C7.08064516,27.2554945 6.20967742,24.5192308 6.20967742,24.5192308 C5.53225806,22.7472527 4.5483871,22.2774725 4.5483871,22.2774725 C3.18548387,21.3296703 4.65322581,21.3461538 4.65322581,21.3461538 C6.16129032,21.4532967 6.9516129,22.9285714 6.9516129,22.9285714 C8.29032258,25.2692308 10.4596774,24.5934066 11.3145161,24.1978022 C11.4516129,23.2087912 11.8387097,22.532967 12.266129,22.1456044 C8.93548387,21.7582418 5.43548387,20.4478022 5.43548387,14.5714286 C5.43548387,12.8983516 6.02419355,11.5302198 6.98387097,10.4587912 C6.83064516,10.0714286 6.31451613,8.51373626 7.12903226,6.40384615 C7.12903226,6.40384615 8.38709677,5.99175824 11.25,7.97802198 C12.4435484,7.64010989 13.7258065,7.46703297 15,7.45879121 C16.2741935,7.46703297 17.5564516,7.63186813 18.7580645,7.97802198 C21.6209677,6 22.8790323,6.40384615 22.8790323,6.40384615 C23.6935484,8.51373626 23.1854839,10.0714286 23.0241935,10.4587912 C23.983871,11.5302198 24.5645161,12.8983516 24.5645161,14.5714286 C24.5645161,20.456044 21.0564516,21.75 17.7177419,22.1291209 C18.2580645,22.6071429 18.75,23.5384615 18.75,24.9642857 L18.75,29.1675824 C18.75,29.5714286 18.9919355,30.0494505 19.75,29.9010989 C25.7016129,27.8736264 29.9919355,22.1291209 29.9919355,15.3626374 C29.9919355,6.91483516 23.2741935,0.0576923077 15,0.0576923077 L15,0.0576923077 Z"></path></svg>
`