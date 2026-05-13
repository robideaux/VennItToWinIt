import styles from './CircleLabels.module.css'

const CIRCLE_META = {
  '1': { color: '#ff6b6b', muted: '#c9a8a8' },
  '2': { color: '#51cf66', muted: '#96b89c' },
  '3': { color: '#339af0', muted: '#8aafc9' },
}

export default function CircleLabel({ circleId, revealedCircles }) {
  const revealed = revealedCircles.find(r => r.circleId === circleId)
  const { color, muted } = CIRCLE_META[circleId]
  const activeColor = revealed ? color : muted
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
