import { useState, useEffect } from 'react'
import styles from './SettingsScreen.module.css'

const STORAGE_KEY = 'vennit_settings'
const DEFAULTS = { theme: 'system', audio: true }

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'system' ? '' : theme
}

export default function SettingsScreen({ onBack }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    applyTheme(settings.theme)
  }, [settings])

  function set(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">
          ‹ Back
        </button>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Theme</h2>
          <div className={styles.segmented} role="group" aria-label="Theme">
            {[['light', 'Light'], ['system', 'System'], ['dark', 'Dark']].map(([val, label]) => (
              <button
                key={val}
                className={`${styles.seg} ${settings.theme === val ? styles.segActive : ''}`}
                onClick={() => set('theme', val)}
                aria-pressed={settings.theme === val}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>Dark mode styling coming in a future update.</p>
        </section>

        <section className={styles.section}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <h2 className={styles.sectionTitle}>Sound Effects</h2>
              <p className={styles.hint}>Audio support coming in a future update.</p>
            </div>
            <button
              className={`${styles.toggle} ${settings.audio ? styles.toggleOn : ''}`}
              onClick={() => set('audio', !settings.audio)}
              aria-pressed={settings.audio}
              aria-label="Toggle sound effects"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
