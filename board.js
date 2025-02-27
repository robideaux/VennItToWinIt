function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

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
  try {
    response = await fetch('https://api.github.com/repos/robideaux/VennItToWinIt/contents/games/')
    data = await response.json()
    if (data) {
      for (fileInfo of data) {
        fileName = fileInfo.name
        if (fileName && fileName.endsWith(".json"))
        {
          defResponse = await fetch(fileInfo.download_url)
          gameDef = await defResponse.json()
          if (gameDef) {
            games.push(gameDef)
          }
        }
      }    
    }
    console.log(data)
  } catch (error) {
    console.log("err3: ")
    console.log(error)
  } finally {
    // build dropdown list
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
    query = document.location.search
    if (query) {
      params = query.split(",")[0]
      if (params) {
        gameData = params.replace("?game=", "")
        gameStr = LZString.decompressFromEncodedURIComponent(gameData)
        game = JSON.parse(gameStr)
        if (game) {
          index = games.findIndex(x => x.title == game.title)
          if (index < 0) {
            games.push(game)
            index = games.length - 1
          }
          gamelist.selectedIndex = index
          setGame(game)
        } else {
          gamelist.selectedIndex = -1
          setGame(null)
        }
      }
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
