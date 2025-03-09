
shareBtn = byId("link")
if (shareBtn) {
  shareBtn.onclick = () => {
    closeMenu()
    if (currentGame) {
      gzGame = compressGame(currentGame);
//      href = location.href
      path = location.pathname
      path = path.replace("play.html", "")
      path = path.replace("edit.html", "")
      path = path + "index.html"
      href = location.origin + path
      href = href + "?game=" + gzGame

      // Copy the text inside the text field
      navigator.clipboard.writeText(href);
      alert("Copied game link to the clipboard.\n" + href);
    } else {
      alert("No active game selected.");
    }
  }
}

deleteBtn = byId("deleteBtn")
if (deleteBtn) {
  deleteBtn.onclick = () => {
    if (currentGame) {
      if (currentGame.isLocal) {
        if (confirm("This will delete your locally stored game, " + currentGame.title + "\nAre you sure?")) {
          deleteLocalGame(currentGame)
          setGame(null)
          location.reload()
        } else {
          // do nothing
        }
      } else {
        alert("Can't delete built-in games.  You shouldn't even have this button. :(")
      }
    } else {
      alert("No game to delete.  You shouldn't even have this button. :(")
    }
  }
}


gameSelector = byId("gamelist")
games = []

board = byId("board")
if (board) {
  board.classList.remove("solved")
}


function setGame(game) {
  if (deleteBtn) {
    deleteBtn.classList.add("hidden")
  }

  if (game) {
    currentGame = game
    storeCurrentGame(game)

    if (deleteBtn && currentGame.isLocal) {
      deleteBtn.classList.remove("hidden")
    }

    index = games.findIndex(x => x.title == currentGame.title)
    gameSelector.selectedIndex = index
  
    loadGame()
  } else {
    currentGame = null
    gameSelector.selectedIndex = -1
    storeCurrentGame(game)
  }
}

// Load up games
(async () => {

  await loadGames()

  // build dropdown list
  games = getAllGames()
  games.forEach(game => {
    option = document.createElement('option')
    text = document.createTextNode(game.title)
    if (game.isLocal) {
      option.classList.add("local")
      text = document.createTextNode("* " + game.title)
    }
    option.appendChild(text)
    gameSelector.appendChild(option)
  })
  gameSelector.selectedIndex = -1

  gameSelector.onchange = () =>
  {
    if (board) {
      board.classList.remove("solved")
    }
    setGame(games[gameSelector.selectedIndex])
  }

  // Auto select current game
  currentGame = loadCurrentGame()
  setGame(currentGame)
  /*
  if (currentGame) {
    index = games.findIndex(x => x.title == currentGame.title)
    gameSelector.selectedIndex = index
    if (index >= 0) {
        setGame(currentGame)
    } else {
        setGame(null)
    }
  }
  */
})()
