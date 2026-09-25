import { useState } from 'react'
import VennDiagram from './VennDiagram.jsx'
import EditOverlay from './EditOverlay.jsx'
import GameBoard from './GameBoard.jsx'
import WinScreen from './WinScreen.jsx'
import GameOverScreen from './GameOverScreen.jsx'
import { toDraft, fromDraft, isBlankDraft } from '../utils/puzzleDraft.js'
import { validatePuzzle, issuesByField, MIN_ATTEMPTS, MAX_ATTEMPTS, MAX_TERM_CHARS, COUNTER_WITHIN } from '../utils/validatePuzzle.js'
import styles from './EditorScreen.module.css'

// Authoring screen. Save always succeeds — completeness gates whether a puzzle can be
// PLAYED, never whether it can be kept. A half-written puzzle is a draft, and refusing to
// save one is how you lose somebody's work.
export default function EditorScreen({ puzzle, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => toDraft(puzzle))
  // null when not testing; otherwise 'playing' | 'won' | 'lost'. A test runs the whole
  // arc, result screens included — those are part of what the author is checking, and
  // will be more so if they grow later.
  const [testPhase, setTestPhase] = useState(null)
  const [testFinal, setTestFinal] = useState(null)
  const [testRun, setTestRun] = useState(0)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState(null)

  const candidate = fromDraft(draft, puzzle ? { id: puzzle.id } : {})
  const { status, issues } = validatePuzzle(candidate)
  const complete = status === 'complete'

  // Conflicts only — never missing fields. An empty slot already reads as empty, so
  // marking it adds noise; a duplicate looks perfectly filled and is the thing you cannot
  // otherwise see. That also means a part-finished board is never a wall of red.
  const fieldIssues = testPhase ? new Map() : issuesByField(candidate)

  function handleSave() {
    if (isBlankDraft(draft)) { setError('Nothing to save yet.'); return }
    const result = onSave(candidate)
    if (!result?.ok) {
      setError(
        result?.reason === 'duplicate-title' ? 'You already have a puzzle with that name.'
        : result?.reason === 'storage-full'  ? 'Could not save — browser storage is full.'
        : 'Could not save this puzzle.'
      )
    }
  }

  // A real game on the real board, not a rendered still. Nothing is recorded: App's
  // recordResult is never involved, because this GameBoard reports back to here instead.
  function startTest() {
    setTestResult(null)
    setTestFinal(null)
    setTestRun(n => n + 1)   // forces a fresh board when testing again
    setTestPhase('playing')
  }

  function endTest(outcome = null) {
    setTestPhase(null)
    setTestFinal(null)
    setTestResult(outcome)
  }

  if (testPhase === 'playing') {
    const leave = () => endTest(null)
    return (
      <GameBoard
        key={testRun}
        puzzle={candidate}
        testMode
        onWin={final => { setTestFinal(final); setTestPhase('won') }}
        onGameOver={final => { setTestFinal(final); setTestPhase('lost') }}
        onQuit={leave}
        onOpenSettings={leave}
        onOpenHowTo={leave}
        onSelectGame={leave}
      />
    )
  }

  if (testPhase === 'won') {
    return (
      <WinScreen
        testMode
        puzzle={candidate}
        placements={testFinal?.placements}
        revealedCircles={testFinal?.revealedCircles}
        onPlayAgain={() => endTest('solved')}
      />
    )
  }

  if (testPhase === 'lost') {
    return (
      <GameOverScreen
        testMode
        puzzle={candidate}
        placements={testFinal?.placements}
        lockedCircles={testFinal?.revealedCircles}
        onRetry={startTest}
        onPickNewPuzzle={() => endTest('lost')}
      />
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <input
          className={styles.titleInput}
          value={draft.title}
          onChange={e => { setDraft({ ...draft, title: e.target.value }); setError(null) }}
          maxLength={MAX_TERM_CHARS}
          placeholder="Puzzle name"
          aria-label="Puzzle name"
        />
        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
      </header>

      {/* The name doubles as a hint about the hidden categories, so it is worth prompting
          for rather than leaving as an afterthought. */}
      {!draft.title.trim() && (
        <p className={styles.hint}>The name is the player's only clue — make it a good one.</p>
      )}
      {draft.title.length >= MAX_TERM_CHARS - COUNTER_WITHIN && (
        <p className={styles.hint}>{draft.title.length}/{MAX_TERM_CHARS}</p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {testResult && (
        <p className={styles.hint}>
          {testResult === 'solved'
            ? 'Test solved it — the puzzle works.'
            : 'Test ran out of attempts. Still valid, just hard.'}
        </p>
      )}

      <div className={styles.body}>
        <div className={styles.vennWrap}>
          <VennDiagram revealedCircles={[]}>
            <EditOverlay
              draft={draft}
              onChange={d => { setDraft(d); setError(null); setTestResult(null) }}
              fieldIssues={fieldIssues}
            />
          </VennDiagram>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.attempts}>
          <span className={styles.attemptsLabel}>Attempts</span>
          <div className={styles.pips} role="group" aria-label="Maximum attempts">
            {Array.from({ length: MAX_ATTEMPTS - MIN_ATTEMPTS + 1 }, (_, i) => {
              const n = MIN_ATTEMPTS + i
              return (
                <button
                  key={n}
                  type="button"
                  className={`${styles.pip} ${n <= draft.maxAttempts ? styles.pipOn : ''}`}
                  onClick={() => setDraft({ ...draft, maxAttempts: n })}
                  aria-label={`${n} attempts`}
                  aria-pressed={n === draft.maxAttempts}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.statusRow}>
          <button
            type="button"
            className={styles.testBtn}
            onClick={startTest}
            disabled={!complete}
            title={complete ? '' : 'Fill every term and category first'}
          >
            Test Play
          </button>
          {/* One label in both states. Saying "Ready to play" for a new puzzle and
              "Complete" for a saved one described the same condition two ways and read as
              two different things happening. */}
          <span className={complete ? styles.ready : styles.unfinished}>
            {complete
              ? 'Ready to play'
              : `${issues.length} to fix — saves as a draft`}
          </span>
        </div>
      </div>
    </div>
  )
}
