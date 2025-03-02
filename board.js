
menuButton = byId("bars")
menuButton.onclick = () => {
  toggleMenu()
}

function toggleMenu() {
  menu = byId("menupanel")
  if (menu.style.display === "block") {
    menu.style.display = "none"
    menuButton.classList.remove("fa-times")
    menuButton.classList.add("fa-bars")
  } else {
    menu.style.display = "block";
    menuButton.classList.remove("fa-bars")
    menuButton.classList.add("fa-times")
  }
}

infoButton = byId("info")
infoButton.onclick = () => {
  toggleMenu()
  alert("Click and place or drag the phrases to the correct area in the diagram. Hit the Check button to check your answers. If all the correct pharses are in a circle the title of the group will be revealed; even if they are misplaced withing the circle");
}

fullscreen = byId("fullscreen")
fullscreen.onclick = () => {
  if (!document.fullscreenEnabled) {
    return
  }

  toggleMenu()
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.body.requestFullscreen()
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
  strGame = JSON.stringify(currentGame)
  console.log("URL for this game:")
  console.log(document.location.href + "?game=" + LZString.compressToEncodedURIComponent(strGame))
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
  
/*
editButton = byId("Edit")
saveButton = byId("Save")
cancelButton = byId("Cancel")

editButton.onclick = () => {
  editButton.classList.remove("live")
  editButton.classList.add("editing")

  saveButton.classList.remove("editing")
  saveButton.classList.add("live")
  cancelButton.classList.remove("editing")
  cancelButton.classList.add("live")
}

saveButton.onclick = () => {
  // do Save()
  editButton.classList.remove("editing")
  editButton.classList.add("live")
  saveButton.classList.remove("live")
  saveButton.classList.add("editing")
  cancelButton.classList.remove("live")
  cancelButton.classList.add("editing")
}

cancelButton.onclick = () => {
  // do Cancel()
  editButton.classList.remove("editing")
  editButton.classList.add("live")
  saveButton.classList.remove("live")
  saveButton.classList.add("editing")
  cancelButton.classList.remove("live")
  cancelButton.classList.add("editing")
}
*/

/*
linkButton.onclick = () => {
  if (currentGame) {
    strGame = JSON.stringify(currentGame)
    gameUrl = document.location.href + "?game=" + LZString.compressToEncodedURIComponent(strGame)
    gameUrl = "https://robideaux.github.io/VennItToWinIt/" + "?game=" + LZString.compressToEncodedURIComponent(strGame)
    alert("Link to current Game: " + gameUrl)
  } else {
    alert("No Game Selected")
  }
}
*/
