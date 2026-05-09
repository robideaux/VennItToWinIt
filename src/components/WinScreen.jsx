import VennDiagram from './VennDiagram.jsx'
import CircleLabels from './CircleLabels.jsx'
import styles from './WinScreen.module.css'

export default function WinScreen({ puzzle, placements, revealedCircles, onPlayAgain }) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.heading}>You got it!</h2>
        <button className={styles.btn} onClick={onPlayAgain}>Play Another</button>
      </header>

      <CircleLabels revealedCircles={revealedCircles} position="top" />

      <div className={styles.vennWrap}>
        <VennDiagram
          puzzle={puzzle}
          placements={placements}
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
