// Conversion between a puzzle and the shape the editor works in.
//
// The editor thinks in fixed slots — one per category region — because that is what the
// diagram shows: seven positions, each holding exactly one term. A puzzle stores a list
// instead, so these two functions are the only place that translation happens.
//
// Working in fixed slots is also what makes `invalid` puzzles impossible to author:
// duplicate or unknown region keys cannot arise when the keys are the structure.

import { CATEGORY_REGION_KEYS, CATEGORY_KEYS, MIN_ATTEMPTS } from './validatePuzzle.js'

export const DEFAULT_ATTEMPTS = 5

// Term ids follow t1..t7 in region order, matching the curated library's puzzles.
const termId = regionKey => `t${CATEGORY_REGION_KEYS.indexOf(regionKey) + 1}`

export function blankDraft() {
  return {
    title: '',
    maxAttempts: DEFAULT_ATTEMPTS,
    categories: Object.fromEntries(CATEGORY_KEYS.map(k => [k, ''])),
    terms: Object.fromEntries(CATEGORY_REGION_KEYS.map(k => [k, ''])),
  }
}

// Puzzle -> editor slots. Missing terms become empty slots rather than disappearing, so a
// half-finished puzzle reopens with its gaps visible and in the right places.
export function toDraft(puzzle) {
  const draft = blankDraft()
  if (!puzzle) return draft

  draft.title = String(puzzle.title ?? '')
  draft.maxAttempts = Number.isInteger(puzzle.maxAttempts) ? puzzle.maxAttempts : DEFAULT_ATTEMPTS

  for (const k of CATEGORY_KEYS) draft.categories[k] = String(puzzle.categories?.[k] ?? '')

  for (const term of puzzle.terms ?? []) {
    const key = [...(term.regions ?? [])].sort().join('')
    if (key in draft.terms) draft.terms[key] = String(term.label ?? '')
  }
  return draft
}

// Editor slots -> puzzle. Always emits all seven terms, empty labels included: the slots
// are the structure, and dropping the blank ones would make a draft look like a puzzle
// with missing regions rather than one with unfilled terms.
export function fromDraft(draft, base = {}) {
  return {
    ...base,
    title: draft.title.trim(),
    maxAttempts: draft.maxAttempts,
    categories: Object.fromEntries(CATEGORY_KEYS.map(k => [k, draft.categories[k].trim()])),
    terms: CATEGORY_REGION_KEYS.map(key => ({
      id: termId(key),
      label: draft.terms[key].trim(),
      regions: key.split(''),
    })),
  }
}

export const isBlankDraft = draft =>
  !draft.title.trim() &&
  CATEGORY_KEYS.every(k => !draft.categories[k].trim()) &&
  CATEGORY_REGION_KEYS.every(k => !draft.terms[k].trim())

export { MIN_ATTEMPTS }
