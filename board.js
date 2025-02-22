
function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

gamelist = byId("gamelist")
currentGame = []
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
    }
  }
}

function setGame(game) {
  currentGame = game
  title = byId('title')
  title.textContent = "Phrases for: " + currentGame.title

  strGame = JSON.stringify(currentGame)

  console.log("URL for this game:")
  console.log(document.location.href + "?game=" + LZString.compressToEncodedURIComponent(strGame))
}

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

Split(['#leftpanel', '#rightpanel'], {
  sizes: [20, 80],
  minSize: [200,450],
  direction: 'horizontal',
  gutterSize: 2
})
