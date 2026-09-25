import VennDiagram from './VennDiagram.jsx'
import PlayOverlay from './PlayOverlay.jsx'
import CircleLabel from './CircleLabels.jsx'
import styles from './WinScreen.module.css'

export default function WinScreen({ puzzle, placements, revealedCircles, onPlayAgain, testMode = false }) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.heading}>You got it!</h2>
        <button className={styles.btn} onClick={onPlayAgain}>{testMode ? 'Back to editing' : 'Play Another'}</button>
      </header>

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
