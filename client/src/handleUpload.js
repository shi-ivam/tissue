const handleMusicUpload = () => {
    const form = document.querySelector('.form');
    console.log(form)
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