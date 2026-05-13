import styles from './CircleLabels.module.css'
import { CIRCLE_COLORS } from '../styles/colors.js'

export default function CircleLabel({ circleId, revealedCircles }) {
  const revealed = revealedCircles.find(r => r.circleId === circleId)
  const { bold, muted } = CIRCLE_COLORS[circleId]
  const activeColor = revealed ? bold : muted
  const chipBg = revealed ? 'rgba(255,255,255,0.9)' : 'rgba(173,181,189,0.25)'

  return (
    <div
      className={`${styles.chip} ${styles[`circle${circleId}`]}`}
      style={{ borderColor: activeColor, background: chipBg }}
    >
      <span className={styles.dot} style={{ background: activeColor }} />
      <span className={`${styles.label} ${revealed ? styles.revealed : styles.placeholder}`}>
        {revealed ? revealed.name : `Group ${circleId}`}
      </span>
    </div>
  )
}
