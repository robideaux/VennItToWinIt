
shareBtn = byId("link")
if (shareBtn) {
  shareBtn.onclick = () => {
    closeMenu()
    if (currentGame) {
      gzGame = compressGame(currentGame);
      href = location.href
      href = href + "?game=" + gzGame

      // Copy the text inside the text field
      navigator.clipboard.writeText(href);
      alert("Copied game link to the clipboard.\n" + href);
    } else {
      alert("No active game selected.");
    }
  }
}



gameSelector = byId("gamelist")
// setGame(null)

function setGame(game) {
  if (game) {
    currentGame = game
    storeCurrentGame(game)
    loadGame()
  } else {
    currentGame = null
    storeCurrentGame(game)
  }
}

// Load up games
(async () => {

  await loadGames()
  qGame = addQueryGame()
  if (qGame) {
    storeCurrentGame(game)
  }

  // build dropdown list
  games = getAllGames()
  games.forEach(game => {
    option = document.createElement('option')
    text = document.createTextNode(game.title)
    option.appendChild(text)
    gameSelector.appendChild(option)
  })
  gameSelector.selectedIndex = -1

  gameSelector.onchange = () =>
  {
    setGame(games[gameSelector.selectedIndex])
  }

  // Add game from query string
  currentGame = loadCurrentGame()
  if (currentGame) {
    index = games.findIndex(x => x.title == currentGame.title)
    gameSelector.selectedIndex = index
    if (index >= 0) {
        setGame(qGame)
    } else {
        setGame(null)
    }
  }
})()
