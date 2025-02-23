startButton = byId("Load")
startButton.onclick = () => {
  loadGame()
}

checkButton = byId("Check")
checkButton.onclick = () => {
  checkGame()
}

isSourceSelected = false
selectedSource = null

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

  slot.onclick = (event) => {
    if (isSourceSelected && selectedSource) {
      dropSlot = event.currentTarget
      if (dropSlot.children.length == 0)
      {
        srcParent = selectedSource.parentElement
        srcParent.removeChild(selectedSource)
        // set short name
        shortname = selectedSource.getAttribute('shortname')
        if (shortname) {
          selectedSource.children[0].textContent = shortname
        }
        dropSlot.appendChild(selectedSource)    
        cancelSelections()
      }
    }
  }
}

drake = dragula(slots, {
  revertOnSpill: true,
  accepts: function(el, target) {
    return target !== byId('drag-src')
  },
  slideFactorX: 5,
  slideFactorY: 5
})
drake.on('drop', function(el, target, source) {
  if (target.children.length >= 2) {
    source.appendChild(target.children[0])
  }
  shortname = el.getAttribute('shortname')
  if (shortname) {
    el.children[0].textContent = shortname
  }
})
drake.on('drag', (el, src) => {
  cancelSelections()
  el.classList.add('source')
  highlightDrops(true)
  isSourceSelected = true
  selectedSource = el
})

drake.on('dragend', () => {
  cancelSelections()
})

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
      phraseEl.setAttribute('shortname', phraseObj.short)
    }
    div = document.createElement('div')
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

