import styles from './CircleLabels.module.css'
import { categoryColor, categoryInk, NEUTRAL_STROKE } from '../styles/colors.js'

// Circles are identified by position, since colour no longer marks them until solved.
const POSITION = { '1': 'top', '2': 'bottom-left', '3': 'bottom-right' }

export default function CircleLabel({ circleId, revealedCircles, onSubmit, canSubmit, flashCategory = null }) {
  const revealed = revealedCircles.find(r => r.circleId === circleId)
  // Neutral until solved, then the solved category's colour — the same for every player.
  const color = categoryColor(revealed?.category ?? flashCategory) ?? NEUTRAL_STROKE
  const ink = categoryInk(revealed?.category) ?? '#ffffff'
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
        style={{ borderColor: color, '--circle-color': color }}
        onClick={() => onSubmit(circleId)}
        disabled={!canSubmit}
        aria-label={`Submit the ${POSITION[circleId]} circle`}
      >
        <span className={styles.submitHint}>Submit</span>
        <span className={styles.groupHint}>Group</span>
      </button>
    )
  }

  return (
    <div
      className={className}
      style={{ borderColor: color, '--circle-color': color, '--circle-ink': ink }}
    >
      <span className={`${styles.label} ${revealed ? styles.revealed : styles.placeholder}`}>
        {revealed ? revealed.name : 'Group'}
      </span>
    </div>
  )
}
