import { useState, useEffect } from 'react'
import styles from './PuzzleSelector.module.css'

export default function PuzzleSelector({ onSelectPuzzle }) {
  const [manifest, setManifest] = useState(null)
  const [manifestError, setManifestError] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [puzzleError, setPuzzleError] = useState(null)

  useEffect(() => {
    fetch('/puzzles/index.json')
      .then(r => {
        if (!r.ok) throw new Error('Could not load puzzle list')
        return r.json()
      })
      .then(setManifest)
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

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Venn It To Win It</h1>
        <p className={styles.subtitle}>Choose a puzzle to play</p>
      </header>

      <main className={styles.main}>
        {manifestError && (
          <p className={styles.error}>{manifestError}</p>
        )}
        {!manifest && !manifestError && (
          <p className={styles.loading}>Loading puzzles…</p>
        )}
        {manifest && (
          <ul className={styles.puzzleList}>
            {manifest.puzzles.map(entry => (
              <li key={entry.id}>
                <button
                  className={styles.puzzleButton}
                  onClick={() => handleSelect(entry)}
                  disabled={loadingId !== null}
                >
                  <span className={styles.puzzleTitle}>{entry.title}</span>
                  {loadingId === entry.id && (
                    <span className={styles.loadingDot}>…</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {puzzleError && (
          <p className={styles.error}>{puzzleError}</p>
        )}
      </main>
    </div>
  )
}
