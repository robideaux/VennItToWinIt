import { useState, useEffect } from 'react'
import { REGION_KEYS } from '../utils/puzzleUtils.js'
import { CIRCLE_COLORS, COL_SOURCE, COL_SOURCE_BG, COL_TARGET, COL_TARGET_BG } from '../styles/colors.js'
import styles from './VennDiagram.module.css'

const VB_W = 320
const VB_H = 380

const CIRCLES = [
  { id: '1', cx: 160, cy: 115, r: 97, ...CIRCLE_COLORS['1'] },
  { id: '2', cx: 105, cy: 235, r: 97, ...CIRCLE_COLORS['2'] },
  { id: '3', cx: 215, cy: 235, r: 97, ...CIRCLE_COLORS['3'] },
]

const CENTROIDS = {
  '1':   { cx: 160, cy: 70  },
  '2':   { cx: 55,  cy: 250 },
  '3':   { cx: 265, cy: 250 },
  '12':  { cx: 120, cy: 175 },
  '13':  { cx: 200, cy: 175 },
  '23':  { cx: 160, cy: 250 },
  '123': { cx: 160, cy: 195 },
}

// Lens-shaped overlaps: label renders outside the circles with a leader line
const CALLOUT_REGIONS = new Set(['12', '13', '23'])

// Dead-space anchor point for each callout label pill
const CALLOUT_ANCHORS = {
  '12': { cx: 38,  cy: 133 },
  '13': { cx: 282, cy: 133 },
  '23': { cx: 160, cy: 340 },
}

// Hit-test a label pill (74px wide, 26/38px tall) centered at (cx,cy), plus touch margin
function hitsPill(x, y, cx, cy, label, margin = 5) {
  const halfW = 37 + margin
  const halfH = (label.split(' ').length > 1 ? 19 : 13) + margin
  return Math.abs(x - cx) <= halfW && Math.abs(y - cy) <= halfH
}

export default function VennDiagram({
  puzzle,
  placements,
  selectedTermId,
  revealedCircles,
  validTargets = [],
  onRegionClick,
  shuffleStep = null,
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
            fill={revealMap[c.id] ? c.bold : '#adb5bd'}
            fillOpacity={0.38}
            stroke="none"
            style={{ mixBlendMode: 'multiply' }}
          />
        ))}
      </g>

      {/* ── Circle outlines — muted until revealed ── */}
      {CIRCLES.map(c => (
        <circle
          key={`stroke-${c.id}`}
          cx={c.cx} cy={c.cy} r={c.r}
          fill="none"
          stroke={revealMap[c.id] ? c.bold : c.muted}
          strokeWidth={2}
        />
      ))}

      {/* ── Region content ── */}
      {REGION_KEYS.map(regionKey => {
        const { cx, cy } = CENTROIDS[regionKey]
        const termId    = placements[regionKey]
        const term      = termId ? puzzle.terms.find(t => t.id === termId) : null
        const isSource   = selectedTermId != null && regionKey === selectedRegionKey
        const isTarget   = selectedTermId != null && !isSource && validTargets.includes(regionKey)
        const isInactive = selectedTermId != null && !isSource && !isTarget
        const isCallout  = CALLOUT_REGIONS.has(regionKey)

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
                    isInactive={isInactive}
                  />
                </>
              ) : (
                <circle cx={cx} cy={cy} r={3} fill="#bbb" opacity={0.6} />
              )
            ) : (
              term
                ? <TermLabel cx={cx} cy={cy} label={term.label} isSource={isSource} isTarget={isTarget} isInactive={isInactive} />
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
      {/* ── Shuffle animation overlay ── */}
      {shuffleStep && (() => {
        const fromTerm = puzzle.terms.find(t => t.id === placements[shuffleStep.fromKey])
        const toTerm   = puzzle.terms.find(t => t.id === placements[shuffleStep.toKey])
        return (
          <ShuffleOverlay
            step={shuffleStep}
            fromLabel={fromTerm?.label ?? ''}
            toLabel={toTerm?.label ?? ''}
          />
        )
      })()}
    </svg>
  )
}

function visualCenter(key) {
  return CALLOUT_REGIONS.has(key) ? CALLOUT_ANCHORS[key] : CENTROIDS[key]
}

function ShuffleOverlay({ step, fromLabel, toLabel }) {
  const { fromKey, toKey } = step
  const from = visualCenter(fromKey)
  const to   = visualCenter(toKey)
  const [pos, setPos] = useState({ cx: from.cx, cy: from.cy, animated: false })

  useEffect(() => {
    setPos({ cx: from.cx, cy: from.cy, animated: false })
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPos({ cx: to.cx, cy: to.cy, animated: true })
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [fromKey, toKey])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <g style={{ pointerEvents: 'none' }}>
      <ShuffleChip cx={to.cx}   cy={to.cy}   label={toLabel}   fill={COL_TARGET_BG} stroke={COL_TARGET} textColor={COL_TARGET} />
      <ShuffleChip cx={pos.cx}  cy={pos.cy}  label={fromLabel} fill={COL_SOURCE_BG} stroke={COL_SOURCE} textColor="#7d5a00" animated={pos.animated} />
    </g>
  )
}

function ShuffleChip({ cx, cy, label, fill, stroke, textColor, animated = false }) {
  const bgW     = 74
  const words   = label.split(' ')
  const twoLine = words.length > 1
  const bgH     = twoLine ? 38 : 26
  const trans   = animated ? 'x 0.20s ease-out, y 0.20s ease-out' : 'none'

  return (
    <g>
      <rect
        x={cx - bgW / 2} y={cy - bgH / 2}
        width={bgW} height={bgH} rx={bgH / 2}
        fill={fill} stroke={stroke} strokeWidth={2}
        style={{ transition: trans }}
      />
      {twoLine ? (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11.5}
            fontFamily="system-ui, sans-serif" fontWeight={600} fill={textColor}
            style={{ transition: trans }}>
            {words[0]}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11.5}
            fontFamily="system-ui, sans-serif" fontWeight={600} fill={textColor}
            style={{ transition: trans }}>
            {words.slice(1).join(' ')}
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12}
          fontFamily="system-ui, sans-serif" fontWeight={600} fill={textColor}
          style={{ transition: trans }}>
          {label}
        </text>
      )}
    </g>
  )
}

function TermLabel({ cx, cy, label, isSource, isTarget, isInactive }) {
  const words   = label.split(' ')
  const twoLine = words.length > 1
  const bgW     = 74
  const bgH     = twoLine ? 38 : 26

  const borderColor = isSource ? COL_SOURCE : isTarget ? COL_TARGET : isInactive ? '#bbb' : '#ccc'
  const fillColor   = isSource ? COL_SOURCE_BG : isTarget ? COL_TARGET_BG : isInactive ? '#dadde0' : 'rgba(255,255,255,0.92)'
  const textColor   = isSource ? '#7d5a00' : isTarget ? COL_TARGET : isInactive ? '#999' : '#1a1a1a'
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
            textAnchor="middle" fontSize={11.5}
            fontFamily="system-ui, sans-serif" fontWeight={600}
            fill={textColor}>
            {words[0]}
          </text>
          <text x={cx} y={cy + 8}
            textAnchor="middle" fontSize={11.5}
            fontFamily="system-ui, sans-serif" fontWeight={600}
            fill={textColor}>
            {words.slice(1).join(' ')}
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 4}
          textAnchor="middle" fontSize={12}
          fontFamily="system-ui, sans-serif" fontWeight={600}
          fill={textColor}>
          {label}
        </text>
      )}
    </g>
  )
}
