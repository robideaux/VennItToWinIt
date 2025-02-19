//const LZString = require("lz-string/libs/lz-string")

function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

// Add game from query string
query = document.location.search
if (query) {
  params = query.split(",")[0]
  if (params) {
    gameData = params.replace("?game=", "")
    gameStr = LZString.decompressFromEncodedURIComponent(gameData)
    game = JSON.parse(gameStr)
    if (game && games.findIndex(x => x.title == game.title) < 0) {
      games.push(game)
    }
  }
}

gamelist = byId("gamelist")
currentGame = []
currentPhrases = []
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

function setGame(game) {
  currentGame = game
  title = byId('title')
  title.textContent = "Phrases for: " + currentGame.title

  strGame = JSON.stringify(currentGame)
  console.log(LZString.compressToEncodedURIComponent(strGame))
}


startButton = byId("Load")
startButton.onclick = () => {
  loadGame()
}

checkButton = byId("Check")
checkButton.onclick = () => {
  checkGame()
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function loadGame() {

  // clear labels
  circles = ["red", "blue", "green"]
  for (let circle of circles) {
    label = byId(circle+"label")
      label.textContent = circle + ' group'
  }

  currentPhrases = [...currentGame.phrases]

  srcPanel = byId('drag-src')
  srcPanel.textContent = null

  // add phrases in random order
  numPhrases = currentPhrases.length 
  while (numPhrases > 0) {
    let index = getRandomIntInclusive(0, numPhrases-1);
    node = currentPhrases[index]
    currentPhrases.splice(index, 1)

    phrase = document.createElement('div')
    phrase.classList.add("phrase")
    phrase.setAttribute('title', node.phrase)
    if (node.short) {
      phrase.setAttribute('title', node.short)
    }
    div = document.createElement('div')
    text = document.createTextNode(node.phrase)
    div.appendChild(text)
    // div.setAttribute('id', "phrase_" + index)
    node.groupIds.forEach(id => {
      div.classList.add("G" + id)
    })
    phrase.appendChild(div)

    srcPanel.appendChild(phrase)
    numPhrases = currentPhrases.length 
  }

  slots = []
  slots.push(srcPanel)
  for (let i=1; i<=7; i++) {
    slot = byId('slot' + i)
    slot.textContent = ''
    slots.push(slot)
  }

  dragula(slots, {
      revertOnSpill: true,
      accepts: function(el, target) {
        return target !== byId('drag-src')
      }
    }).on('drop', function(el, target, source, sib) {
      if (target.children.length >= 2) {
        source.appendChild(target.children[0])
      }
      title = el.getAttribute('title')
      text = el.children[0].textContent
      el.setAttribute('title', text)
      el.children[0].textContent = title
    })
}

function checkGame() {
  groups = ["G1", "G2", "G3"]
  circles = ["red", "blue", "green"]
  groups.forEach((group, index) => {
    phrases = byClass(group)

    for (let ci=0; ci<circles.length; i++) {
      circle = circles[ci]
      label = byId(circle+"label")
      if (arePhrasesInCircle(phrases, circle))
      {
        circles.splice(ci, 1)
        console.log(circle + " Circle is solved!")
        label.textContent = '"' + currentGame.groups[index].label + '"'
        break
      } else {
        label.textContent = circle + ' group'
      }
    }
  })
}

function arePhrasesInCircle(phrases, circle) {
  if (!phrases || phrases.length < 1) {
    return false
  }
  
  found = true
  for (let phrase of phrases) {
    parent = phrase.parentElement
    slot = parent.parentElement
    if (!slot.classList.contains(circle)) {
      found = false
    }
  }
  return found
}
