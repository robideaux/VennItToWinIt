import { useState, useEffect } from 'react'
import styles from './PuzzleSelector.module.css'
import { fetchUnlockedPuzzles, formatDisplayDate, formatStoredDate } from '../utils/puzzleSchedule.js'
import { useCustomPuzzles } from '../hooks/useCustomPuzzles.js'
import { displayTitle } from '../utils/customPuzzles.js'
import { validatePuzzle } from '../utils/validatePuzzle.js'

// Which sections are collapsed, remembered across visits. The library can run to dozens
// of rows, which buries the custom sections under a long scroll — so a collapse has to
// still be collapsed next time, or you would close it on every single visit.
const COLLAPSE_KEY = 'vennit_selector_collapsed'

function loadCollapsed() {
  try {
    const raw = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

export default function PuzzleSelector({ onSelectPuzzle, onEditPuzzle, onBack, progress = {} }) {
  const [collapsed, setCollapsed] = useState(loadCollapsed)

  function toggleSection(key) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]))
      } catch {
        /* a lost preference is not worth breaking the screen over */
      }
      return next
    })
  }

  const [library, setLibrary] = useState(null)
  const [manifestError, setManifestError] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [puzzleError, setPuzzleError] = useState(null)
  const { mine, shared } = useCustomPuzzles()

  useEffect(() => {
    fetchUnlockedPuzzles()
      .then(setLibrary)
      .catch(e => setManifestError(e.message))
  }, [])

  // Library puzzles are manifest entries and need fetching; custom puzzles are already
  // whole puzzle objects in localStorage, so they go straight through.
  async function handleSelectLibrary(entry) {
    setPuzzleError(null)
    setLoadingId(entry.id)
    try {
      const r = await fetch(`/puzzles/${entry.file}`)
      if (!r.ok) throw new Error(`Could not load "${entry.title}"`)
      onSelectPuzzle(await r.json())
    } catch (e) {
      setPuzzleError(e.message)
      setLoadingId(null)
    }
  }

  const sections = [
    library && {
      key: 'library',
      title: 'All Venns',
      rows: library.map(entry => ({
        id: entry.id,
        title: entry.title,
        meta: formatDisplayDate(entry.year, entry.sequence),
        onSelect: () => handleSelectLibrary(entry),
      })),
    },
    mine.length && {
      key: 'mine',
      title: 'My Venns',
      rows: mine.map(toCustomRow),
    },
    shared.length && {
      key: 'shared',
      title: 'Shared With Me',
      rows: shared.map(toCustomRow),
    },
  ].filter(Boolean)

  // An incomplete puzzle is a draft, not an error: it stays visible so it can never seem
  // to have vanished, but it opens the editor instead of starting an unplayable game.
  function toCustomRow(puzzle) {
    const incomplete = validatePuzzle(puzzle).status !== 'complete'
    return {
      id: puzzle.id,
      title: displayTitle(puzzle) || 'Untitled',
      // Shows when it was created or received. Two people can send you different puzzles
      // that happen to share a title — you don't control what they called theirs — and
      // the date is the only thing that distinguishes them without spoiling the content.
      meta: formatStoredDate(puzzle.createdAt),
      incomplete,
      onSelect: incomplete
        ? (onEditPuzzle ? () => onEditPuzzle(puzzle) : null)
        : () => onSelectPuzzle(puzzle),
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">
            ‹ Back
          </button>
        )}
        <h1 className={styles.title}>All Venns</h1>
      </header>

      <main className={styles.main}>
        {manifestError && <p className={styles.error}>{manifestError}</p>}
        {!library && !manifestError && <p className={styles.loading}>Loading…</p>}

        {sections.map(section => {
          // Drafts can't be played, so they don't belong in a "played" denominator.
          const playable = section.rows.filter(r => !r.incomplete)
          const played = playable.filter(r => progress[r.id]).length
          const isCollapsed = collapsed.has(section.key)
          return (
            <section key={section.key}>
              <button
                type="button"
                className={styles.sectionHead}
                onClick={() => toggleSection(section.key)}
                aria-expanded={!isCollapsed}
              >
                <span className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ''}`} aria-hidden="true">▾</span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                {/* Counts stay visible when collapsed — a closed section should still
                    tell you what is inside, or there is no way to judge opening it. */}
                <span className={styles.counter}>
                  {playable.length > 0
                    ? `${played} / ${playable.length} played`
                    : `${section.rows.length} draft${section.rows.length === 1 ? '' : 's'}`}
                </span>
              </button>
              <ul className={styles.list} hidden={isCollapsed}>
                {section.rows.map(row => (
                  <li key={row.id}>
                    <button
                      className={`${styles.row} ${progress[row.id] ? styles.played : ''} ${row.incomplete ? styles.incomplete : ''}`}
                      onClick={row.onSelect ?? undefined}
                      disabled={loadingId !== null || !row.onSelect}
                    >
                      {row.meta !== null && <span className={styles.date}>{row.meta}</span>}
                      <span className={styles.rowTitle}>{row.title}</span>
                      <span className={styles.status}>
                        {loadingId === row.id ? '…'
                          : row.incomplete ? <span className={styles.draftTag}>incomplete</span>
                          : progress[row.id] ? '✓' : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {puzzleError && <p className={styles.error}>{puzzleError}</p>}
      </main>
    </div>
  )
}
