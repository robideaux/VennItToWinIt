// Single source of truth for Venn diagram geometry.
//
// These coordinates get tuned often (radii 85→97, viewBox 320→380, '23' anchor 352→340),
// so every consumer — the SVG shell, the play overlay, the editor overlay — imports them
// from here rather than holding its own copy. Pure geometry only: no colors, no React.
//
// The SVG uses preserveAspectRatio="none", so the viewBox maps linearly with independent
// x/y scales and no centering offset. That's what makes pctX/pctY below exact.

export const VB_W = 320
export const VB_H = 380

export const CIRCLES = [
  { id: '1', cx: 160, cy: 115, r: 97 },
  { id: '2', cx: 105, cy: 235, r: 97 },
  { id: '3', cx: 215, cy: 235, r: 97 },
]

export const CENTROIDS = {
  '1':   { cx: 160, cy: 70  },
  '2':   { cx: 55,  cy: 250 },
  '3':   { cx: 265, cy: 250 },
  '12':  { cx: 120, cy: 175 },
  '13':  { cx: 200, cy: 175 },
  '23':  { cx: 160, cy: 250 },
  '123': { cx: 160, cy: 195 },
}

// Lens-shaped overlaps: label renders outside the circles with a leader line
export const CALLOUT_REGIONS = new Set(['12', '13', '23'])

// Dead-space anchor point for each callout label pill
export const CALLOUT_ANCHORS = {
  '12': { cx: 38,  cy: 133 },
  '13': { cx: 282, cy: 133 },
  '23': { cx: 160, cy: 340 },
}

// Where a region's label actually renders — the callout anchor for lens regions,
// the centroid for everything else.
export function visualCenter(key) {
  return CALLOUT_REGIONS.has(key) ? CALLOUT_ANCHORS[key] : CENTROIDS[key]
}

// viewBox coordinate → percentage position inside .vennWrap, for HTML overlays
// layered on top of the SVG. Exact because preserveAspectRatio is "none".
export const pctX = cx => `${(cx / VB_W) * 100}%`
export const pctY = cy => `${(cy / VB_H) * 100}%`

// One viewBox unit as a CSS length, for sizing overlay elements.
//
// Positions can map to each axis independently (pctX/pctY above), but a *size* has to pick
// one scale or it distorts. Taking the smaller of the two axes is what keeps pills sensible
// in both orientations: portrait is width-constrained, landscape is height-constrained, and
// keying off width alone made landscape pills ~3x too big.
//
// Requires a `container-type: size` query container — that's .vennWrap (shared.module.css).
export const UNIT_CSS = `min(${100 / VB_W}cqw, ${100 / VB_H}cqh)`

// Keep a box of the given width centred on x without letting it leave the diagram.
//
// The '12' and '13' callout anchors sit at x=38 and x=282 of a 320-unit viewBox, so any
// pill wider than ~76 units hangs off the edge. Clamping here rather than in CSS keeps
// `left` a plain value: a clamp() built from var() computes to a pending-substitution
// value, which does not interpolate, and the shuffle chips would snap instead of slide.
//
// Worst case is portrait, where one viewBox unit maps to the width axis and the pill is
// exactly `width` units across. In landscape the unit comes from the shorter height axis,
// so the pill is narrower than this assumes and the clamp is merely conservative.
export function clampX(x, width) {
  const half = width / 2
  return Math.min(Math.max(x, half), VB_W - half)
}
