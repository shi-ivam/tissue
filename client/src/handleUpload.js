const axios = require('axios');


const handleProgress = (progressEvent) => {
    const percent = (progressEvent.loaded / progressEvent.total) * 100
    const bar = document.querySelector('.progress-upload .bar')
    bar.style.width = `${percent}%`;

}
const handleMusicUpload = () => {
    const form = document.querySelector('.form');

    // Hide the Form 

    form.style.display = "none"

    const mp3 = form.querySelector('#file');
    const title = form.querySelector('#title');
    const artist = form.querySelector('#artist');

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
            document.querySelector('.progress-upload').style.display = "none";
            console.log('/uploadedMusic/' + data.data.uuid + '.mp3')
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
        handleMusicUpload()
    })
}

module.exports = handleNewTrackPrime;