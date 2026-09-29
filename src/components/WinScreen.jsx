import VennDiagram from './VennDiagram.jsx'
import PlayOverlay from './PlayOverlay.jsx'
import CircleLabel from './CircleLabels.jsx'
import { useShare } from '../hooks/useShare.js'
import { buildResultBlock } from '../utils/resultBlock.js'
import styles from './WinScreen.module.css'

export default function WinScreen({ puzzle, placements, revealedCircles, submissions = [], onPlayAgain, testMode = false }) {
  const { share, status, fallbackUrl, dismissFallback } = useShare()

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.heading}>You got it!</h2>
        {!testMode && (
          <button className={styles.btn} onClick={() => share(puzzle, buildResultBlock({ title: puzzle.title, submissions, won: true }))}>Share</button>
        )}
        <button className={styles.btn} onClick={onPlayAgain}>{testMode ? 'Back to editing' : 'Play Another'}</button>
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
