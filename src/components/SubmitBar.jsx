import styles from './SubmitBar.module.css'

export default function SubmitBar({ attemptsLeft, maxAttempts, canSubmit, onSubmit }) {
  return (
    <div className={styles.bar}>
      <div className={styles.pips}>
        {Array.from({ length: maxAttempts }, (_, i) => (
          <span key={i} className={`${styles.pip} ${i < attemptsLeft ? styles.active : ''}`} />
        ))}
      </div>
      <button
        className={styles.submitBtn}
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        Submit
      </button>
    </div>
  )
}
