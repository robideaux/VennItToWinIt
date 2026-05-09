import { useEffect } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import VennDiagram from './VennDiagram.jsx'
import CircleLabels from './CircleLabels.jsx'
import TermBank from './TermBank.jsx'
import SubmitBar from './SubmitBar.jsx'
import styles from './GameBoard.module.css'

export default function GameBoard({ puzzle, onWin, onGameOver }) {
  const game = useGameState(puzzle)

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

  return (
    <div className={styles.screen}>

      {/* Left/top: title + submit bar + diagram */}
      <div className={styles.vennSide}>
        <header className={styles.header}>
          <h2 className={styles.title}>{puzzle.title}</h2>
          <SubmitBar
            attemptsLeft={game.attemptsLeft}
            maxAttempts={puzzle.maxAttempts}
            canSubmit={game.allRegionsFilled}
            onSubmit={game.submitGuess}
          />
        </header>

        {/* Portrait: circle 1 label above diagram; landscape: all 3 in one row */}
        <CircleLabels
          revealedCircles={game.revealedCircles}
          position="top"
        />

        <div className={styles.vennWrap}>
          <VennDiagram
            puzzle={puzzle}
            placements={game.placements}
            selectedTermId={game.selectedTermId}
            revealedCircles={game.revealedCircles}
            validTargets={game.selectedTermId ? game.validTargetsFor(game.selectedTermId) : []}
            onRegionClick={handleRegionClick}
          />
        </div>

        {/* Portrait: circles 2 & 3 labels below diagram */}
        <CircleLabels
          revealedCircles={game.revealedCircles}
          position="bottom"
        />
      </div>

      {/* Right/bottom: term bank only — disappears when empty */}
      {game.unplacedTerms.length > 0 && (
        <div className={styles.ctrlSide}>
          <TermBank
            terms={game.unplacedTerms}
            selectedTermId={game.selectedTermId}
            onSelectTerm={game.selectTerm}
          />
        </div>
      )}

    </div>
  )
}
