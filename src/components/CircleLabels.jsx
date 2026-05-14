import styles from './CircleLabels.module.css'
import { CIRCLE_COLORS } from '../styles/colors.js'

export default function CircleLabel({ circleId, revealedCircles }) {
  const revealed = revealedCircles.find(r => r.circleId === circleId)
  const { bold, muted } = CIRCLE_COLORS[circleId]
  const activeColor = revealed ? bold : muted

  return (
    <div
      className={`${styles.chip} ${styles[`circle${circleId}`]} ${revealed ? styles.chipRevealed : ''}`}
      style={{ borderColor: activeColor, '--circle-color': bold }}
    >
      <span className={styles.dot} style={{ background: activeColor }} />
      <span className={`${styles.label} ${revealed ? styles.revealed : styles.placeholder}`}>
        {revealed ? revealed.name : `Group ${circleId}`}
      </span>
    </div>
  )
}
