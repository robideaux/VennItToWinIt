import { fitText, PILL_W, PILL_PAD, BASE_FONT } from '../utils/fitText.js'
import { pctX, pctY, UNIT_CSS, clampX } from '../utils/vennGeometry.js'
import { COL_SOURCE, COL_SOURCE_BG, COL_TARGET, COL_TARGET_BG } from '../styles/colors.js'
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

  // Colors carried over verbatim from the previous SVG renderer so the conversion
  // changes layout only, never palette.
  const shuffleFrom = variant === 'shuffleFrom'
  const shuffleTo   = variant === 'shuffleTo'

  const borderColor =
    isSource || shuffleFrom ? COL_SOURCE
    : isTarget || shuffleTo ? COL_TARGET
    : isInactive            ? '#bbb'
    : '#ccc'

  const background =
    isSource || shuffleFrom ? COL_SOURCE_BG
    : isTarget || shuffleTo ? COL_TARGET_BG
    : isInactive            ? '#dadde0'
    : 'rgba(255,255,255,0.92)'

  const color =
    isSource || shuffleFrom ? '#7d5a00'
    : isTarget || shuffleTo ? COL_TARGET
    : isInactive            ? '#999'
    : '#1a1a1a'

  const borderWidth = (isSource || isTarget || variant) ? 2 : 1

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      className={[
        styles.pill,
        onClick  ? styles.interactive : '',
        animated ? styles.animated    : '',
      ].join(' ').trim()}
      style={{
        ...PILL_VARS,
        left: pctX(clampX(x, PILL_W)),   // kept fully inside the diagram box
        top:  pctY(y),
        borderColor,
        background,
        color,
        borderWidth,
        '--fit-scale': scale,
      }}
    >
      {lines.map((line, i) => (
        <span key={i} className={styles.line}>{line}</span>
      ))}
    </Tag>
  )
}
