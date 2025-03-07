
checkButton = byId("checkBtn")
checkButton.onclick = (event) => {
  event.preventDefault()
  checkGame()
}

isSourceSelected = false
selectedSource = null
maxChecks = byClass("checks").length
checksRemaining = maxChecks

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

for (let i=1; i<=7; i++) {
  slot = byId('slot' + i)
  slot.textContent = ''

  slot.onclick = (event) => {
    if (isSourceSelected && selectedSource) {
      dropSlot = event.currentTarget
      if (dropSlot.children.length == 0)
      {
        srcParent = selectedSource.parentElement
        srcParent.removeChild(selectedSource)
        dropSlot.appendChild(selectedSource)    
        cancelSelections()
      }
    }
  }
}


function cancelSelections() {
  sources = byClass('source')
  for (let source of sources) {
    source.classList.remove('source')
  }
  highlightDrops(false)
  isSourceSelected = false
  selectedSource = null
}

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
  srcPanel = byId('choices')
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
    div = document.createElement('p')
    text = document.createTextNode(phrase)
    div.appendChild(text)
    phraseObj.groupIds.forEach(id => {
      div.classList.add("G" + (id))
    })
    phraseEl.appendChild(div)
    
    phraseEl.onclick = (event) => {
      // check for deselection
      if (event.currentTarget.classList.contains('source')) {
        cancelSelections()
        return
      }

      // if already a selection, then swap
      if (isSourceSelected && selectedSource) {
        target = event.currentTarget
        targetParent = target.parentElement
        srcParent = selectedSource.parentElement
        targetParent.removeChild(target)
        srcParent.removeChild(selectedSource)
        targetParent.appendChild(selectedSource)
        srcParent.appendChild(target)
        cancelSelections()
        return
      }
  
      // otherwise, set this as the source
      cancelSelections()
      event.currentTarget.classList.add('source')
      highlightDrops(true)
      isSourceSelected = true
      selectedSource = event.currentTarget
    }

    srcPanel.appendChild(phraseEl)
    numPhrases = phraseList.length 
  }

  // Clear Targets (slots)
  slots = byClass('drop-target')
  for (let slot of slots) {
    slot.textContent = null
  }

  checksRemaining = maxChecks
  UpdateChecksLeft()
}

function highlightDrops(yes) {
  targets = byClass('drop-target')
  for (let target of targets) {
    if (yes) {
      target.classList.add('highlight')
    } else {
      target.classList.remove('highlight')
    }
  }

}

function UpdateChecksLeft()
{
  for (let i=1; i<=maxChecks; i++) {
    check = byId("check" + i);
    if (i <= checksRemaining) {
      check.classList.remove("used")
      check.classList.remove("fa-times-circle")
      check.classList.add("fa-circle-thin")
    } else {
      check.classList.remove("fa-circle-thin")
      check.classList.add("fa-times-circle")
      check.classList.add("used")
    }
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

  checksRemaining--
  UpdateChecksLeft()

  if (checksRemaining <= 0)
  {
    setTimeout(() => {
      if (confirm("No more checks available. So sorry. :(\nClick OK to reveal the answer; Cancel to start over.")) {
        // reveal answer
        revealGame()
      } else {
        // reload
        location.reload()
      }
    }, 500)
  }

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

function revealGame() {
  g1Name = byId("redlabel")
  g2Name = byId("bluelabel")
  g3Name = byId("greenlabel")
  phrase1 = byId("slot1")
  phrase13 = byId("slot2")
  phrase12 = byId("slot3")
  phrase123 = byId("slot4")
  phrase3 = byId("slot5")
  phrase2 = byId("slot6")
  phrase23 = byId("slot7")

  if (g1Name) {
      g1Name.textContent = currentGame.groups[0]
  }
  if (g2Name) {
      g2Name.textContent = currentGame.groups[1]
  }
  if (g3Name) {
      g3Name.textContent = currentGame.groups[2]
  }

  if (phrase1) {
      phrase1.textContent = getPhraseFromGroups(currentGame.phrases, [1])
  }
  if (phrase2) {
      phrase2.textContent = getPhraseFromGroups(currentGame.phrases, [2])
  }
  if (phrase3) {
      phrase3.textContent = getPhraseFromGroups(currentGame.phrases, [3])
  }
  if (phrase12) {
      phrase12.textContent = getPhraseFromGroups(currentGame.phrases, [1,2])
  }
  if (phrase13) {
      phrase13.textContent = getPhraseFromGroups(currentGame.phrases, [1,3])
  }
  if (phrase23) {
      phrase23.textContent = getPhraseFromGroups(currentGame.phrases, [2,3])
  }
  if (phrase123) {
      phrase123.textContent = getPhraseFromGroups(currentGame.phrases, [1,2,3])
  }
}