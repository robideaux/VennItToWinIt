(async () => {
try {
  response = await fetch('./games/')
  data = await response.json()
  console.log("data2: ")
  console.log(data)
} catch (error) {
  console.log("err2: ")
  console.log(error)
}
try {
  response = await fetch('https://api.github.com/repos/robideaux/VennItToWinIt/contents/games/')
  data = await response.json()
  console.log("data3: ")
  console.log(data)
} catch (error) {
  console.log("err3: ")
  console.log(error)
}
})()

function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

menuButton = byId("hamburger")
menuButton.onclick = () => {
  menu = byId("menu")
  icon = byId("hamburger")
  if (menu.style.display === "block") {
    menu.style.display = "none"
    icon.classList.remove("fa-times")
    icon.classList.add("fa-bars")
  } else {
    menu.style.display = "block";
    icon.classList.remove("fa-bars")
    icon.classList.add("fa-times")
  }
}

infoButton = byId("info")
infoButton.onclick = () => {
    alert("Click and place or drag the phrases to the correct area in the diagram. Hit the Check button to check your answers. If all the correct pharses are in a circle the title of the group will be revealed; even if they are misplaced withing the circle");
}

fullscreen = byId("fullscreen")
fullscreen.onclick = () => {
  if (!document.fullscreenEnabled) {
    return
  }

  if (document.fullscreenElement) {
    document.exitFullscreen()
    fullscreen.textContent = "Full Screen Mode"
  } else {
    document.body.requestFullscreen()
    fullscreen.textContent = "Exit Full Screen"
  }
}

/*
startButton = byId("Load")
startButton.disabled = true;
*/

gamelist = byId("gamelist")
currentGame = null
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
  document.body.requestFullscreen()
}

// Add game from query string
setGame(null)
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

function setGame(game) {
  if (game) {
    currentGame = game
    title = byId('title')
    title.textContent = "Phrases for: " + currentGame.title
    // startButton.disabled = false;
    loadGame()
  } else {
    currentGame = null
    title = byId('title')
    title.textContent = "No game selected"
    // startButton.disabled = true;
  }

  strGame = JSON.stringify(currentGame)

  console.log("URL for this game:")
  console.log(document.location.href + "?game=" + LZString.compressToEncodedURIComponent(strGame))
}

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
