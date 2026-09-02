import { useState, useEffect } from 'react'
import { useProgress } from './hooks/useProgress.js'
import { fetchUnlockedPuzzles } from './utils/puzzleSchedule.js'
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
  const [gameOverlay, setGameOverlay] = useState(null) // null | 'settings' | 'howto' | 'selector'
  const { progress, recordResult } = useProgress()

  useEffect(() => {
    // Seed the initial history entry so back-navigation lands here instead of leaving the app
    history.replaceState({ screen: 'home' }, '')

    function onPopState(e) {
      const state = e.state
      if (!state?.screen) return
      setGameOverlay(state.overlay ?? null)
      setScreen(state.screen)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function handleSelectPuzzle(puzzle) {
    setActivePuzzle(puzzle)
    setGameKey(k => k + 1)
    // If selecting from the mid-game selector overlay, replace that entry so back
    // doesn't reopen the overlay on the new game
    if (gameOverlay) {
      history.replaceState({ screen: 'game' }, '')
    } else {
      history.pushState({ screen: 'game' }, '')
    }
    setGameOverlay(null)
    setScreen('game')
  }

  async function handlePlayLatest() {
    try {
      const unlocked = await fetchUnlockedPuzzles()
      if (!unlocked.length) return
      const entry = unlocked[0]
      const r = await fetch(`/puzzles/${entry.file}`)
      if (!r.ok) throw new Error()
      const puzzle = await r.json()
      setActivePuzzle(puzzle)
      setGameKey(k => k + 1)
      history.pushState({ screen: 'game' }, '')
      setScreen('game')
    } catch {
      // stay on home if fetch fails
    }
  }

  function handleAllVenns() {
    history.pushState({ screen: 'selector' }, '')
    setScreen('selector')
  }

  function handleWin({ placements, revealedCircles, attemptsUsed }) {
    setGameOverlay(null)
    setFinalGameState({ placements, revealedCircles })
    recordResult(activePuzzle.id, { won: true, attempts: attemptsUsed })
    // Replace the game entry — back from win goes to selector, not back into the finished game
    history.replaceState({ screen: 'win' }, '')
    setScreen('win')
  }

  function handleGameOver({ placements, revealedCircles, attemptsUsed }) {
    setGameOverlay(null)
    setFinalGameState({ placements, revealedCircles })
    recordResult(activePuzzle.id, { won: false, attempts: attemptsUsed })
    history.replaceState({ screen: 'gameover' }, '')
    setScreen('gameover')
  }

  function handleRetry() {
    history.replaceState({ screen: 'game' }, '')
    setScreen('game')
  }

  function handleBackToSelector() {
    setActivePuzzle(null)
    history.pushState({ screen: 'selector' }, '')
    setScreen('selector')
  }

  function handleBackToHome() {
    // Let the browser pop the history entry; popstate listener handles setScreen
    history.back()
  }

  function handleQuit() {
    setGameOverlay(null)
    setActivePuzzle(null)
    history.pushState({ screen: 'home' }, '')
    setScreen('home')
  }

  function openOverlay(overlay) {
    history.pushState({ screen: 'game', overlay }, '')
    setGameOverlay(overlay)
  }

  function closeOverlay() {
    history.back()
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          onPlayLatest={handlePlayLatest}
          onAllVenns={handleAllVenns}
          onHowToPlay={() => { history.pushState({ screen: 'howto' }, ''); setScreen('howto') }}
          onSettings={() => { history.pushState({ screen: 'settings' }, ''); setScreen('settings') }}
          progress={progress}
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
          progress={progress}
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
            onOpenSettings={() => openOverlay('settings')}
            onOpenHowTo={() => openOverlay('howto')}
            onSelectGame={() => openOverlay('selector')}
            onQuit={handleQuit}
          />
          {/* Settings/HowTo rendered fixed on top — GameBoard stays mounted, game state preserved */}
          {gameOverlay === 'settings' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
              <SettingsScreen onBack={closeOverlay} />
            </div>
          )}
          {gameOverlay === 'howto' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
              <HowToPlayScreen onBack={closeOverlay} />
            </div>
          )}
          {gameOverlay === 'selector' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
              <PuzzleSelector
                onSelectPuzzle={handleSelectPuzzle}
                onBack={closeOverlay}
                progress={progress}
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
          placements={finalGameState?.placements}
          lockedCircles={finalGameState?.revealedCircles}
          onRetry={handleRetry}
          onPickNewPuzzle={handleBackToSelector}
        />
      )}
    </>
  )
}
