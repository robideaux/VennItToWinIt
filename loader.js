const gamePrefix = "game:"
const localPrefix = "local:"
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
        if (key.startsWith(gamePrefix)) {
            strGame = localStorage.getItem(key)
            game = decompressGame(strGame)
            if (game) {
                games.push(game)
            }
        }
        if (key.startsWith(localPrefix)) {
            strGame = localStorage.getItem(key)
            game = decompressGame(strGame)
            if (game) {
                games.push(game)
            }
        }
    }
    games.sort((a,b) => {
        aLocal = a.isLocal ?? false
        bLocal = b.isLocal ?? false
        if (aLocal == bLocal) {
            return a.title.localeCompare(b.title)
        }
        if (aLocal == true) {
            return 1
        }
        return -1
        // return (aLocal < bLocal)
    })

    return games
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
    query = document.location.search
    if (query) {
        params = query.split(",")[0]
        if (params) {
            gameStr = params.replace("?game=", "")
            game = decompressGame(gameStr)
            if (game) {
                game.isLocal = true
                gameStr = compressGame(game)
                localStorage.setItem(localPrefix + game.title, gameStr)
            }
        }
    }
    return game
}

function saveLocalGame(game)
{
    if (game) {
        game.isLocal = true
        gameStr = compressGame(game)
        localStorage.setItem(localPrefix + game.title, gameStr)
    }
}

function deleteLocalGame(game)
{
    if (game) {
        localStorage.removeItem(localPrefix + game.title)
    }
}
