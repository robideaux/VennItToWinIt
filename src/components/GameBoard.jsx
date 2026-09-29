import { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import { ATTEMPTS } from '../utils/gameRules.js'
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

  useEffect(() => {
    if (game.phase === 'won')  onWin({ placements: game.placements, revealedCircles: game.revealedCircles, attemptsUsed: ATTEMPTS - game.attemptsLeft, submissions: game.submissions })
    if (game.phase === 'lost') onGameOver({ placements: game.placements, revealedCircles: game.revealedCircles, attemptsUsed: ATTEMPTS, submissions: game.submissions })
  }, [game.phase]) // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!game.lastOneShot || game.lastOneShot.won) return
    setOneShotNotice(game.lastOneShot.correctCount)
  }, [game.lastOneShot])

  function handleRegionClick(regionKey) {
    if (shuffle.step !== null) {
      shuffle.skip()
      return
    }
    if (regionKey === null) {
      if (game.selectedTermId) game.selectTerm(game.selectedTermId)
      return
    }
    if (game.selectedTermId) {
      game.placeTerm(regionKey)
    } else {
      const term = game.termInRegion(regionKey)
      if (term) game.selectTerm(term.id)
    }
  }

  function runOneShot() {
    setConfirmOneShot(false)
    const before = game.revealedCircles.length
    game.submitAll()
    void before
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
            attempt pips groups it with the other thing it costs. */}
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
        ) : game.lastOneShot && !game.lastOneShot.won ? (
          <span
            className={styles.oneShotRecord}
            title={`One Shot said ${game.lastOneShot.correctCount} of 3 were correct`}
          >
            ↯{game.lastOneShot.correctCount}
          </span>
        ) : null}
        <div
          className={styles.pips}
          aria-label={`${game.attemptsLeft} of ${ATTEMPTS} attempts remaining`}
        >
          {Array.from({ length: ATTEMPTS }, (_, i) => (
            <span
              key={i}
              className={`${styles.pip} ${i < game.attemptsLeft ? styles.pipActive : ''}`}
            />
          ))}
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.vennWrap}>
          <CircleLabel
            circleId="1"
            revealedCircles={game.revealedCircles}
            onSubmit={game.submitCircle}
            canSubmit={game.isCircleFilled('1')}
          />
          <CircleLabel
            circleId="2"
            revealedCircles={game.revealedCircles}
            onSubmit={game.submitCircle}
            canSubmit={game.isCircleFilled('2')}
          />
          <CircleLabel
            circleId="3"
            revealedCircles={game.revealedCircles}
            onSubmit={game.submitCircle}
            canSubmit={game.isCircleFilled('3')}
          />
          <VennDiagram
            revealedCircles={game.revealedCircles}
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
