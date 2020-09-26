const axios = require('axios');
const createAudioControls = require('./audio-controls')



const titleEl = document.querySelector('.title')
const artistEl = document.querySelector('.artist')

const handleProgress = (progressEvent) => {
    const percent = (progressEvent.loaded / progressEvent.total) * 100
    const bar = document.querySelector('.progress-upload .bar')
    bar.style.width = `${percent}%`;
}

const handleMusicUpload = () => {
    const form = document.querySelector('.form');

    // Hide the Form 

    form.style.display = "none"


    // Show the Progress Bar

    document.querySelector('.progress-upload').style.display = "flex";

    const mp3 = form.querySelector('#file');
    const title = form.querySelector('#title').value;
    const artist = form.querySelector('#artist').value;

    
    if (!title || !artist){
        alert('Please Enter A Valid Title And Artist');
        return
    }

    const formData = new FormData();
    formData.append("title",title)
    formData.append("artist",artist)
    formData.append("file",mp3.files[0])

    axios.post('/upload',formData,{
        onUploadProgress: progressEvent => {
            handleProgress(progressEvent)
        }
    })
    .then(
        (data) => {

            function setTrack (track) {
                window.audio.src = track.path
                window.audio.play()
                document.querySelectorAll('li.track').forEach(t => t.classList.remove('selected'))
                track.el.classList.add('selected')
                titleEl.innerText = track.title
                artistEl.innerText = track.artist
            }

            document.querySelector('.progress-upload').style.display = "none";

            console.log('/uploadedMusic/' + data.data.uuid + '.mp3')

            const trackSelector = document.querySelector('ul.track-selector');
            
            const newLi = document.createElement('li');

            const span = document.createElement('span');
            span.innerText = `${window.tracks.length + 1}`
            newLi.appendChild(span);

            const Txt = document.createTextNode(title);
            newLi.appendChild(Txt);
            newLi.classList.add('track')

            newLi.addEventListener('click',() => {
                setTrack({title,artist,path:'/uploadedMusic/' + data.data.uuid + '.mp3',el:newLi})
            })
            trackSelector.appendChild(newLi)

        }
    )

}

const handleNewTrackPrime = () => {

    const musicAddImage = document.querySelector('.add-music button#prime');
    musicAddImage.style.display = "none";
    
    const elem = document.querySelector('.form');
    elem.classList.remove('inactive-music-add')
    elem.classList.add('active-music-add')

    document.querySelector('.add-music button#upload').addEventListener('click',() => {

        handleMusicUpload(title,artist)
        
    })
}

module.exports = handleNewTrackPrime;