import { REGION_KEYS } from '../utils/puzzleUtils.js'
import styles from './VennDiagram.module.css'

const VB_W = 320
const VB_H = 380

const CIRCLES = [
  { id: '1', cx: 160, cy: 115, r: 97, color: '#ff6b6b' },
  { id: '2', cx: 105, cy: 235, r: 97, color: '#51cf66' },
  { id: '3', cx: 215, cy: 235, r: 97, color: '#339af0' },
]

const CENTROIDS = {
  '1':   { cx: 160, cy: 55  },
  '2':   { cx: 55,  cy: 255 },
  '3':   { cx: 265, cy: 255 },
  '12':  { cx: 120, cy: 175 },
  '13':  { cx: 200, cy: 175 },
  '23':  { cx: 160, cy: 270 },
  '123': { cx: 160, cy: 195 },
}

// Lens-shaped overlaps: label renders outside the circles with a leader line
const CALLOUT_REGIONS = new Set(['12', '13', '23'])

// Dead-space anchor point for each callout label pill
const CALLOUT_ANCHORS = {
  '12': { cx: 30,  cy: 133 },
  '13': { cx: 290, cy: 133 },
  '23': { cx: 160, cy: 352 },
}

// Highlight colors
const COL_SOURCE    = '#fcc419'              // yellow  — the selected term
const COL_SOURCE_BG = '#fff9db'              // solid pale yellow — covers leader line
const COL_TARGET    = '#6c5ce7'              // purple  — available drop targets
const COL_TARGET_BG = '#f3f0ff'              // solid pale lavender — covers leader line

// Hit-test a label pill (70px wide, 24/36px tall) centered at (cx,cy), plus touch margin
function hitsPill(x, y, cx, cy, label, margin = 5) {
  const halfW = 35 + margin
  const halfH = (label.split(' ').length > 1 ? 18 : 12) + margin
  return Math.abs(x - cx) <= halfW && Math.abs(y - cy) <= halfH
}

