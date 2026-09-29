import { useState } from 'react'
import { useCustomPuzzles } from '../hooks/useCustomPuzzles.js'
import { displayTitle } from '../utils/customPuzzles.js'
import { validatePuzzle } from '../utils/validatePuzzle.js'
import { formatStoredDate } from '../utils/puzzleSchedule.js'
import { useCollapsedSections } from '../hooks/useCollapsedSections.js'
import styles from './MyVennsScreen.module.css'

// Manage your own puzzles, and puzzles people sent you.
//
// Received puzzles can be played and deleted but never edited: they stay as their author
// wrote them. That also sidesteps what editing someone else's puzzle would even mean.
export default function MyVennsScreen({ onBack, onNew, onEdit, onDeleted }) {
  // Deletes run through THIS component's hook instance on purpose. Every useCustomPuzzles()
  // call holds its own state, so deleting via a parent's instance would update the parent
  // and leave the row still on screen here. The parent only handles the progress side.
  const { mine, shared, remove } = useCustomPuzzles()
  const [confirming, setConfirming] = useState(null)
  // Its own key: collapsing a section while picking something to play says nothing about
  // whether you want it collapsed while editing.
  const { isCollapsed, toggle } = useCollapsedSections('vennit_edit_collapsed')

  function handleDelete(id) {
    remove(id)
    onDeleted(id)          // clears the orphaned progress entry
    setConfirming(null)
  }

  const sections = [
    { key: 'mine',   title: 'My Venns',        rows: mine,   editable: true },
    { key: 'shared', title: 'Shared With Me',  rows: shared, editable: false },
  ].filter(s => s.rows.length > 0)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">‹ Back</button>
        <h1 className={styles.title}>Edit Venns</h1>
        <button className={styles.newBtn} onClick={onNew}>+ New</button>
      </header>

      <main className={styles.main}>
        {sections.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>You haven't made any Venns yet.</p>
            <button className={styles.emptyBtn} onClick={onNew}>Make your first one</button>
          </div>
        )}

        {sections.map(section => {
          const collapsed = isCollapsed(section.key)
          return (
          <section key={section.key}>
            <button
              type="button"
              className={styles.sectionHead}
              onClick={() => toggle(section.key)}
              aria-expanded={!collapsed}
            >
              <span className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ''}`} aria-hidden="true">▾</span>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <span className={styles.sectionCount}>
                {section.rows.length} {section.rows.length === 1 ? 'puzzle' : 'puzzles'}
              </span>
            </button>
            <ul className={styles.list} hidden={collapsed}>
              {section.rows.map(puzzle => {
                const incomplete = validatePuzzle(puzzle).status !== 'complete'
                const isConfirming = confirming === puzzle.id
                return (
                  <li key={puzzle.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>
                        {displayTitle(puzzle) || 'Untitled'}
                        {incomplete && <span className={styles.draftTag}>incomplete</span>}
                      </span>
                      <span className={styles.rowMeta}>{formatStoredDate(puzzle.createdAt)}</span>
                    </div>

                    {isConfirming ? (
                      // Deleting a puzzle someone wrote cannot be undone — there is no
                      // copy anywhere else — so it asks first.
                      <div className={styles.actions}>
                        <button
                          className={styles.confirmBtn}
                          onClick={() => handleDelete(puzzle.id)}
                        >
                          Delete?
                        </button>
                        <button className={styles.actionBtn} onClick={() => setConfirming(null)}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actions}>
                        {section.editable && (
                          <button className={styles.actionBtn} onClick={() => onEdit(puzzle)}>
                            Edit
                          </button>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => setConfirming(puzzle.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
          )
        })}
      </main>
    </div>
  )
}
