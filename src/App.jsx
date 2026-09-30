import { useState, useEffect } from 'react'
import { useProgress } from './hooks/useProgress.js'
import { useCustomPuzzles } from './hooks/useCustomPuzzles.js'
import { fetchUnlockedPuzzles, isPuzzleUnlocked } from './utils/puzzleSchedule.js'
import { readShareParams, decodePuzzle, clearShareParams } from './utils/shareLink.js'
import HomeScreen from './components/HomeScreen.jsx'
import HowToPlayScreen from './components/HowToPlayScreen.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'
import PuzzleSelector from './components/PuzzleSelector.jsx'
import MyVennsScreen from './components/MyVennsScreen.jsx'
import EditorScreen from './components/EditorScreen.jsx'
import GameBoard from './components/GameBoard.jsx'
import WinScreen from './components/WinScreen.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'

// Rendered if a results screen is ever reached without its puzzle — a dead history entry,
// say. Shows a way out rather than a blank page.
function HomeFallback({ onHome }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, minHeight: '100dvh', padding: 24, textAlign: 'center',
    }}>
      <p>That game is no longer available.</p>
      <button onClick={onHome}>Go Home</button>
    </div>
  )
}

// screen: 'home' | 'howto' | 'settings' | 'selector' | 'game' | 'win' | 'gameover'
//       | 'myvenns' | 'editor'
const debugMode = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const [screen, setScreen] = useState('home')
  const [activePuzzle, setActivePuzzle] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [finalGameState, setFinalGameState] = useState(null)
  // Overlay rendered on top of GameBoard without unmounting it (preserves game state)
  const [gameOverlay, setGameOverlay] = useState(null) // null | 'settings' | 'howto' | 'selector'
  const { progress, recordResult, clearResult } = useProgress()
  const custom = useCustomPuzzles()
  // null = creating a new puzzle; a puzzle object = editing that one
  const [editingPuzzle, setEditingPuzzle] = useState(null)
  const [linkError, setLinkError] = useState(null)

  // A shared link goes straight into the game — no preview stop, no save prompt. Runs once
  // on load, before anything else touches history.
  useEffect(() => {
    const params = readShareParams(window.location.search)
    if (!params) return

    let cancelled = false
    ;(async () => {
      let puzzle = null

      if (params.kind === 'custom') {
        const decoded = decodePuzzle(params.payload)
        if (decoded) {
          // Saved on arrival, deduplicated on content — so opening the same link twice
          // does not make a second copy, and your own link hands back your own editable copy.
          const result = custom.receive(decoded)
          puzzle = result.ok ? result.puzzle : null
        }
      } else {
        try {
          const r = await fetch('/puzzles/index.json')
          const { puzzles } = await r.json()
          const entry = puzzles.find(e => e.id === params.id)
          // The weekly gate still applies: a link must not be a way to reach a puzzle
          // that has not been released yet.
          if (entry && isPuzzleUnlocked(entry.year, entry.sequence)) {
            const pr = await fetch(`/puzzles/${entry.file}`)
            if (pr.ok) puzzle = await pr.json()
          }
        } catch { /* falls through to the error below */ }
      }

      if (cancelled) return
      clearShareParams()
      if (puzzle) {
        setActivePuzzle(puzzle)
        setGameKey(k => k + 1)
        history.pushState({ screen: 'game' }, '')
        setScreen('game')
      } else {
        setLinkError("That puzzle link isn't valid.")
      }
    })()

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    // From the mid-game selector overlay, pop the overlay rather than replacing it. The
    // entry beneath is already { screen: 'game' }, and the new puzzle is in state, so it
    // simply becomes the new game's entry. Replacing instead left the OLD game's entry
    // under the new one, so Back led to a stale game. Beneath that is still wherever the
    // first game was started from, which is where results Back should go.
    if (gameOverlay) {
      history.back()
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

  function goTo(screen) {
    history.pushState({ screen }, '')
    setScreen(screen)
  }

  function handleOpenEditor(puzzle = null) {
    setEditingPuzzle(puzzle)
    goTo('editor')
  }

  // Save always succeeds for a well-formed draft, complete or not — an unfinished puzzle
  // is a draft worth keeping, not an error. Only a title clash or full storage can refuse.
  function handleSaveCustom(puzzle) {
    const result = custom.save(puzzle)
    if (result.ok) {
      setEditingPuzzle(null)
      history.replaceState({ screen: 'myvenns' }, '')
      setScreen('myvenns')
    }
    return result
  }

  // MyVennsScreen removes the puzzle through its own useCustomPuzzles instance, so its
  // list updates immediately. This only clears the progress entry, which would otherwise
  // linger as an orphan keyed to an id nothing can reach.

  function handleAllVenns() {
    history.pushState({ screen: 'selector' }, '')
    setScreen('selector')
  }

  function handleWin({ placements, revealedCircles, missesUsed, submissions }) {
    setGameOverlay(null)
    setFinalGameState({ placements, revealedCircles, submissions })
    recordResult(activePuzzle.id, { won: true, misses: missesUsed, submissions })
    // Replace the game entry — back from win goes to selector, not back into the finished game
    history.replaceState({ screen: 'win' }, '')
    setScreen('win')
  }

  function handleGameOver({ placements, revealedCircles, missesUsed, submissions }) {
    setGameOverlay(null)
    setFinalGameState({ placements, revealedCircles, submissions })
    recordResult(activePuzzle.id, { won: false, misses: missesUsed, submissions })
    history.replaceState({ screen: 'gameover' }, '')
    setScreen('gameover')
  }

  function handleRetry() {
    history.replaceState({ screen: 'game' }, '')
    setScreen('game')
  }

  // The results screens' only way out. The entry beneath them is always where the game
  // was started from — the list, or Home (Play Latest, Recent, or a shared link) — because
  // the game entry is replaced by the results rather than pushed over, and a puzzle picked
  // mid-game pops the selector overlay. So Back is simply Back, like every other screen.
  //
  // activePuzzle is deliberately kept: the results entry is still reachable with Forward,
  // and those screens rebuild their whole reveal from it — clearing it once blanked the app
  // (GameOverScreen with puzzle={null} threw inside buildRevealState).
  function handleResultsBack() {
    history.back()
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
          onHowToPlay={() => goTo('howto')}
          onSettings={() => goTo('settings')}
          onEdit={() => goTo('myvenns')}
          progress={progress}
          notice={linkError}
          onDismissNotice={() => setLinkError(null)}
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
          onEditPuzzle={handleOpenEditor}
          onBack={handleBackToHome}
          progress={progress}
        />
      )}
      {screen === 'myvenns' && (
        <MyVennsScreen
          onBack={handleBackToHome}
          onNew={() => handleOpenEditor(null)}
          onEdit={handleOpenEditor}
          onDeleted={clearResult}
        />
      )}
      {screen === 'editor' && (
        <EditorScreen
          puzzle={editingPuzzle}
          onSave={handleSaveCustom}
          onCancel={handleBackToHome}
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
      {/* Results screens are driven entirely by activePuzzle. Guarding here means any
          future navigation path that loses it degrades to Home instead of a white page. */}
      {screen === 'win' && !activePuzzle && <HomeFallback onHome={handleQuit} />}
      {screen === 'gameover' && !activePuzzle && <HomeFallback onHome={handleQuit} />}

      {screen === 'win' && activePuzzle && (
        <WinScreen
          puzzle={activePuzzle}
          placements={finalGameState?.placements}
          revealedCircles={finalGameState?.revealedCircles}
          submissions={finalGameState?.submissions}
          play={progress[activePuzzle.id]?.plays ?? 1}
          onBack={handleResultsBack}
        />
      )}
      {screen === 'gameover' && activePuzzle && (
        <GameOverScreen
          puzzle={activePuzzle}
          placements={finalGameState?.placements}
          lockedCircles={finalGameState?.revealedCircles}
          submissions={finalGameState?.submissions}
          onRetry={handleRetry}
          play={progress[activePuzzle.id]?.plays ?? 1}
          onBack={handleResultsBack}
        />
      )}
    </>
  )
}
