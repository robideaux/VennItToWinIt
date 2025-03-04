
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



gamelist = byId("gamelist")
currentGame = null

setGame(null)

function setGame(game) {
  if (game) {
    currentGame = game
    loadGame()
  } else {
    currentGame = null
  }
}

// Load up games
(async () => {

  await loadGames()
  qGame = addQueryGame()


  // build dropdown list
  games = getAllGames()
  games.forEach(game => {
    option = document.createElement('option')
    text = document.createTextNode(game.title)
    option.appendChild(text)
    gamelist.appendChild(option)
  })
  gamelist.selectedIndex = -1

  gamelist.onchange = () =>
  {
    setGame(games[gamelist.selectedIndex])
  }

  // Add game from query string
  if (qGame) {
    index = games.findIndex(x => x.title == qGame.title)
    gamelist.selectedIndex = index
    if (index >= 0) {
        setGame(qGame)
    } else {
        setGame(null)
    }
  }

})()
