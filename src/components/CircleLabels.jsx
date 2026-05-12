import styles from './CircleLabels.module.css'

const CIRCLE_META = {
  '1': { color: '#ff6b6b' },
  '2': { color: '#51cf66' },
  '3': { color: '#339af0' },
}

export default function CircleLabel({ circleId, revealedCircles }) {
  const revealed = revealedCircles.find(r => r.circleId === circleId)
  const { color } = CIRCLE_META[circleId]

  return (
    <div className={`${styles.chip} ${styles[`circle${circleId}`]}`} style={{ borderColor: color }}>
      <span
        className={styles.dot}
        style={{ background: color }}
      />
      <span className={`${styles.label} ${revealed ? styles.revealed : styles.placeholder}`}>
        {revealed ? revealed.name : `Group ${circleId}`}
      </span>
    </div>
  )
}
