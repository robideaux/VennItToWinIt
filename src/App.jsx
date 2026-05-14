import { useState } from 'react'
import PuzzleSelector from './components/PuzzleSelector.jsx'
import GameBoard from './components/GameBoard.jsx'
import WinScreen from './components/WinScreen.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'

// screen: 'selector' | 'game' | 'win' | 'gameover'
const debugMode = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const [screen, setScreen] = useState('selector')
  const [activePuzzle, setActivePuzzle] = useState(null)
  const [finalGameState, setFinalGameState] = useState(null)

  function handleSelectPuzzle(puzzle) {
    setActivePuzzle(puzzle)
    setScreen('game')
  }

  function handleWin({ placements, revealedCircles }) {
    setFinalGameState({ placements, revealedCircles })
    setScreen('win')
  }

  function handleGameOver() {
    setScreen('gameover')
  }

  function handleRetry() {
    setScreen('game')
  }

  function handleBackToSelector() {
    setActivePuzzle(null)
    setScreen('selector')
  }

  return (
    <>
      {screen === 'selector' && (
        <PuzzleSelector onSelectPuzzle={handleSelectPuzzle} />
      )}
      {screen === 'game' && (
        <GameBoard
          puzzle={activePuzzle}
          onWin={handleWin}
          onGameOver={handleGameOver}
          debugMode={debugMode}
        />
      )}
      {screen === 'win' && (
        <WinScreen
          puzzle={activePuzzle}
          placements={finalGameState?.placements}
          revealedCircles={finalGameState?.revealedCircles}
          onPlayAgain={handleBackToSelector}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          puzzle={activePuzzle}
          onRetry={handleRetry}
          onPickNewPuzzle={handleBackToSelector}
        />
      )}
    </>
  )
}
