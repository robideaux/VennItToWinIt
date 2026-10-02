import { useState, useEffect, useRef } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import { MISSES, isMiss } from '../utils/gameRules.js'
import { haptic, cueForSubmit } from '../utils/haptics.js'
import {
  SWAP_MS, SUBMIT_DIM_MS, RESULTS_HOLD_MS, prefersReducedMotion, swapFor, feedbackView,
} from '../utils/feedback.js'
import {
  ONE_SHOT_HINT, ONE_SHOT_CONFIRM, ONE_SHOT_RESULT,
  ONE_SHOT_RESULT_FOOTER, ONE_SHOT_RESULT_DISMISS, oneShotResultTitle,
} from '../copy/oneShot.js'
import { useShuffleAnimation } from '../hooks/useShuffleAnimation.js'
import VennDiagram from './VennDiagram.jsx'
import PlayOverlay from './PlayOverlay.jsx'
import CircleLabel from './CircleLabels.jsx'
import styles from './GameBoard.module.css'

export default function GameBoard({
  puzzle,
  onWin,
  onGameOver,
  debugMode = false,
  onOpenSettings,
  onOpenHowTo,
  onSelectGame,
  onQuit,
  // Test play from the editor: the same real board, but the pause menu drops the
  // navigation that would take an author out of their own puzzle mid-check.
  testMode = false,
}) {
  const game = useGameState(puzzle)
  const shuffle = useShuffleAnimation()
  const [paused, setPaused] = useState(false)
  // Asked before the first One Shot of a session. The surprising part is that a miss
  // reveals nothing — without saying so first, the natural read of a board that does not
  // light up is that the button is broken.
  const [confirmOneShot, setConfirmOneShot] = useState(false)
  const [oneShotNotice, setOneShotNotice] = useState(null)
  // Pointed at the button the very first time anyone opens a game. Without it the control
  // is a bare glyph in a corner, and the mechanic is easy never to discover at all.
  const [showHint, setShowHint] = useState(() => !hasSeenOneShotHint())

  // ── A submit is a beat, not an instant ────────────────────────────────────────
  // The game state moves the moment a submit happens; what the player SEES lags it by
  // SUBMIT_DIM_MS. For that beat the circle concerned (all three, for a One Shot) is dim
  // and shown unsolved, the miss pip has not yet gone, and nothing has buzzed. Then the
  // result lands together: colour rises out of the dim or the grey returns, the pip pops,
  // the haptic fires. \`resolved\` is how many submits the view has caught up with.
  const submitted = game.submissions.length
  const [resolved, setResolved] = useState(0)
  const [popPip, setPopPip] = useState(null)   // index of the pip that just went
  const view = feedbackView({
    submissions: game.submissions, resolved, revealedCircles: game.revealedCircles,
    missesLeft: game.missesLeft, isMiss,
  })
  const pending = view.pending

  useEffect(() => {
    if (!pending) return
    const last = game.submissions[submitted - 1]
    const t = setTimeout(() => {
      setResolved(submitted)
      // The end of the game outranks the submit that caused it — see cueForSubmit. Fired
      // from here, not the reducer, which must stay pure.
      haptic(cueForSubmit(last, game.phase))
      if (isMiss(last)) setPopPip(game.missesLeft)
      // Held until now: it states the result, and would give it away mid-pulse
      if (last.type === 'oneShot' && last.correctCount < 3) setOneShotNotice(last.correctCount)
    }, SUBMIT_DIM_MS)
    return () => clearTimeout(t)
  }, [submitted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Move on to the results only once the last submit has landed, then hold a moment so
  // the final colour, or the pip that just went, is actually seen.
  useEffect(() => {
    if (pending || (game.phase !== 'won' && game.phase !== 'lost')) return
    const t = setTimeout(() => {
      if (game.phase === 'won') {
        onWin({ placements: game.placements, revealedCircles: game.revealedCircles, missesUsed: MISSES - game.missesLeft, submissions: game.submissions })
      } else {
        onGameOver({ placements: game.placements, revealedCircles: game.revealedCircles, missesUsed: MISSES, submissions: game.submissions })
      }
    }, RESULTS_HOLD_MS)
    return () => clearTimeout(t)
  }, [game.phase, pending]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dropping a term: the two terms visibly trade places ──────────────────────
  // Purely cosmetic and interruptible: the move is already committed, and the next tap
  // cuts the slide short rather than waiting for it.
  const [swap, setSwap] = useState(null)
  const swapTimer = useRef(null)
  const swapSeq = useRef(0)
  useEffect(() => () => clearTimeout(swapTimer.current), [])

  function clearSwap() {
    clearTimeout(swapTimer.current)
    setSwap(null)
  }

  useEffect(() => {
    shuffle.start()
  }, [game.gameKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showHint) return
    rememberOneShotHint()          // shown once ever, even if it is never dismissed
    const dismiss = () => setShowHint(false)
    const hide = setTimeout(dismiss, ONE_SHOT_HINT.durationMs)
    // Armed a tick late, so the tap that started this game does not instantly dismiss
    // the hint that same tap just caused to appear.
    const arm = setTimeout(
      () => document.addEventListener('pointerdown', dismiss, { once: true }), 0)
    return () => {
      clearTimeout(hide)
      clearTimeout(arm)
      document.removeEventListener('pointerdown', dismiss)
    }
  }, [showHint])

  function handleRegionClick(regionKey) {
    if (shuffle.step !== null) {
      shuffle.skip()
      return
    }
    // A submit being checked, or a finished game waiting to move on, takes no input
    if (pending || game.phase !== 'playing') return
    if (swap) clearSwap()
    if (regionKey === null) {
      // Tapping bare diagram puts the term back down
      if (game.selectedTermId) {
        game.selectTerm(game.selectedTermId)
        haptic('put')
      }
      return
    }
    if (game.selectedTermId) {
      // A dimmed or locked spot does nothing and keeps the term in hand. Deliberately no
      // cue for that: the dimming already says it, and a buzz would read as an error.
      if (game.validTargetsFor(game.selectedTermId).includes(regionKey)) {
        const move = prefersReducedMotion() ? null : swapFor(game.placements, game.selectedTermId, regionKey)
        game.placeTerm(regionKey)
        haptic('put')
        if (move) {
          setSwap({ ...move, id: ++swapSeq.current })
          swapTimer.current = setTimeout(() => setSwap(null), SWAP_MS + 60)
        }
      }
    } else {
      const term = game.termInRegion(regionKey)
      if (term) {
        game.selectTerm(term.id)
        haptic('pick')
      }
    }
  }

  function runOneShot() {
    setConfirmOneShot(false)
    game.submitAll()
  }

  // One submit at a time: a second tap during the beat would stack two pulses
  function submitCircle(circleId) {
    if (!pending) game.submitCircle(circleId)
  }

  function handleSettings()   { setPaused(false); onOpenSettings() }
  function handleHowTo()      { setPaused(false); onOpenHowTo() }
  function handleSelectGame() { setPaused(false); onSelectGame() }
  function handleQuit()       { setPaused(false); onQuit() }

  return (
    <div className={styles.screen}>

      <header className={styles.header}>
        <button
          className={styles.menuBtn}
          onClick={() => setPaused(true)}
          aria-label="Game menu"
        >
          ☰
        </button>
        <h1 className={styles.title}>{puzzle.title}</h1>
        {/* One slot, two states. While it is available this is the button; once spent it
            becomes the record of what it told you, in the same place. Sitting beside the
            miss pips groups it with the other thing it costs. */}
        {game.canOneShot ? (
          <span className={styles.oneShotWrap}>
          <button
            className={styles.oneShotBtn}
            onClick={() => {
              if (hasSeenOneShotWarning()) runOneShot()
              else setConfirmOneShot(true)
            }}
            aria-label="One Shot — check all three groups, opening move only"
            title="One Shot — check all three groups · opening move only"
          >
            ↯
          </button>
          {showHint && (
            <span className={styles.coachMark} role="status">
              <strong className={styles.coachTitle}>{ONE_SHOT_HINT.title}</strong>
              <span className={styles.coachBody}>{ONE_SHOT_HINT.body}</span>
            </span>
          )}
          </span>
        ) : resolved > 0 && game.lastOneShot && !game.lastOneShot.won ? (
          <span
            className={styles.oneShotRecord}
            title={`One Shot said ${game.lastOneShot.correctCount} of 3 were correct`}
          >
            ↯{game.lastOneShot.correctCount}
          </span>
        ) : null}
        <div
          className={styles.pips}
          aria-label={`${game.missesLeft} of ${MISSES} misses left`}
        >
          {Array.from({ length: MISSES }, (_, i) => (
            <span
              key={i}
              className={[
                styles.pip,
                i < view.shownMisses ? styles.pipActive : '',
                i === popPip ? styles.pipLost : '',
              ].join(' ').trim()}
            />
          ))}
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.vennWrap}>
          <CircleLabel
            circleId="1"
            revealedCircles={view.shownRevealed}
            onSubmit={submitCircle}
            canSubmit={game.isCircleFilled('1')}
            flashCategory={shuffle.flash?.['1']}
          />
          <CircleLabel
            circleId="2"
            revealedCircles={view.shownRevealed}
            onSubmit={submitCircle}
            canSubmit={game.isCircleFilled('2')}
            flashCategory={shuffle.flash?.['2']}
          />
          <CircleLabel
            circleId="3"
            revealedCircles={view.shownRevealed}
            onSubmit={submitCircle}
            canSubmit={game.isCircleFilled('3')}
            flashCategory={shuffle.flash?.['3']}
          />
          <VennDiagram
            revealedCircles={view.shownRevealed}
            dimmed={view.pulseIds}
            flash={shuffle.flash}
            onRegionClick={handleRegionClick}
            debugMode={debugMode}
          >
            <PlayOverlay
              puzzle={puzzle}
              placements={game.placements}
              selectedTermId={game.selectedTermId}
              validTargets={game.selectedTermId ? game.validTargetsFor(game.selectedTermId) : []}
              onRegionClick={handleRegionClick}
              shuffleStep={shuffle.step}
              swap={swap}
            />
          </VennDiagram>
        </div>
      </div>

      {/* Acknowledged rather than left on screen: "two groups are right" stops being true
          the moment a term moves, and stale information shown as current is worse than
          none. The count survives in the header as history instead. */}
      {oneShotNotice !== null && (
        <div className={styles.pauseOverlay}>
          <div className={styles.pauseCard} onClick={e => e.stopPropagation()}>
            <p className={styles.pauseHeading}>{oneShotResultTitle(oneShotNotice)}</p>
            <p className={styles.oneShotExplain}>
              {ONE_SHOT_RESULT[oneShotNotice]}
              <br /><br />
              {ONE_SHOT_RESULT_FOOTER}
            </p>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnPrimary}`}
              onClick={() => setOneShotNotice(null)}
            >
              {ONE_SHOT_RESULT_DISMISS}
            </button>
          </div>
        </div>
      )}

      {confirmOneShot && (
        <div className={styles.pauseOverlay} onClick={() => setConfirmOneShot(false)}>
          <div className={styles.pauseCard} onClick={e => e.stopPropagation()}>
            <p className={styles.pauseHeading}>{ONE_SHOT_CONFIRM.title}</p>
            <p className={styles.oneShotExplain}>
              {ONE_SHOT_CONFIRM.body.map((para, i) => (
                <span key={i}>
                  {para}
                  {i < ONE_SHOT_CONFIRM.body.length - 1 && <><br /><br /></>}
                </span>
              ))}
            </p>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnPrimary}`}
              onClick={() => { rememberOneShotWarning(); runOneShot() }}
            >
              {ONE_SHOT_CONFIRM.confirm}
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={() => setConfirmOneShot(false)}
            >
              {ONE_SHOT_CONFIRM.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Pause overlay — click backdrop to resume */}
      {paused && (
        <div className={styles.pauseOverlay} onClick={() => setPaused(false)}>
          <div className={styles.pauseCard} onClick={e => e.stopPropagation()}>
            <p className={styles.pauseHeading}>{testMode ? 'Test paused' : 'Paused'}</p>
            <p className={styles.pauseSub}>{puzzle.title || 'Untitled'}</p>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnPrimary}`}
              onClick={() => setPaused(false)}
            >
              Resume
            </button>
            {testMode ? (
              <button
                className={`${styles.pauseBtn} ${styles.pauseBtnQuit}`}
                onClick={handleQuit}
              >
                Back to editing
              </button>
            ) : (
            <><button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={handleHowTo}
            >
              How To Play
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={handleSettings}
            >
              Settings
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnSecondary}`}
              onClick={handleSelectGame}
            >
              Select Game
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.pauseBtnQuit}`}
              onClick={handleQuit}
            >
              Quit Game
            </button></>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

// Remembered across games so the explanation appears once, not every time. A lost
// preference only costs one extra prompt, so failures here are ignored.
const WARNING_KEY = 'vennit_oneshot_seen'
const HINT_KEY    = 'vennit_oneshot_hint_seen'

function hasSeenOneShotWarning() {
  try { return localStorage.getItem(WARNING_KEY) === '1' } catch { return false }
}

function rememberOneShotWarning() {
  try { localStorage.setItem(WARNING_KEY, '1') } catch { /* ignore */ }
}

// Tracked separately from the confirmation: someone may well see the hint and never
// press the button, and should not be shown the hint again either way.
function hasSeenOneShotHint() {
  try { return localStorage.getItem(HINT_KEY) === '1' } catch { return false }
}

function rememberOneShotHint() {
  try { localStorage.setItem(HINT_KEY, '1') } catch { /* ignore */ }
}
