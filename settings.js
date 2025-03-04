fullscreen = byId("fullscreen")


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

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.body.requestFullscreen()
    }    
}
