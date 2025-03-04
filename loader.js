const gamePrefix = "game:"
const currentKey = "current"

function storeCurrentGame(game) {
    compressed = compressGame(game)
    if (compressed) {
        localStorage.setItem(currentKey, compressed)
    } else {
        localStorage.setItem(currentKey, null)
    }
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
    }
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

function addQueryGame()
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
                localStorage.setItem(gamePrefix + game.title, gameStr)
            }
        }
    }
    return game
}