export default function VennDiagram({
  puzzle,
  placements,
  selectedTermId,
  revealedCircles,
  validTargets = [],
  onRegionClick,
  debugMode = false,
}) {
  const revealMap = Object.fromEntries(revealedCircles.map(r => [r.circleId, r]))

  // Which region currently holds the selected term (null = term is still in bank)
  const selectedRegionKey = selectedTermId
    ? REGION_KEYS.find(k => placements[k] === selectedTermId) ?? null
    : null

  function handleClick(e) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    // preserveAspectRatio="none": viewBox maps linearly — separate x/y scales, no centering offset
    const scaleX = rect.width  / VB_W
    const scaleY = rect.height / VB_H
    const x = (e.clientX - rect.left) / scaleX
    const y = (e.clientY - rect.top)  / scaleY

    // 1. Inline placed regions — pill sits at centroid
    for (const k of REGION_KEYS) {
      if (placements[k] == null || CALLOUT_REGIONS.has(k)) continue
      const term = puzzle.terms.find(t => t.id === placements[k])
      const { cx, cy } = CENTROIDS[k]
      if (hitsPill(x, y, cx, cy, term.label)) {
        onRegionClick(k)
        return
      }
    }

    // 2. Callout placed regions — anchor dot OR label pill at dead-space anchor
    for (const k of ['12', '13', '23']) {
      if (placements[k] == null) continue
      const term = puzzle.terms.find(t => t.id === placements[k])
      const { cx, cy } = CENTROIDS[k]
      const { cx: ax, cy: ay } = CALLOUT_ANCHORS[k]
      if (Math.hypot(x - cx, y - cy) <= 8 || hitsPill(x, y, ax, ay, term.label)) {
        onRegionClick(k)
        return
      }
    }

    // 3. Empty callout anchor zones — allow placement by clicking dead-space area
    for (const k of ['12', '13', '23']) {
      if (placements[k] != null) continue
      const { cx: ax, cy: ay } = CALLOUT_ANCHORS[k]
      if (Math.abs(x - ax) <= 35 && Math.abs(y - ay) <= 18) {
        onRegionClick(k)
        return
      }
    }

    // 4. Geometric hit-test — which circles contain the click point
    const inside = CIRCLES.filter(c => Math.hypot(x - c.cx, y - c.cy) <= c.r)
    const regionKey = inside.length === 0 ? null : inside.map(c => c.id).join('')
    onRegionClick(regionKey)
  }

  return (
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
            fill={revealMap[c.id] ? c.color : '#adb5bd'}
            fillOpacity={0.38}
            stroke="none"
            style={{ mixBlendMode: 'multiply' }}
          />
        ))}
      </g>

      {/* ── Always-colored circle outlines (outside blend group) ── */}
      {CIRCLES.map(c => (
        <circle
          key={`stroke-${c.id}`}
          cx={c.cx} cy={c.cy} r={c.r}
          fill="none"
          stroke={c.color}
          strokeWidth={2}
        />
      ))}

      {/* ── Region content ── */}
      {REGION_KEYS.map(regionKey => {
        const { cx, cy } = CENTROIDS[regionKey]
        const termId    = placements[regionKey]
        const term      = termId ? puzzle.terms.find(t => t.id === termId) : null
        const isSource  = selectedTermId != null && regionKey === selectedRegionKey
        const isTarget  = selectedTermId != null && !isSource && validTargets.includes(regionKey)
        const isCallout = CALLOUT_REGIONS.has(regionKey)

        // Dot / line color for callout regions
        const accentColor = isSource ? COL_SOURCE : (isTarget && term) ? COL_TARGET : null

        return (
          <g key={regionKey}>
            {/* Placement hint ring — empty valid target region while a term is selected */}
            {selectedTermId && !term && validTargets.includes(regionKey) && (
              <circle
                cx={cx} cy={cy} r={22}
                fill={COL_TARGET_BG}
                stroke={COL_TARGET}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
            )}

            {isCallout ? (
              term ? (
                <>
                  <line
                    x1={cx} y1={cy}
                    x2={CALLOUT_ANCHORS[regionKey].cx}
                    y2={CALLOUT_ANCHORS[regionKey].cy}
                    stroke={accentColor ?? '#bbb'}
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={cx} cy={cy} r={4}
                    fill={accentColor ?? '#888'}
                  />
                  <TermLabel
                    cx={CALLOUT_ANCHORS[regionKey].cx}
                    cy={CALLOUT_ANCHORS[regionKey].cy}
                    label={term.label}
                    isSource={isSource}
                    isTarget={isTarget}
                  />
                </>
              ) : (
                <circle cx={cx} cy={cy} r={3} fill="#bbb" opacity={0.6} />
              )
            ) : (
              term
                ? <TermLabel cx={cx} cy={cy} label={term.label} isSource={isSource} isTarget={isTarget} />
                : <circle cx={cx} cy={cy} r={3} fill="#bbb" opacity={0.6} />
            )}

            {debugMode && (
              <>
                <circle cx={cx} cy={cy} r={7}
                  fill="rgba(220,0,0,0.35)" stroke="red" strokeWidth={1} />
                <text x={cx} y={cy - 10}
                  textAnchor="middle" fontSize={8} fill="red" fontWeight="700">
                  {regionKey}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function TermLabel({ cx, cy, label, isSource, isTarget }) {
  const words   = label.split(' ')
  const twoLine = words.length > 1
  const bgW     = 70
  const bgH     = twoLine ? 36 : 24

  const borderColor = isSource ? COL_SOURCE : isTarget ? COL_TARGET : '#ccc'
  const fillColor   = isSource ? COL_SOURCE_BG : isTarget ? COL_TARGET_BG : 'rgba(255,255,255,0.92)'
  const textColor   = isSource ? '#7d5a00' : isTarget ? COL_TARGET : '#1a1a1a'
  const strokeWidth = (isSource || isTarget) ? 2 : 1

  return (
    <g>
      <rect
        x={cx - bgW / 2} y={cy - bgH / 2}
        width={bgW} height={bgH}
        rx={bgH / 2}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={strokeWidth}
      />
      {twoLine ? (
        <>
          <text x={cx} y={cy - 6}
            textAnchor="middle" fontSize={10.5}
            fontFamily="system-ui, sans-serif" fontWeight={600}
            fill={textColor}>
            {words[0]}
          </text>
          <text x={cx} y={cy + 8}
            textAnchor="middle" fontSize={10.5}
            fontFamily="system-ui, sans-serif" fontWeight={600}
            fill={textColor}>
            {words.slice(1).join(' ')}
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 4}
          textAnchor="middle" fontSize={11}
          fontFamily="system-ui, sans-serif" fontWeight={600}
          fill={textColor}>
          {label}
        </text>
      )}
    </g>
  )
}
