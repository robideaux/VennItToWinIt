// Colour belongs to a CATEGORY, not a circle (Phase 20). Category A is always colour 1,
// B colour 2, C colour 3, wherever that category happens to land on the board — so it is
// the same for every player, and the share block can use colour again.
//
// Unsolved circles are neutral. A circle only takes a colour when its category is solved.
//
// Red / green / violet, chosen by simulation rather than by eye: each colour-vision type
// (Machado 2009 matrices — the model Chrome's emulator uses) scored by the CIEDE2000
// distance of every pair, and the palette picked to maximise the WORST pair across all of
// them. Worst pair per mode, ΔE (about 10 is hard to tell apart, 20+ comfortable):
//
//              normal  protan  deutan  tritan  achromat
//   this         34      20      27      49      17
//   #df4962 red  39      36      21      50      21    (search pick; weaker on deutan)
//   red/lime/blue  47    31      12      29      13    (trial 2)
//   original       47    21       4      13       2    (#ff6b6b / #51cf66 / #339af0)
//
// Deuteranopia (red vs green) is the unavoidable weak spot of any palette containing both,
// so the two are pushed apart in LIGHTNESS: a light green against a deep raspberry-pink
// red (the user's pick, leaning toward purple — best on deutan, a little weaker on red
// against violet).
// Violet replaced blue because tritan vision collapsed green and blue. It works here only
// because it is dark: to red-green-blind players it reads as blue, and it is kept well
// away from the red in lightness for achromatopsia.
//
// TRIAL 3 (2026-09-30), after red / yellow / blue and red / lime / blue.
//
// Keep CATEGORY_EMOJI describing the same three colours: the share row can only use the
// fixed emoji set 🔴🟠🟡🟢🔵🟣🟤⚫⚪.
//
// `ink` is text laid ON the colour (a solved chip in dark mode fills with it). The green is
// light enough that it needs dark text.
export const CATEGORY_COLORS = {
  A: { bold: '#d6336c', ink: '#ffffff' },
  B: { bold: '#70df20', ink: '#1a1a1a' },
  C: { bold: '#501bbb', ink: '#ffffff' },
}

export const CATEGORY_EMOJI = { A: '🔴', B: '🟢', C: '🟣' }

// Unsolved circles and chips. The stroke follows the theme.
export const NEUTRAL_FILL   = '#adb5bd'
export const NEUTRAL_STROKE = 'var(--color-border-strong)'

// The category colour for a revealed circle, or neutral.
export const categoryColor = category =>
  category ? CATEGORY_COLORS[category].bold : null

export const categoryInk = category =>
  category ? CATEGORY_COLORS[category].ink : null

export const COL_SOURCE    = '#fcc419'
export const COL_SOURCE_BG = '#fff9db'
export const COL_TARGET    = '#6c5ce7'
export const COL_TARGET_BG = '#f3f0ff'
