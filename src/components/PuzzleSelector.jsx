import { useState, useEffect } from 'react'
import styles from './PuzzleSelector.module.css'
import { fetchUnlockedPuzzles, formatDisplayDate } from '../utils/puzzleSchedule.js'

export default function PuzzleSelector({ onSelectPuzzle, onBack, progress = {} }) {
  const [puzzles, setPuzzles] = useState(null)
  const [manifestError, setManifestError] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [puzzleError, setPuzzleError] = useState(null)

  useEffect(() => {
    fetchUnlockedPuzzles()
      .then(setPuzzles)
      .catch(e => setManifestError(e.message))
  }, [])

  async function handleSelect(entry) {
    setPuzzleError(null)
    setLoadingId(entry.id)
    try {
      const r = await fetch(`/puzzles/${entry.file}`)
      if (!r.ok) throw new Error(`Could not load "${entry.title}"`)
      const puzzle = await r.json()
      onSelectPuzzle(puzzle)
    } catch (e) {
      setPuzzleError(e.message)
      setLoadingId(null)
    }
  }

  const playedCount = puzzles ? puzzles.filter(e => progress[e.id]).length : 0
  const totalCount  = puzzles ? puzzles.length : 0

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">
            ‹ Back
          </button>
        )}
        <h1 className={styles.title}>All Venns</h1>
        {puzzles && (
          <span className={styles.counter}>{playedCount} / {totalCount} played</span>
        )}
      </header>

      <main className={styles.main}>
        {manifestError && <p className={styles.error}>{manifestError}</p>}
        {!puzzles && !manifestError && <p className={styles.loading}>Loading…</p>}
        {puzzles && (
          <ul className={styles.list}>
            {puzzles.map(entry => {
              const played = Boolean(progress[entry.id])
              return (
                <li key={entry.id}>
                  <button
                    className={`${styles.row} ${played ? styles.played : ''}`}
                    onClick={() => handleSelect(entry)}
                    disabled={loadingId !== null}
                  >
                    <span className={styles.date}>
                      {formatDisplayDate(entry.year, entry.sequence)}
                    </span>
                    <span className={styles.rowTitle}>{entry.title}</span>
                    <span className={styles.status}>
                      {loadingId === entry.id ? '…' : played ? '✓' : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {puzzleError && <p className={styles.error}>{puzzleError}</p>}
      </main>
    </div>
  )
}
