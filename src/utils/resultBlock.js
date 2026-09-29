// The shareable result block.
//
// Two facts are worth sharing, and only two are honestly knowable:
//
//   the ATTEMPT SEQUENCE   what happened, in order. A failed submit cannot be attributed
//                          to any group — it matched no category's term set, so there is
//                          no group it was "an attempt at". Only successes name a group.
//   the FINAL LAYOUT       which group ended up in which circle on your board.
//
// Groups are numbered by the puzzle's own A/B/C order, which is identical for every
// player. Circle colour is not: the game is permutation-aware, so your red holds a
// different category from mine, and "3 tries on red" would mean nothing to you.
//
// Nothing here can spoil the puzzle. Knowing group 2 fell first, or sat bottom-left, says
// nothing about what group 2 IS — and every arrangement is equally valid, so someone
// else's layout is no hint toward the answer.

import { CATEGORY_KEYS } from './validatePuzzle.js'
import { ATTEMPTS } from './gameRules.js'

// All text-class glyphs, deliberately. ⚡ (U+26A1) is emoji-class and renders larger and
// coloured than the rest, which made the row look ragged; ↯ (U+21AF) sits at the same
// weight as ✗ and ①②③.
const CIRCLED = ['①', '②', '③']
const MISS    = '✗'
const ONE_SHOT = '↯'
const SUPER   = ['⁰', '¹', '²', '³']
const UNSOLVED = '·'

// Non-breaking, because several chat apps strip ordinary leading whitespace and would
// collapse the triangle into a straight line.
const PAD = ' '

const groupNumber = category => CATEGORY_KEYS.indexOf(category) + 1

// "↯²✗①②③" — the run of attempts in the order they were made.
export function attemptRow(submissions) {
  return submissions.map(s => {
    if (s.type === 'oneShot') {
      // A winning One Shot needs no count: three correct is implied by having won.
      return s.correctCount === 3 ? ONE_SHOT : ONE_SHOT + SUPER[s.correctCount]
    }
    return s.correct ? CIRCLED[groupNumber(s.category) - 1] : MISS
  }).join('')
}

//   ③
// ① ②
// Circle 1 is always the top one, 2 bottom-left, 3 bottom-right — fixed positions with
// fixed colours — so the layout carries the board's colour implicitly, without needing
// coloured glyphs that would clash with the normalised numbering.
export function layoutRows(revealedCircles) {
  const byCircle = Object.fromEntries(
    revealedCircles.map(r => [r.circleId, CIRCLED[groupNumber(r.category) - 1]])
  )
  const at = id => byCircle[id] ?? UNSOLVED   // never solved: shown, but not credited
  return [`${PAD}${at('1')}`, `${at('2')}${PAD}${at('3')}`]
}

// Attempts lead; the layout closes.
export function buildResultBlock({ title, submissions, revealedCircles, won }) {
  const used = submissions.length
  const outcome = won
    ? used === 1 ? 'Solved in 1' : `Solved in ${used}`
    : 'Out of attempts'

  return [
    `Venn It To Win It — ${title}`,
    attemptRow(submissions),
    ...layoutRows(revealedCircles),
    outcome,
  ].join('\n')
}

export { ATTEMPTS }
