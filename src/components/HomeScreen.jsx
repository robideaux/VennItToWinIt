import styles from './HomeScreen.module.css'
import { CIRCLE_COLORS } from '../styles/colors.js'

export default function HomeScreen({ onPlay, onHowToPlay, onSettings }) {
  return (
    <div className={styles.screen}>
      <div className={styles.bg} aria-hidden="true">
        <svg
          viewBox="0 0 320 380"
          preserveAspectRatio="xMidYMid slice"
          className={styles.bgSvg}
        >
          <circle className={styles.bgCircle} cx="160" cy="115" r="97" fill={CIRCLE_COLORS['1'].bold} fillOpacity="0.55" />
          <circle className={styles.bgCircle} cx="105" cy="235" r="97" fill={CIRCLE_COLORS['2'].bold} fillOpacity="0.55" />
          <circle className={styles.bgCircle} cx="215" cy="235" r="97" fill={CIRCLE_COLORS['3'].bold} fillOpacity="0.55" />
        </svg>
      </div>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Venn It To Win It</h1>
          <p className={styles.tagline}>Sort the terms. Find the overlap.</p>
        </header>

        <nav className={styles.nav}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={onPlay}>
            Play
          </button>
          <button className={styles.btn} onClick={onHowToPlay}>
            How To Play
          </button>
          <button className={styles.btn} onClick={onSettings}>
            Settings
          </button>
          <button className={`${styles.btn} ${styles.editBtn}`} disabled>
            Edit
            <span className={styles.badge}>Coming Soon</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
