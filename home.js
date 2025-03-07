play = byId("play")
fullscreen = byId("fullscreen")
settings = byId("settings")

// Play Game
play.onclick = () => {
    document.location.href = "./play.html"
}

qGame = getQueryGame()
if (qGame) {
  storeCurrentGame(qGame)
  document.location.href = "./play.html"
}
