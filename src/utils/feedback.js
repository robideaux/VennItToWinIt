// Visual feedback for moves and submits (Phase 9). Timings live here so they can be tuned
// in one place, and the decisions are pure functions so they can be tested without a browser.

// Swapping two terms on a drop. Slow enough to see: the opening shuffle's 0.2s slide is not.
export const SWAP_MS = 420

// A submit is a beat, not an instant: the circle dims while it is "checked", then the
// result lands — colour fades up if it was right, the grey returns if not, a miss pip
// pops, and the haptic fires. Everything below is held back until that moment.
export const SUBMIT_DIM_MS = 350

// After the last submit resolves, hold the board before moving to the results screen, so
// the final colour or the lost pip is actually seen.
export const RESULTS_HOLD_MS = 800

export const prefersReducedMotion = () => {
  try { return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true } catch { return false }
}

// Which two terms trade places when `selectedId` is dropped on `targetKey`, or null when
// nothing visibly moves (dropping a term where it already is, or onto an empty region).
// The game state commits the move at once; this only describes what to animate.
export function swapFor(placements, selectedId, targetKey) {
  if (!selectedId) return null
  const fromKey = Object.keys(placements).find(k => placements[k] === selectedId)
  const displacedId = placements[targetKey]
  if (!fromKey || fromKey === targetKey || !displacedId) return null
  return { fromKey, toKey: targetKey, movedId: selectedId, displacedId }
}

const ALL_CIRCLES = ['1', '2', '3']

// What the board should SHOW while the latest submit is still "being checked".
//
// The game state is updated the instant a submit happens; the view lags it by one beat.
// `resolved` is how many submissions the view has caught up with. While one is outstanding:
//   - the circles it concerns are dim, and are shown as unsolved even if it solved them
//     (a circle submit concerns one circle, a One Shot all three)
//   - a miss has not yet cost its pip
// Derived in render rather than set from an effect, so there is no frame in which the
// answer shows early.
export function feedbackView({ submissions, resolved, revealedCircles, missesLeft, isMiss }) {
  const pending = submissions.length > resolved
  const last = pending ? submissions[submissions.length - 1] : null
  const pulseIds = !last ? [] : last.type === 'circle' ? [last.circleId] : ALL_CIRCLES
  return {
    pending,
    pulseIds,
    shownRevealed: revealedCircles.filter(r => !pulseIds.includes(r.circleId)),
    shownMisses: missesLeft + (last && isMiss(last) ? 1 : 0),
  }
}
