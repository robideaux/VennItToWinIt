play = byId("play")
info = byId("howto")
fullscreen = byId("fullscreen")
settings = byId("settings")

// Play Game
play.onclick = () => {
    document.location.href = "./play.html"
}

info.onclick = () => {
    document.location.href = "./info.html"
}

// If fullscreen is available, wire it up
if (!document.fullscreenEnabled) {
    fullscreen.textContent = "Fullscreen (not available"
    fullscreen.classList.remove("enabled")
    fullscreen.onclick = null
} else {
    fullscreen.textContent = "Toggle Fullscreen"
    fullscreen.classList.add("enabled")
    fullscreen.onclick = toggleFullscreen
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.body.requestFullscreen()
    }    
}
