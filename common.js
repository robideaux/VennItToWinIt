function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

homeBtn = byId("home")
homeBtn.onclick = () => {
  location.href = "./home.html"
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

function compressGame(game) {
  strGame = null

  try {
      gameJson = JSON.stringify(game)
      strGame = LZString.compressToEncodedURIComponent(gameJson)
  } catch (error) {
      strGame = null
      console.log("error compressing game definition.")
      console.error(error)
  } finally {
      return strGame;
  }
}

function tryCompress(game) {
  gzGame = compressGame(game)
  console.log("Current compression: " + gzGame)
  console.log("Length: " + gzGame.length)

  tight = []
  tight.push(game.title)
  tight = tight.concat(game.groups)

  phrases = currentGame.phrases
  phraseKeys = Object.keys(currentPhrases)
  entries = {}
  for (let phrase of phraseKeys) {
      entries[phrase] = phrases[phrase].groupIds 
  }
  tight.push(entries)
  console.log(tight)

  gzGame = compressGame(tight)
  console.log("Tighter compression: " + gzGame)
  console.log("Length: " + gzGame.length)
}

function decompressGame(strGame) {
  game = null

  try {
      gameJson = LZString.decompressFromEncodedURIComponent(strGame)
      game = JSON.parse(gameJson)
  } catch (error) {
      game = null
      console.log("error decompressing game definition.")
      console.error(error)
  } finally {
      return game;
  }
}
