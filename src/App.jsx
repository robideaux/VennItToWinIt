import { useState } from 'react'
import HomeScreen from './components/HomeScreen.jsx'
import HowToPlayScreen from './components/HowToPlayScreen.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'
import PuzzleSelector from './components/PuzzleSelector.jsx'
import GameBoard from './components/GameBoard.jsx'
import WinScreen from './components/WinScreen.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'

// screen: 'home' | 'howto' | 'settings' | 'selector' | 'game' | 'win' | 'gameover'
const debugMode = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const [screen, setScreen] = useState('home')
  const [activePuzzle, setActivePuzzle] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [finalGameState, setFinalGameState] = useState(null)
  // Overlay rendered on top of GameBoard without unmounting it (preserves game state)
  const [gameOverlay, setGameOverlay] = useState(null) // null | 'settings' | 'howto'

  function handleSelectPuzzle(puzzle) {
    setGameOverlay(null)
    setActivePuzzle(puzzle)
    setGameKey(k => k + 1)
    setScreen('game')
  }

  function handleWin({ placements, revealedCircles }) {
    setGameOverlay(null)
    setFinalGameState({ placements, revealedCircles })
    setScreen('win')
  }

  function handleGameOver() {
    setGameOverlay(null)
    setScreen('gameover')
  }

  function handleRetry() {
    setScreen('game')
  }

  function handleBackToSelector() {
    setActivePuzzle(null)
    setScreen('selector')
  }

  function handleBackToHome() {
    setScreen('home')
  }

  function handleQuit() {
    setGameOverlay(null)
    setActivePuzzle(null)
    setScreen('home')
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => setScreen('selector')}
          onHowToPlay={() => setScreen('howto')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'howto' && (
        <HowToPlayScreen onBack={handleBackToHome} />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={handleBackToHome} />
      )}
      {screen === 'selector' && (
        <PuzzleSelector
          onSelectPuzzle={handleSelectPuzzle}
          onBack={handleBackToHome}
        />
      )}
      {screen === 'game' && (
        <>
          <GameBoard
            key={gameKey}
            puzzle={activePuzzle}
            onWin={handleWin}
            onGameOver={handleGameOver}
            debugMode={debugMode}
            onOpenSettings={() => setGameOverlay('settings')}
            onOpenHowTo={() => setGameOverlay('howto')}
            onSelectGame={() => setGameOverlay('selector')}
            onQuit={handleQuit}
          />
          {/* Settings/HowTo rendered fixed on top — GameBoard stays mounted, game state preserved */}
          {gameOverlay === 'settings' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
              <SettingsScreen onBack={() => setGameOverlay(null)} />
            </div>
          )}
          {gameOverlay === 'howto' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
              <HowToPlayScreen onBack={() => setGameOverlay(null)} />
            </div>
          )}
          {gameOverlay === 'selector' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
              <PuzzleSelector
                onSelectPuzzle={handleSelectPuzzle}
                onBack={() => setGameOverlay(null)}
              />
            </div>
          )}
        </>
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
