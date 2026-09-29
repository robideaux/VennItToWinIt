// The shareable result block.
//
// One row: what happened, in order.
//
// A failed submit cannot be attributed to any group — it matched no category's term set,
// so there is no group it was "an attempt at". Only successes name a group.
//
// A triangular layout of where each group landed was tried and dropped: the circled
// digits are East-Asian-Ambiguous width, so the centring that looked right locally fell
// apart once pasted into a chat app. A row that always reads correctly beats a shape that
// sometimes does.
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
const CIRCLED  = ['①', '②', '③']
const MISS     = '✗'
const ONE_SHOT = '↯'

const groupNumber = category => CATEGORY_KEYS.indexOf(category) + 1

// "↯✗①②③" — the run of attempts in the order they were made.
//
// The One Shot mark carries no count. What it told you shaped how you played, but as a
// number in someone else's block it is noise: it cannot be acted on and does not compare
// to anything.
export function attemptRow(submissions) {
  return submissions.map(s =>
    s.type === 'oneShot' ? ONE_SHOT
    : s.correct ? CIRCLED[groupNumber(s.category) - 1]
    : MISS
  ).join('')
}

export function buildResultBlock({ title, submissions, won }) {
  const used = submissions.length
  const outcome = won
    ? used === 1 ? 'Solved in 1' : `Solved in ${used}`
    : 'Out of attempts'

  return [
    `Venn It To Win It — ${title}`,
    attemptRow(submissions),
    outcome,
  ].join('\n')
}

export { ATTEMPTS }
