import { useMemo } from 'react'
import { buildRevealState } from '../utils/puzzleUtils.js'
import { useRevealAnimation } from '../hooks/useRevealAnimation.js'
import VennDiagram from './VennDiagram.jsx'
import PlayOverlay from './PlayOverlay.jsx'
import CircleLabel from './CircleLabels.jsx'
import { useShare } from '../hooks/useShare.js'
import { buildResultBlock } from '../utils/resultBlock.js'
import styles from './GameOverScreen.module.css'

export default function GameOverScreen({ puzzle, placements, lockedCircles, submissions = [], onRetry, onPickNewPuzzle, testMode = false }) {
  const { placements: revealPlacements, revealedCircles } = useMemo(
    () => buildRevealState(puzzle, lockedCircles ?? []),
    [puzzle, lockedCircles]
  )
  const { share, status, fallbackUrl, dismissFallback } = useShare()
  const { board, step } = useRevealAnimation(placements ?? revealPlacements, revealPlacements)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Out of attempts</h2>
        <div className={styles.buttons}>
          {!testMode && (
            <button className={styles.btnSecondary} onClick={() => share(puzzle, buildResultBlock({ title: puzzle.title, submissions, won: false }))}>Share</button>
          )}
          <button className={styles.btnSecondary} onClick={onPickNewPuzzle}>{testMode ? 'Back to editing' : 'New Puzzle'}</button>
          <button className={styles.btnPrimary} onClick={onRetry}>{testMode ? 'Test again' : 'Try Again'}</button>
        </div>
      </header>
      {status && <p className={styles.toast}>{status}</p>}
      {fallbackUrl && (
        <div className={styles.copyFallback}>
          <p>Copy this link:</p>
          <input readOnly value={fallbackUrl} onFocus={e => e.target.select()} />
          <button onClick={dismissFallback}>Done</button>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.vennWrap}>
          <CircleLabel circleId="1" revealedCircles={revealedCircles} />
          <CircleLabel circleId="2" revealedCircles={revealedCircles} />
          <CircleLabel circleId="3" revealedCircles={revealedCircles} />
          <VennDiagram revealedCircles={revealedCircles}>
            <PlayOverlay puzzle={puzzle} placements={board} shuffleStep={step} />
          </VennDiagram>
        </div>
      </div>
    </div>
  )
}
