import { fitText, PILL_W, PILL_PAD, BASE_FONT } from '../utils/fitText.js'
import { pctX, pctY, UNIT_CSS, clampX } from '../utils/vennGeometry.js'
import styles from './TermPill.module.css'

// The one term pill used everywhere — game board, editor preview, shuffle and reveal
// animations. Sharing it is what keeps the editor's preview honest: a puzzle wraps and
// shrinks identically wherever it is drawn.
//
// Positioned by viewBox coordinates converted to percentages of .vennWrap. Exact because
// the diagram SVG uses preserveAspectRatio="none", so the viewBox maps linearly.

// Everything is expressed in viewBox units times --u (one viewBox unit as a CSS length,
// measured against whichever container axis is more constrained). Set here rather than in
// the stylesheet so the numbers stay derived from PILL_W / BASE_FONT and can't drift.
const PILL_VARS = {
  '--u':         UNIT_CSS,
  '--pill-w':    PILL_W,
  '--pill-h':    26,          // single-line pill height, matching the old renderer
  '--pill-pad':  PILL_PAD,    // must match the padding PILL_W was derived with
  '--pill-font': BASE_FONT,
}

export default function TermPill({
  label,
  x,
  y,
  isSource   = false,
  isTarget   = false,
  isInactive = false,
  animated   = false,
  onClick    = null,
  variant    = null,   // 'shuffleFrom' | 'shuffleTo' — animation chips, not board state
}) {
  const { lines, scale } = fitText(label)

  // Highlighting is shape and contrast, not hue (Phase 20): any hue sits near one of the
  // three category colours under some colour-vision type, and a pill can be on any of
  // them. The picked-up term inverts to a dark pill and lifts; valid targets get a dashed
  // edge; everything else dims. The opening shuffle's chips reuse the same two looks.
  const picked = isSource || variant === 'shuffleFrom'
  const target = isTarget || variant === 'shuffleTo'

  const borderColor =
    picked       ? 'var(--pick-border)'
    : target     ? 'var(--target-dash)'
    : isInactive ? '#bbb'
    : '#ccc'

  const background =
    picked       ? 'var(--pick-bg)'
    : isInactive ? '#dadde0'
    : 'rgba(255,255,255,0.92)'

  const color =
    picked       ? 'var(--pick-fg)'
    : isInactive ? '#999'
    : '#1a1a1a'

  // Targets get the heaviest edge: they are what you scan for once a term is picked up
  const borderWidth = target ? 3 : picked ? 2 : 1

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      className={[
        styles.pill,
        onClick  ? styles.interactive : '',
        animated ? styles.animated    : '',
        picked   ? styles.picked      : '',
      ].join(' ').trim()}
      style={{
        ...PILL_VARS,
        left: pctX(clampX(x, PILL_W)),   // kept fully inside the diagram box
        top:  pctY(y),
        borderColor,
        background,
        color,
        borderWidth,
        borderStyle: target ? 'dashed' : 'solid',
        '--fit-scale': scale,
      }}
    >
      {lines.map((line, i) => (
        <span key={i} className={styles.line}>{line}</span>
      ))}
    </Tag>
  )
}
