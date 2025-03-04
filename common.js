function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

homeBtn = byId("home")
if (homeBtn) {
  homeBtn.onclick = () => {
    location.href = "./index.html"
  }
}

menuButton = byId("bars")
if (menuButton) {
  menuButton.onclick = () => {
    toggleMenu()
  }
}

backBtn = byId("back")
if (backBtn) {
  backBtn.onclick = () => {
    history.back()
  }
}

infoBtn = byId("howto")
if (infoBtn) {
  infoBtn.onclick = () => {
    closeMenu()
    location.href = "./howto.html"
  }
}

settingsBtn = byId("settings")
if (settingsBtn) {
  settingsBtn.onclick = () => {
    closeMenu()
    location.href = "./settings.html"
  }
}

menuPanel = byId("menupanel")

function toggleMenu() {
  if (!menuPanel) {
    return
  }
  
  if (menuPanel.style.display === "block") {
    closeMenu()
  } else {
    openMenu()
  }
}

function openMenu() {
  if (menuPanel && menuButton) {
    menuPanel.style.display = "block";
    menuButton.classList.remove("fa-bars")
    menuButton.classList.add("fa-times")
  }
}

function closeMenu() {
  if (menuPanel && menuButton) {
    menuPanel.style.display = "none"
    menuButton.classList.remove("fa-times")
    menuButton.classList.add("fa-bars")
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
