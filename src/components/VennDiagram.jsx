import { REGION_KEYS } from '../utils/puzzleUtils.js'
import { VB_W, VB_H, CIRCLES, CENTROIDS } from '../utils/vennGeometry.js'
import { CIRCLE_COLORS } from '../styles/colors.js'
import styles from './VennDiagram.module.css'

// Geometry-only diagram shell: the three circles, and a hit-test for clicks that land
// on bare diagram rather than on an overlay element.
//
// Everything term-related lives in the overlay passed as children — PlayOverlay for the
// game, EditOverlay for the puzzle editor. Both consume the same coordinates from
// vennGeometry.js, so the two modes can't drift apart.
//
// Rendered as a fragment, not a wrapper: the SVG and the overlay are siblings inside
// .vennWrap (position:relative), which is what makes the overlay's percentage
// coordinates line up with the SVG's viewBox.
export default function VennDiagram({
  revealedCircles = [],
  onRegionClick,
  debugMode = false,
  children,
}) {
  const revealMap = Object.fromEntries(revealedCircles.map(r => [r.circleId, r]))

  // Which circles contain the click point. Overlay elements handle their own clicks and
  // stop here; this only ever sees clicks on bare diagram, so the four-layer pill hit-test
  // the SVG renderer needed is gone.
  function handleClick(e) {
    if (!onRegionClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    // preserveAspectRatio="none": viewBox maps linearly — separate x/y scales, no offset
    const x = (e.clientX - rect.left) / (rect.width  / VB_W)
    const y = (e.clientY - rect.top)  / (rect.height / VB_H)

    const inside = CIRCLES.filter(c => Math.hypot(x - c.cx, y - c.cy) <= c.r)
    onRegionClick(inside.length === 0 ? null : inside.map(c => c.id).join(''))
  }

  return (
    <>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        overflow="visible"
        onClick={handleClick}
      >
        {/* ── Visual circles (fill + blend) ── */}
        <g style={{ isolation: 'isolate' }}>
          {CIRCLES.map(c => (
            <circle
              key={c.id}
              cx={c.cx} cy={c.cy} r={c.r}
              fill={revealMap[c.id] ? CIRCLE_COLORS[c.id].bold : '#adb5bd'}
              fillOpacity={0.38}
              stroke="none"
              style={{ mixBlendMode: 'multiply' }}
            />
          ))}
        </g>

        {/* ── Circle outlines ── */}
        {CIRCLES.map(c => (
          <circle
            key={`stroke-${c.id}`}
            cx={c.cx} cy={c.cy} r={c.r}
            fill="none"
            stroke={CIRCLE_COLORS[c.id].bold}
            strokeWidth={2}
          />
        ))}

        {debugMode && REGION_KEYS.map(regionKey => {
          const { cx, cy } = CENTROIDS[regionKey]
          return (
            <g key={`debug-${regionKey}`}>
              <circle cx={cx} cy={cy} r={7}
                fill="rgba(220,0,0,0.35)" stroke="red" strokeWidth={1} />
              <text x={cx} y={cy - 10}
                textAnchor="middle" fontSize={8} fill="red" fontWeight="700">
                {regionKey}
              </text>
            </g>
          )
        })}
      </svg>

      {children}
    </>
  )
}
