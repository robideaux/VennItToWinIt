play = byId("play")
fullscreen = byId("fullscreen")
settings = byId("settings")
scoreIcon = byId("scoreIcon")

// Play Game
play.onclick = () => {
    document.location.href = "./play.html"
}

qGame = getQueryGame()
if (qGame) {
  storeCurrentGame(qGame)
  document.location.href = "./play.html"
}

if (scoreIcon) {
  // scoreIcon.textContent = "\u2BBF\u2460\u2461\u2462\u2463"
  scoreIcon.textContent = "\u2612\u2780\u2781\u2782\u2783"
}