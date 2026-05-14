import { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import VennDiagram from './VennDiagram.jsx'
import CircleLabel from './CircleLabels.jsx'
import TermBank from './TermBank.jsx'
import SubmitBar from './SubmitBar.jsx'
import styles from './GameBoard.module.css'

export default function GameBoard({
  puzzle,
  onWin,
  onGameOver,
  debugMode = false,
  onOpenSettings,
  onOpenHowTo,
  onSelectGame,
  onQuit,
}) {
  const game = useGameState(puzzle)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (game.phase === 'won')  onWin({ placements: game.placements, revealedCircles: game.revealedCircles })
    if (game.phase === 'lost') onGameOver()
  }, [game.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRegionClick(regionKey) {
    if (regionKey === null) {
      if (game.selectedTermId) game.selectTerm(game.selectedTermId)
      return
    }
    if (game.selectedTermId) {
      game.placeTerm(regionKey)
    } else {
      const term = game.termInRegion(regionKey)
      if (term) game.selectTerm(term.id)
    }
  }

  function handleSettings()   { setPaused(false); onOpenSettings() }
  function handleHowTo()      { setPaused(false); onOpenHowTo() }
  function handleSelectGame() { setPaused(false); onSelectGame() }
  function handleQuit()       { setPaused(false); onQuit() }

  return (
    <div className={styles.screen}>

      <header className={styles.header}>
        <button
          className={styles.menuBtn}
          onClick={() => setPaused(true)}
          aria-label="Game menu"
        >
          ☰
        </button>
        <h1 className={styles.title}>{puzzle.title}</h1>
      </header>

      <div className={styles.body}>
        {/* Left/top: diagram */}
        <div className={styles.vennSide}>
          <div className={styles.vennWrap}>
            <CircleLabel circleId="1" revealedCircles={game.revealedCircles} />
            <CircleLabel circleId="2" revealedCircles={game.revealedCircles} />
            <CircleLabel circleId="3" revealedCircles={game.revealedCircles} />
            <VennDiagram
              puzzle={puzzle}
              placements={game.placements}
              selectedTermId={game.selectedTermId}
              revealedCircles={game.revealedCircles}
              validTargets={game.selectedTermId ? game.validTargetsFor(game.selectedTermId) : []}
              onRegionClick={handleRegionClick}
              debugMode={debugMode}
            />
          </div>
        </div>

        {/* Right/bottom: term bank until all placed, then submit bar */}
        <div className={styles.ctrlSide}>
          {game.unplacedTerms.length > 0 ? (
            <TermBank
              terms={game.unplacedTerms}
              selectedTermId={game.selectedTermId}
              onSelectTerm={game.selectTerm}
            />
          ) : (
            <SubmitBar
              attemptsLeft={game.attemptsLeft}
              maxAttempts={puzzle.maxAttempts}
              canSubmit={game.allRegionsFilled}
              onSubmit={game.submitGuess}
            />
          )}
        </div>
      </div>

      {/* Pause overlay — click backdrop to resume */}
      {paused && (
        <div className={styles.pauseOverlay} onClick={() => setPaused(false)}>
          <div className={styles.pauseCard} onClick={e => e.stopPropagation()}>
            <p className={styles.pauseHeading}>Paused</p>
            <p className={styles.pauseSub}>{puzzle.title}</p>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnPrimary}`}
              onClick={() => setPaused(false)}
            >
              Resume
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={handleHowTo}
            >
              How To Play
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={handleSettings}
            >
              Settings
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={handleSelectGame}
            >
              Select Game
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnQuit}`}
              onClick={handleQuit}
            >
              Quit Game
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
