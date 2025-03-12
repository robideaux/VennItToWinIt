fullscreen = byId("fullscreen")
if (fullscreen) {
    // If fullscreen is available, wire it up
    if (!document.fullscreenEnabled) {
        fullscreen.textContent = "Fullscreen (n/a)"
        fullscreen.classList.remove("enabled")
        fullscreen.onclick = null
    } else {
        fullscreen.textContent = "Toggle Fullscreen"
        fullscreen.classList.add("enabled")
        fullscreen.onclick = toggleFullscreen
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.body.requestFullscreen()
    }    
}

audioLabel = byId("audio-label")
audioToggle = byId("audio-toggle")
if (audioToggle) {
    audioToggle.checked = audioEnabled()
    audioToggle.onchange = toggleAudio
    toggleAudio()
}

function toggleAudio() {
    if (audioToggle.checked) {
        audioLabel.textContent = "Sounds On"
        enableAudio()
    } else {
        audioLabel.textContent = "Sounds Off"
        disableAudio()
    }
}
