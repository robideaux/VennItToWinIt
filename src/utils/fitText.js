// Shared term-label fitting. Used by every pill everywhere — the game board, the editor,
// the editor's preview, the shuffle animation and the game-over reveal — so that a puzzle
// renders identically wherever it appears. If the editor fitted text differently from the
// game, the author's preview would lie about how their puzzle actually plays.
//
// Two jobs:
//   1. Balanced wrapping. The old renderer split on the FIRST space only, so
//      "Things that are Cold" became "Things" / "that are Cold". This minimises the
//      longest line instead: "Things that" / "are Cold".
//   2. Shrink-to-fit, so a long term still lands inside its pill.
//
// Both work off an estimated text WIDTH rather than a character count. Counting characters
// is what made long labels overflow: "Illinois" and "MMMMMMMM" are both 8 characters but
// differ by more than 2x in width, so any uniform per-character figure is wrong for most
// real strings. Widths are still estimated rather than measured in the DOM, which keeps
// this a pure function — testable outside a browser, and identical on every render.

export const BASE_FONT = 12    // viewBox units; matches the shipped renderer's 12px text
export const PILL_PAD  = 4.5   // horizontal padding inside the pill, per side, viewBox units
export const MIN_SCALE = 0.62  // below this, text stops being readable on a phone

// Upper bound on lines, not a target. fitText uses the FEWEST lines that avoid shrinking and
// only spends the extra ones on labels that would otherwise be shrunk to the floor — a very
// long term reads far better across three lines at 0.87 scale than two lines at 0.64.
// Verified that even a full-height three-line pill clears its neighbours: the closest pair of
// centroids is '1' and '123', 125 viewBox units apart, against a ~47-unit pill.
export const MAX_LINES = 3

// Nominal characters per line, used only to size the pill. Actual fitting uses real widths.
export const TARGET_CHARS = 13
export const AVG_CHAR_EM  = 0.56

// Pill width in viewBox units. The old SVG pill had no padding — text ran edge to edge — so
// deriving width from text alone silently spent part of it on the HTML pill's padding.
// Padding is part of the width, not a deduction from it. Rounded up, since rounding down
// would leave fractionally less room than intended.
export const PILL_W = Math.ceil(TARGET_CHARS * AVG_CHAR_EM * BASE_FONT + 2 * PILL_PAD)

// Usable text width on one line, in em at the base font size.
export const LINE_EM = (PILL_W - 2 * PILL_PAD) / BASE_FONT

// Total text width a label can have and still fit: both lines, at maximum shrink.
export const CAPACITY_EM = LINE_EM * MAX_LINES / MIN_SCALE

// Per-character advance widths in em, for a semibold system-ui / Segoe UI / Helvetica stack.
// Approximate, but far closer than a single average: the point is to distinguish "lll" from
// "MMM", not to match the font metrics exactly.
const NARROW = "ijlItf.,;:!|'\"`()[]{}/\\-"
const WIDE   = 'mwMW@'
const CHAR_EM = { ' ': 0.27 }
for (const c of NARROW) CHAR_EM[c] = 0.30
for (const c of WIDE)   CHAR_EM[c] = 0.88
for (const c of '0123456789') CHAR_EM[c] = 0.57

// Estimated rendered width of a string, in em at the base font size.
export function textWidthEm(text) {
  let w = 0
  for (const c of String(text)) {
    w += CHAR_EM[c] ?? (c >= 'A' && c <= 'Z' ? 0.67 : 0.55)
  }
  return w
}

// Greedy fill at a given max line width (em). A word wider than the budget gets its own
// line rather than being broken mid-word.
function greedyLines(words, budgetEm) {
  const lines = []
  let cur = ''
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w
    if (!cur || textWidthEm(candidate) <= budgetEm) {
      cur = candidate
    } else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// Smallest max-line-width that still fits within maxLines, found by binary search.
// Minimising the widest line is what makes the wrap look balanced.
export function wrapBalanced(text, maxLines = MAX_LINES, lineEm = LINE_EM) {
  // A label that already fits stays on one line. Without this the balancing runs
  // unconditionally and splits short labels that never needed it — "Let It Be"
  // became "Let" / "It Be", which reads as crowded even though there was room.
  if (textWidthEm(text) <= lineEm) return [text]

  const words = text.split(' ')
  if (words.length === 1) return [text]

  let lo = Math.max(...words.map(textWidthEm))
  let hi = textWidthEm(text)
  for (let i = 0; i < 40 && hi - lo > 1e-4; i++) {
    const mid = (lo + hi) / 2
    if (greedyLines(words, mid).length <= maxLines) hi = mid
    else lo = mid
  }
  return greedyLines(words, hi)
}

// label -> { lines, scale }. `scale` multiplies the pill's base font size.
export function fitText(label, opts = {}) {
  const {
    lineEm   = LINE_EM,
    minScale = MIN_SCALE,
    maxLines = MAX_LINES,
  } = opts

  const text = String(label ?? '').trim().replace(/\s+/g, ' ')
  if (!text) return { lines: [''], scale: 1 }

  // Try line counts in increasing order and stop at the first that needs no shrinking, so
  // extra lines are only ever spent on labels that would otherwise be shrunk. Compare the
  // RAW ratio rather than the clamped scale: two counts that both bottom out at the floor
  // would otherwise tie, and we'd keep the one that fits less of the text inside the pill.
  let best = null
  for (let n = 1; n <= maxLines; n++) {
    const lines = wrapBalanced(text, n, lineEm)
    const raw   = lineEm / Math.max(...lines.map(textWidthEm))
    if (!best || raw > best.raw) best = { lines, raw }
    if (raw >= 1) break
  }

  return { lines: best.lines, scale: Math.min(1, Math.max(minScale, best.raw)) }
}

// Longest label the editor should accept, in characters. The real limit is a width
// (CAPACITY_EM), but a character cap is what an input can enforce, so this converts using
// the average — a label of unusually wide characters can still exceed the width budget,
// which is why the pill also wraps rather than overflowing as a last resort.
export const MAX_LABEL_CHARS = Math.floor(CAPACITY_EM / AVG_CHAR_EM)
