const gamePrefix = "game:"
const localPrefix = "local:"
const sharedPrefix = "share:"
const currentKey = "current"

function storeCurrentGame(game) {
    compressed = compressGame(game)
    localStorage.setItem(currentKey, compressed)
}

function loadCurrentGame() {
    game = null
    compressed = localStorage.getItem(currentKey)
    if (compressed) {
        game = decompressGame(compressed)
    }
    return game
}

async function loadGames() {
    try {
        response = await fetch('https://api.github.com/repos/robideaux/VennItToWinIt/contents/games/')
        data = await response.json()
        if (data) {
            gameInfos = data.filter(isGameFile);
            for (info of gameInfos) {
                await downloadGame(info)
            }
            // clean up old/renamed games (from server only)
            storedNames = getStoredGameNames()
            for (keyName of storedNames) {
                fileName = keyName.replace(gamePrefix, "")
                if (gameInfos.findIndex(info => info.name == fileName) < 0) {
                    localStorage.removeItem(keyName)
                }
            }
        }
      } catch (error) {
        console.log("error reading game definitions: ")
        console.error(error)
      } finally {

        // populate?
      }    
}

function getAllGames() {
    games = [];
    for (let i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);
        if (key.startsWith(gamePrefix) || key.startsWith(localPrefix) || key.startsWith(sharedPrefix)) {
            strGame = localStorage.getItem(key)
            game = decompressGame(strGame)
            if (game) {
                games.push(game)
            }
        }
    }
    games.sort((a,b) => {
        aFirst = -1
        bFirst = 1
        aLocal = a.isLocal ?? false
        bLocal = b.isLocal ?? false
        aShared = a.isShared ?? false
        bShared = b.isShared ?? false

        // If same type, sort alphabetically
        if ((aLocal == bLocal) && (aShared == bShared)) {
            return a.title.localeCompare(b.title)
        }

        // always put locals at the end
        if (aLocal == true) {
            return bFirst
        }
        if (bLocal == true) {
            return aFirst
        }

        // source games go first
        if (aShared == true) {
            return bFirst
        }

        // put source first
        return -1
    })

    return games
}

function getStoredGameNames() {
    storedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);
        if (key.startsWith(gamePrefix)) {
            storedKeys.push(key)
        }
    }
    return storedKeys
}

function isGameFile(info) {
    return (info.name && info.name.endsWith(".json"))
}

async function downloadGame(fileInfo) {
    fileName = fileInfo.name
    var sha = localStorage.getItem(fileName)

    // Do we have it already, and does it match the "version" online?
    if (sha && sha == fileInfo.sha && localStorage.getItem(gamePrefix + fileName)) {
        // don't download
        return
    }

    // download it, and store it
    defResponse = await fetch(fileInfo.download_url)
    gameDef = await defResponse.json()
    compressed = compressGame(gameDef)
    if (compressed) {
        localStorage.setItem(fileName, fileInfo.sha)
        localStorage.setItem(gamePrefix + fileName, compressed)
    }
}

function getQueryGame()
{
    game = null
    // Add game from query string
    query = new URLSearchParams(document.location.search)
    gameStr = query.get("game")
    game = decompressGame(gameStr)
    if (game) {
        game.isLocal = false
        game.isShared = true
        gameStr = compressGame(game)
        localStorage.setItem(sharedPrefix + game.title, gameStr)
    }
    return game
}

function saveLocalGame(game)
{
    if (game) {
        game.isLocal = true
        game.isShared = false
        gameStr = compressGame(game)
        localStorage.setItem(localPrefix + game.title, gameStr)
    }
}

function deleteLocalGame(game)
{
    if (game) {
        localStorage.removeItem(localPrefix + game.title)
        localStorage.removeItem(sharedPrefix + game.title)
    }
}
