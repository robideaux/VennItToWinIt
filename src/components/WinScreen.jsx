import VennDiagram from './VennDiagram.jsx'
import PlayOverlay from './PlayOverlay.jsx'
import CircleLabel from './CircleLabels.jsx'
import { useShare } from '../hooks/useShare.js'
import { buildResultBlock } from '../utils/resultBlock.js'
import styles from './WinScreen.module.css'

// `play` is which play of this puzzle this was; a replay's share text says so.
export default function WinScreen({ puzzle, placements, revealedCircles, submissions = [], play = 1, onBack, testMode = false }) {
  const { share, status, fallbackUrl, dismissFallback } = useShare()

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {/* Back returns to wherever this game was started from — see handleResultsBack */}
        <button className={styles.backBtn} onClick={onBack}>{testMode ? '‹ Edit' : '‹ Back'}</button>
        <h2 className={styles.heading}>You got it!</h2>
        <div className={styles.buttons}>
          {!testMode && (
            <button className={styles.btn} onClick={() => share(puzzle, buildResultBlock({ title: puzzle.title, submissions, won: true, play }))}>Share</button>
          )}
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
            <PlayOverlay puzzle={puzzle} placements={placements} />
          </VennDiagram>
        </div>
      </div>
    </div>
  )
}
