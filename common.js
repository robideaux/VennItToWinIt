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

settingsKey = "settings:"

audioKey = "audio"

function audioEnabled() {
  enabled = localStorage.getItem(settingsKey+audioKey) ?? "false"
  return JSON.parse(enabled)
}

function enableAudio() {
  localStorage.setItem(settingsKey+audioKey, true)
}

function disableAudio() {
  localStorage.setItem(settingsKey+audioKey, false)
}

function compressGame(game) {
  strGame = null
  if (!game) {
    return strGame
  }
  
  try {
    tight = tightenGame(game)
    gameJson = JSON.stringify(tight)
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
      json = LZString.decompressFromEncodedURIComponent(strGame)
      game = JSON.parse(json)
      game = loosenGame(game)
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
  console.log()

  tight = tightenGame1(game)
  console.log("Tight def:")
  console.log(tight)
  def = JSON.stringify(tight)
  console.log(def)
  console.log("Def Length: " + def.length)

  gzGame = compressGame(tight)
  console.log("Tight compression: " + gzGame)
  console.log("Length: " + gzGame.length)
  console.log()

  tight = tightenGame(game)
  console.log("Tighter def:")
  console.log(tight)
  def = JSON.stringify(tight)
  console.log(def)
  console.log("Def Length: " + def.length)

  gzGame = compressGame(tight)
  console.log("Tighter compression: " + gzGame)
  console.log("Length: " + gzGame.length)
  return gzGame
}

function tightenGame1(game) {
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

function tightenGame(game) {
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

  tight.push(game.isLocal ?? false)
  tight.push(game.isShared ?? true)

  return tight
}

function loosenGame(game) {
  loose = {}
  if (Array.isArray(game)) {
    p1 = game[4]
    p2 = game[5]
    p3 = game[6]
    p4 = game[7]
    p5 = game[8]
    p6 = game[9]
    p7 = game[10]
    loose = {
      "title": game[0],
      "groups": [game[1], game[2], game[3]],
      "phrases": {},
      "isLocal": game[11] ?? false,
      "isShared": game[12] ?? false
    }
    loose.phrases[p1] = { "groupIds": [1] }
    loose.phrases[p2] = { "groupIds": [2] }
    loose.phrases[p3] = { "groupIds": [3] }
    loose.phrases[p4] = { "groupIds": [1,2] }
    loose.phrases[p5] = { "groupIds": [1,3] }
    loose.phrases[p6] = { "groupIds": [2,3] }
    loose.phrases[p7] = { "groupIds": [1,2,3] }
  } else {
    loose = game
  }
  return loose
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

