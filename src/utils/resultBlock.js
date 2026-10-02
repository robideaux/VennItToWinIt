// The shareable result block.
//
// One row: what happened, in order.
//
// A solved group is its category's colour. Colour belongs to the category, not the circle
// (Phase 20), so red is the same group for every player — which is what lets the row use
// colour again after Phase 18 had to fall back to ①②③.
//
// A failed submit cannot be attributed to any group — it matched no category's term set,
// so there is no group it was "an attempt at". Only successes name a group.
//
// A triangular layout of where each group landed was tried and dropped: centring built
// from ambiguous-width glyphs fell apart once pasted into a chat app. A row that always
// reads correctly beats a shape that sometimes does.
//
// Nothing here can spoil the puzzle. Knowing the green group fell first says nothing
// about what the green group IS.

import { CATEGORY_EMOJI } from '../styles/colors.js'
import { isMiss } from './gameRules.js'

// The marks for "nothing gained" are text-class on purpose, so they recede next to the
// colour emoji that carry what you achieved. A One Shot hit is the one coloured bolt.
const MISS          = '✗'
const ONE_SHOT_MISS = '↯'
const ONE_SHOT_HIT  = '⚡'

// "↯🔴✗🟢🔵" — the run of submits in the order they were made.
//
// The One Shot mark carries no count. What it told you shaped how you played, but as a
// number in someone else's block it is noise: it cannot be acted on and does not compare
// to anything.
export function attemptRow(submissions) {
  return submissions.map(s =>
    s.type === 'oneShot' ? (isMiss(s) ? ONE_SHOT_MISS : ONE_SHOT_HIT)
    : s.correct ? CATEGORY_EMOJI[s.category]
    : MISS
  ).join('')
}

export const missCount = submissions => submissions.filter(isMiss).length

export function outcomeLine(submissions, won) {
  if (!won) return 'Out of misses'
  if (submissions.length === 1 && submissions[0].type === 'oneShot') return 'Solved in one shot'
  const misses = missCount(submissions)
  return misses === 0 ? 'Solved with no misses'
    : `Solved with ${misses} miss${misses === 1 ? '' : 'es'}`
}

// `play` is which play of this puzzle the result came from. Replays are allowed, but a
// replayed score is marked as one, so nobody can pass off a replay as their first go.
// A first play carries no mark.
export function buildResultBlock({ title, submissions, won, play = 1 }) {
  const outcome = outcomeLine(submissions, won)
  return [
    `Venn It To Win It — ${title}`,
    attemptRow(submissions),
    play > 1 ? `${outcome} · play: ${play}` : outcome,
  ].join('\n')
}
