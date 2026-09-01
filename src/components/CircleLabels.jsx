import styles from './CircleLabels.module.css'
import { CIRCLE_COLORS } from '../styles/colors.js'

export default function CircleLabel({ circleId, revealedCircles, onSubmit, canSubmit }) {
  const revealed = revealedCircles.find(r => r.circleId === circleId)
  const { bold } = CIRCLE_COLORS[circleId]
  const interactive = !revealed && typeof onSubmit === 'function'

  const className = [
    styles.chip,
    styles[`circle${circleId}`],
    revealed ? styles.chipRevealed : '',
    interactive ? styles.chipButton : '',
  ].join(' ').trim()

  if (interactive) {
    return (
      <button
        type="button"
        className={className}
        style={{ borderColor: bold, '--circle-color': bold }}
        onClick={() => onSubmit(circleId)}
        disabled={!canSubmit}
        aria-label={`Submit Group ${circleId}`}
      >
        <span className={styles.submitHint}>Submit</span>
        <span className={styles.groupHint}>Group</span>
      </button>
    )
  }

  return (
    <div
      className={className}
      style={{ borderColor: bold, '--circle-color': bold }}
    >
      <span className={`${styles.label} ${revealed ? styles.revealed : styles.placeholder}`}>
        {revealed ? revealed.name : 'Group'}
      </span>
    </div>
  )
}
