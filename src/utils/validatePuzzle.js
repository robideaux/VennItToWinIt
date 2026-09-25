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

// Two different limits, deliberately:
//
//   MAX_LABEL_CHARS  what the RENDERER can draw (from fitText). Validation uses this, so a
//                    puzzle arriving from a link is judged on whether it can be displayed.
//   MAX_TERM_CHARS   what the EDITOR lets you type. A product decision, set well below the
//                    renderer's ceiling so authored labels sit in comfortable territory.
//
// MAX_LABEL_CHARS is an AVERAGE-case figure: it assumes typical glyph widths and full use
// of all three lines. A single unbreakable word of wide glyphs blows past it — "MMMM..." at
// 40 characters is ~3x the width of one line and cannot be wrapped by fitText at all.
//
// What is actually guaranteed is weaker but sufficient: text never spills across the
// diagram. Anything fitText cannot lay out is broken by the pill's CSS overflow-wrap, so
// the failure mode is a taller pill rather than an overflow. Measured across every length
// up to the cap, worst case is four visual lines.
export { MAX_LABEL_CHARS }
export const MAX_TERM_CHARS = 40

// How close to the cap before the character counter appears.
export const COUNTER_WITHIN = 8

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

// Issues are per-field so the editor can point at what needs fixing, rather than only
// telling you how many problems there are. `field` is 'title', 'attempts',
// 'category:A' or 'term:AB'.
//
// `kind` matters because the two sorts of problem deserve opposite treatment. A MISSING
// field already looks missing — empty box, placeholder text — so marking it adds noise
// rather than information, and marking seven at once reads as an accusation. A CONFLICT is
// invisible: two fields both reading "a" look perfectly filled. That is what a flag is for.
const issue = (field, message, kind = 'missing') => ({ field, message, kind })

export function validatePuzzle(puzzle) {
  const issues = []
  const fail = reason => ({ status: 'invalid', issues: [...issues, issue(null, reason)] })

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
  if (!isStr(puzzle.title) || !puzzle.title.trim()) issues.push(issue('title', 'Needs a name'))
  else if (puzzle.title.trim().length > MAX_LABEL_CHARS) issues.push(issue('title', 'Name is too long', 'conflict'))

  const norm = v => String(v ?? '').trim().toLowerCase()

  // Duplicate names are not merely untidy: three groups called the same thing describe no
  // grouping at all, and two identical terms are indistinguishable on the board — the
  // player cannot tell which region either belongs to, and neither can the reveal.
  const countBy = values => values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map())

  const catNames = countBy(CATEGORY_KEYS.map(k => norm(puzzle.categories[k])).filter(Boolean))
  for (const key of CATEGORY_KEYS) {
    const name = puzzle.categories[key]
    if (!isStr(name) || !name.trim()) issues.push(issue(`category:${key}`, 'Needs a name'))
    else if (name.trim().length > MAX_LABEL_CHARS) issues.push(issue(`category:${key}`, 'Too long', 'conflict'))
    else if (catNames.get(norm(name)) > 1) issues.push(issue(`category:${key}`, 'Same as another group', 'conflict'))
  }

  const labels = countBy(puzzle.terms.map(t => norm(t.label)).filter(Boolean))
  for (const term of puzzle.terms) {
    const key = `term:${getCorrectRegionKey(term)}`
    if (!isStr(term.label) || !term.label.trim()) issues.push(issue(key, 'Needs a term'))
    else if (term.label.trim().length > MAX_LABEL_CHARS) issues.push(issue(key, 'Too long', 'conflict'))
    else if (labels.get(norm(term.label)) > 1) issues.push(issue(key, 'Same as another term', 'conflict'))
  }

  for (const key of CATEGORY_REGION_KEYS.filter(k => !seen.has(k))) {
    issues.push(issue(`term:${key}`, 'Needs a term'))
  }

  const attempts = puzzle.maxAttempts
  if (!Number.isInteger(attempts) || attempts < MIN_ATTEMPTS || attempts > MAX_ATTEMPTS) {
    issues.push(issue('attempts', `Must be ${MIN_ATTEMPTS}–${MAX_ATTEMPTS}`, 'conflict'))
  }

  return { status: issues.length ? 'incomplete' : 'complete', issues }
}

export const isPlayable = puzzle => validatePuzzle(puzzle).status === 'complete'

// Field key -> message, for marking inputs in the editor. Only conflicts by default:
// see the note on `issue` above for why missing fields are deliberately left unmarked.
export function issuesByField(puzzle, { include = ['conflict'] } = {}) {
  const map = new Map()
  for (const { field, message, kind } of validatePuzzle(puzzle).issues) {
    if (field && include.includes(kind) && !map.has(field)) map.set(field, message)
  }
  return map
}
