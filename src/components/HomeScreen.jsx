import styles from './HomeScreen.module.css'

export default function HomeScreen({ onPlay, onHowToPlay, onSettings }) {
  return (
    <div className={styles.screen}>
      <div className={styles.bg} aria-hidden="true">
        <svg
          viewBox="0 0 320 380"
          preserveAspectRatio="xMidYMid slice"
          className={styles.bgSvg}
        >
          <circle cx="160" cy="115" r="97" fill="#ff6b6b" fillOpacity="0.55" style={{ mixBlendMode: 'multiply' }} />
          <circle cx="105" cy="235" r="97" fill="#51cf66" fillOpacity="0.55" style={{ mixBlendMode: 'multiply' }} />
          <circle cx="215" cy="235" r="97" fill="#339af0" fillOpacity="0.55" style={{ mixBlendMode: 'multiply' }} />
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
