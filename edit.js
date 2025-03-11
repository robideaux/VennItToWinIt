form = byId("topLayout")

if (form) {
    form.onsubmit = (event) => {
        event.preventDefault()
        formData = new FormData(form)
        console.log(formData)

        console.log("Game Name: " + formData.get("gameName"))
        console.log("Group 1: " + formData.get("g1Name"))
        console.log("Group 2: " + formData.get("g2Name"))
        console.log("Group 3: " + formData.get("g3Name"))
        console.log("[1] : " + formData.get("g1"))
        console.log("[2] : " + formData.get("g2"))
        console.log("[3] : " + formData.get("g3"))
        console.log("[1,2] : " + formData.get("g12"))
        console.log("[1,3] : " + formData.get("g13"))
        console.log("[2,3] : " + formData.get("g23"))
        console.log("[1,2,3] : " + formData.get("g123"))

        editedGame.title = formData.get("gameName")
        editedGame.groups = [formData.get("g1Name"), formData.get("g2Name"), formData.get("g3Name")]
        editedGame.phrases = {}
        editedGame.phrases[formData.get("g1")] = { "groupIds" : [1] }
        editedGame.phrases[formData.get("g2")] = { "groupIds" : [2] }
        editedGame.phrases[formData.get("g3")] = { "groupIds" : [3] }
        editedGame.phrases[formData.get("g12")] = { "groupIds" : [1,2] }
        editedGame.phrases[formData.get("g13")] = { "groupIds" : [1,3] }
        editedGame.phrases[formData.get("g23")] = { "groupIds" : [2,3] }
        editedGame.phrases[formData.get("g123")] = { "groupIds" : [1,2,3] }

        saveLocalGame(editedGame)
    } 
}

currentGame = loadCurrentGame()
editedGame = {
    "title": "",
    "groups": ["", "", ""],
    "phrases": {
        "" : {
            "groupIds": [1]
        },
        "" : {
            "groupIds": [2]
        },
        "" : {
            "groupIds": [3]
        },
        "" : {
            "groupIds": [1,2]
        },
        "" : {
            "groupIds": [2,3]
        },
        "" : {
            "groupIds": [1,3]
        },
        "" : {
            "groupIds": [1,2,3]
        }
    }
}

if (currentGame) {
    if (currentGame.isLocal) {
        editedGame = JSON.parse(JSON.stringify(currentGame))
        editedGame.isLocal = true
    }
}

gameName = byId("name")
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

if (gameName) {
    gameName.value = editedGame.title
}

if (g1Name) {
    g1Name.value = editedGame.groups[0]
}
if (g2Name) {
    g2Name.value = editedGame.groups[1]
}
if (g3Name) {
    g3Name.value = editedGame.groups[2]
}

if (phrase1) {
    phrase1.value = getPhraseFromGroups(editedGame.phrases, [1])
}
if (phrase2) {
    phrase2.value = getPhraseFromGroups(editedGame.phrases, [2])
}
if (phrase3) {
    phrase3.value = getPhraseFromGroups(editedGame.phrases, [3])
}
if (phrase12) {
    phrase12.value = getPhraseFromGroups(editedGame.phrases, [1,2])
}
if (phrase13) {
    phrase13.value = getPhraseFromGroups(editedGame.phrases, [1,3])
}
if (phrase23) {
    phrase23.value = getPhraseFromGroups(editedGame.phrases, [2,3])
}
if (phrase123) {
    phrase123.value = getPhraseFromGroups(editedGame.phrases, [1,2,3])
}
