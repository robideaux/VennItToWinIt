import { buildSolutionPlacements } from '../utils/puzzleUtils.js'
import VennDiagram from './VennDiagram.jsx'
import CircleLabels from './CircleLabels.jsx'
import styles from './GameOverScreen.module.css'

export default function GameOverScreen({ puzzle, onRetry, onPickNewPuzzle }) {
  const solutionPlacements = buildSolutionPlacements(puzzle)
  const revealedCircles = Object.keys(puzzle.categories).map((catKey, i) => ({
    circleId: String(i + 1),
    category: catKey,
    name: puzzle.categories[catKey],
  }))

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Out of attempts</h2>
        <div className={styles.buttons}>
          <button className={styles.btnSecondary} onClick={onPickNewPuzzle}>New Puzzle</button>
          <button className={styles.btnPrimary} onClick={onRetry}>Try Again</button>
        </div>
      </header>

      <CircleLabels revealedCircles={revealedCircles} position="top" />

      <div className={styles.vennWrap}>
        <VennDiagram
          puzzle={puzzle}
          placements={solutionPlacements}
          selectedTermId={null}
          revealedCircles={revealedCircles}
          validTargets={[]}
          onRegionClick={() => {}}
        />
      </div>

      <CircleLabels revealedCircles={revealedCircles} position="bottom" />
    </div>
  )
}
