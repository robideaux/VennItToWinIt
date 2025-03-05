function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

currentGame = null

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

editBtn = byId("edit")
if (editBtn) {
  editBtn.onclick = () => {
    closeMenu()
    location.href = "./edit.html"
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


function tryCompress(game) {
  gzGame = compressGame(game)
  console.log("Current compression: " + gzGame)
  console.log("Length: " + gzGame.length)

  tight = tightenGame(game)
  console.log("Tight def:")
  console.log(tight)

  gzGame = compressGame(tight)
  console.log("Tight compression: " + gzGame)
  console.log("Length: " + gzGame.length)

  tight = tightenGame2(game)
  console.log("Tighter def:")
  console.log(tight)

  gzGame = compressGame(tight)
  console.log("Tighter compression: " + gzGame)
  console.log("Length: " + gzGame.length)
}

function tightenGame(game) {
  tight = []
  tight.push(game.title)
  tight = tight.concat(game.groups)

  phrases = game.phrases
  phraseKeys = Object.keys(phrases)
  entries = {}
  for (let phrase of phraseKeys) {
      entries[phrase] = phrases[phrase].groupIds 
  }
  tight.push(entries)

  return tight
}

function tightenGame2(game) {
  tight = []
  tight.push(game.title)
  tight = tight.concat(game.groups)

  phrases = game.phrases
  tight = tight.concat(getPhraseFromGroups(phrases, [1]))
  tight = tight.concat(getPhraseFromGroups(phrases, [2]))
  tight = tight.concat(getPhraseFromGroups(phrases, [3]))
  tight = tight.concat(getPhraseFromGroups(phrases, [1,2]))
  tight = tight.concat(getPhraseFromGroups(phrases, [1,3]))
  tight = tight.concat(getPhraseFromGroups(phrases, [2,3]))
  tight = tight.concat(getPhraseFromGroups(phrases, [1,2,3]))

  return tight
}

function getPhraseFromGroups(phrases, groupIds) {
  phraseKeys = Object.keys(phrases)
  groupIds.sort()

  return phraseKeys.filter((p) => {
    g = [...phrases[p].groupIds]
    g.sort();
    if (g.length != groupIds.length) {
      return false
    }

    for (let i = 0; i<groupIds.length; i++) {
      if (g[i] != groupIds[i]) {
        return false
      }
    }
    return true
  })
}

