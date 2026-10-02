import { useState, useEffect } from 'react'
import styles from './SettingsScreen.module.css'
import { applyTheme } from '../utils/theme.js'
import { loadSettings, saveSettings } from '../utils/settings.js'
import { vibrationSupported, haptic } from '../utils/haptics.js'

export default function SettingsScreen({ onBack }) {
  const [settings, setSettings] = useState(loadSettings)
  // Decided once per visit: it depends on the device, which does not change under us
  const [canVibrate] = useState(() => vibrationSupported())

  useEffect(() => {
    saveSettings(settings)
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
        </section>

        <section className={styles.section}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <h2 className={styles.sectionTitle}>Vibration</h2>
              <p className={styles.hint}>
                {canVibrate
                  ? 'Short taps and buzzes as you play.'
                  : "Not available on this device. iPhones don't allow websites to vibrate."}
              </p>
            </div>
            <button
              className={`${styles.toggle} ${canVibrate && settings.vibration ? styles.toggleOn : ''}`}
              onClick={() => {
                const next = !settings.vibration
                set('vibration', next)
                // A buzz on switching it ON, so you can tell it works. The setting is not
                // saved yet at this moment, hence force.
                if (next) haptic('solve', { force: true })
              }}
              disabled={!canVibrate}
              aria-pressed={canVibrate && settings.vibration}
              aria-label="Toggle vibration"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <h2 className={styles.sectionTitle}>Sound Effects</h2>
              <p className={styles.hint}>Coming in a future update.</p>
            </div>
            {/* No audio exists yet, so this stays off and cannot be changed */}
            <button
              className={styles.toggle}
              disabled
              aria-pressed={false}
              aria-label="Toggle sound effects (not available yet)"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
