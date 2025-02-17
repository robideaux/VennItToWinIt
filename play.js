function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
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
  currentGame = games[gamelist.selectedIndex]
  title = byId('title')
  title.textContent = "Phrases for: " + currentGame.title
  console.log(currentGame)
}

startButton = byId("Load")
startButton.onclick = () => {
  loadGame()
}

checkButton = byId("Check")
checkButton.onclick = () => {
  checkGame()
}

function loadGame() {
  currentPhrases = currentGame.phrases
  srcPanel = byId('drag-src')
  srcPanel.textContent = null
  currentPhrases.forEach((element, index) => {
    phrase = document.createElement('div')
    phrase.classList.add("phrase")
    phrase.setAttribute('title', element.phrase)
    if (element.short) {
      phrase.setAttribute('title', element.short)
    }
    div = document.createElement('div')
    text = document.createTextNode(element.phrase)
    div.appendChild(text)
    div.setAttribute('id', "phrase_" + index)
    element.groupIds.forEach(id => {
      div.classList.add("G" + id)
    })
    phrase.appendChild(div)

    srcPanel.appendChild(phrase)
  });

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
    circles.forEach((circle, ci) => {
      label = byId(circle+"label")
      if (arePhrasesInCircle(phrases, circle))
      {
        circles.splice(ci, 1)
        console.log(circle + " Circle is solved!")
        label.textContent = '"' + currentGame.groups[index].label + '"'
      } else {
        label.textContent = circle + ' group'
      }
    })
  })
}

function arePhrasesInCircle(phrases, circle) {
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
