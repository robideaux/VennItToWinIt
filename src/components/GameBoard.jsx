import { useEffect } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import VennDiagram from './VennDiagram.jsx'
import CircleLabel from './CircleLabels.jsx'
import TermBank from './TermBank.jsx'
import SubmitBar from './SubmitBar.jsx'
import styles from './GameBoard.module.css'

export default function GameBoard({ puzzle, onWin, onGameOver, debugMode = false }) {
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

      {/* Left/top: title + diagram */}
      <div className={styles.vennSide}>
        <header className={styles.header}>
          <h2 className={styles.title}>{puzzle.title}</h2>
        </header>

        <div className={styles.vennWrap}>
          {/* Circle label chips — absolutely positioned over the diagram */}
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
  )
}
