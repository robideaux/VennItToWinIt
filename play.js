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

slots = []
slots.push(byId('drag-src'))
for (let i=1; i<=7; i++) {
  slot = byId('slot' + i)
  slot.textContent = ''
  slots.push(slot)
}

drake = dragula(slots, {
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

function loadGame() {
  // clear labels
  circles = ["red", "blue", "green"]
  for (let circle of circles) {
    label = byId(circle+"label")
      label.textContent = circle + ' group'
  }

  currentPhrases = currentGame.phrases
  phraseList = [...Object.keys(currentPhrases)]

  // Clear source
  srcPanel = byId('drag-src')
  srcPanel.textContent = null

  // add phrases in random order
  numPhrases = phraseList.length 
  while (numPhrases > 0) {
    let index = getRandomIntInclusive(0, numPhrases-1);
    phrase = phraseList[index]
    phraseList.splice(index, 1)
    phraseObj = currentPhrases[phrase]

    phraseEl = document.createElement('div')
    phraseEl.classList.add("phrase")
    phraseEl.setAttribute('title', phrase)
    if (phraseObj.short) {
      phraseEl.setAttribute('title', phraseObj.short)
    }
    div = document.createElement('div')
    text = document.createTextNode(phrase)
    div.appendChild(text)
    phraseObj.groupIds.forEach(id => {
      div.classList.add("G" + (id))
    })
    phraseEl.appendChild(div)

    srcPanel.appendChild(phraseEl)
    numPhrases = phraseList.length 
  }

  // Clear Targets (slots)
  slots = byClass('drop-target')
  for (let slot of slots) {
    slot.textContent = null
  }
}

function checkGame() {
  groups = ["G1", "G2", "G3"]
  circles = ["red", "blue", "green"]
  groups.forEach((group, index) => {
    phrases = byClass(group)

    for (let ci=0; ci<circles.length; ci++) {
      circle = circles[ci]
      label = byId(circle+"label")
      if (arePhrasesInCircle(phrases, circle))
      {
        circles.splice(ci, 1)
        console.log(circle + " Circle is solved!")
        label.textContent = '"' + currentGame.groups[index] + '"'
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

