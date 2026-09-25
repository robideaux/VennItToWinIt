// Puzzle validation, shared by the editor, the selector and share-link import.
//
// Returns a STATUS, not a boolean, because "not playable" and "broken" are different
// things and deserve opposite treatment:
//
//   complete    every region filled, 3 categories, title set  -> playable
//   incomplete  right shape, content missing or empty         -> editable, not playable
//   invalid     structurally broken, cannot be read           -> not loadable
//
// The distinction exists to protect drafts. Someone who fills in four of seven terms and
// closes the editor has an `incomplete` puzzle, not a corrupt one, and discarding their
// work would be the worst thing this code could do. `invalid` is genuine corruption and
// the editor cannot produce it — one input per region means duplicate or unknown region
// keys are impossible by construction, so it only arises from hand-edited storage or a
// malformed share link.

import { getCorrectRegionKey } from './puzzleUtils.js'
import { MAX_LABEL_CHARS } from './fitText.js'

export const CATEGORY_KEYS = ['A', 'B', 'C']

// The 7 region keys a PUZZLE uses — combinations of the category letters A/B/C.
// Deliberately not REGION_KEYS from puzzleUtils: those are physical circle numbers
// ('1', '12', '123') assigned at play time. A puzzle defines grouping relationships,
// not circle assignments, which is what makes the permutation-aware win check possible.
export const CATEGORY_REGION_KEYS = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']

// Attempts a puzzle may allow. 3 is a hard floor rather than a preference: each submit
// reveals at most one circle, so fewer than 3 attempts is literally unwinnable.
export const MIN_ATTEMPTS = 3
export const MAX_ATTEMPTS = 10

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const isStr = v => typeof v === 'string'

export function validatePuzzle(puzzle) {
  const issues = []
  const fail = reason => ({ status: 'invalid', issues: [...issues, reason] })

  // ── Structural checks: anything here means the record cannot be read at all ──
  // Note: `id` is deliberately NOT checked here. Identity belongs to the store, which
  // mints ids on save and import — a puzzle arriving from a share link legitimately has
  // none yet, and a brand-new one in the editor could never be saved if this demanded it.
  if (!isObj(puzzle))               return fail('Not a puzzle object')
  if (!isObj(puzzle.categories))    return fail('Missing categories')
  if (!Array.isArray(puzzle.terms)) return fail('Terms is not a list')
  if (puzzle.terms.length > CATEGORY_REGION_KEYS.length) {
    return fail(`Too many terms (${puzzle.terms.length}, max ${CATEGORY_REGION_KEYS.length})`)
  }

  const seen = new Set()
  for (const term of puzzle.terms) {
    if (!isObj(term))              return fail('A term is not an object')
    if (!Array.isArray(term.regions) || term.regions.length === 0) {
      return fail('A term has no regions')
    }
    if (term.regions.some(r => !CATEGORY_KEYS.includes(r))) {
      return fail('A term has an unknown region')
    }
    const key = getCorrectRegionKey(term)
    if (seen.has(key)) return fail(`Two terms share region "${key}"`)
    seen.add(key)
  }

  // ── Content checks: shape is sound, so anything missing is just unfinished ──
  if (!isStr(puzzle.title) || !puzzle.title.trim()) issues.push('No title')

  for (const key of CATEGORY_KEYS) {
    const name = puzzle.categories[key]
    if (!isStr(name) || !name.trim()) issues.push(`Category ${key} is empty`)
    else if (name.trim().length > MAX_LABEL_CHARS) issues.push(`Category ${key} is too long`)
  }

  for (const term of puzzle.terms) {
    if (!isStr(term.label) || !term.label.trim()) {
      issues.push(`Term in region "${getCorrectRegionKey(term)}" is empty`)
    } else if (term.label.trim().length > MAX_LABEL_CHARS) {
      issues.push(`Term "${term.label.slice(0, 20)}…" is too long`)
    }
  }

  const missing = CATEGORY_REGION_KEYS.filter(k => !seen.has(k))
  if (missing.length) issues.push(`${missing.length} region(s) still empty`)

  const attempts = puzzle.maxAttempts
  if (!Number.isInteger(attempts) || attempts < MIN_ATTEMPTS || attempts > MAX_ATTEMPTS) {
    issues.push(`Attempts must be ${MIN_ATTEMPTS}–${MAX_ATTEMPTS}`)
  }

  return { status: issues.length ? 'incomplete' : 'complete', issues }
}

export const isPlayable = puzzle => validatePuzzle(puzzle).status === 'complete'
