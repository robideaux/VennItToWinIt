import { useState, useEffect } from 'react'
import { REGION_KEYS } from '../utils/puzzleUtils.js'
import {
  VB_W, VB_H, CENTROIDS, CALLOUT_REGIONS, CALLOUT_ANCHORS, visualCenter,
  pctX, pctY, UNIT_CSS, clampX,
} from '../utils/vennGeometry.js'
import { PILL_W } from '../utils/fitText.js'
import { COL_SOURCE, COL_TARGET, COL_TARGET_BG } from '../styles/colors.js'
import TermPill from './TermPill.jsx'
import styles from './PlayOverlay.module.css'

// The game's diagram overlay: term pills, callout leader lines, empty-region dots and the
// shuffle/reveal animation. Swaps out for EditOverlay in the puzzle editor — both sit on
// the same geometry-only <VennDiagram> shell and share TermPill, so a puzzle renders
// identically whether you are playing it or authoring it.
//
// Leader lines and dots stay in SVG because they are geometric and must stretch with the
// diagram. Pills are HTML so they can wrap, shrink and stay undistorted.
export default function PlayOverlay({
  puzzle,
  placements,
  selectedTermId = null,
  validTargets   = [],
  onRegionClick  = null,
  shuffleStep    = null,
}) {
  const selectedRegionKey = selectedTermId
    ? REGION_KEYS.find(k => placements[k] === selectedTermId) ?? null
    : null

  const termFor = key => {
    const id = placements[key]
    return id ? puzzle.terms.find(t => t.id === id) ?? null : null
  }

  const stateFor = key => {
    const isSource = selectedTermId != null && key === selectedRegionKey
    return {
      isSource,
      isTarget:   selectedTermId != null && !isSource && validTargets.includes(key),
      isInactive: selectedTermId != null && !isSource && !validTargets.includes(key),
    }
  }

  return (
    <div className={styles.overlay} style={{ '--u': UNIT_CSS, '--pill-w': PILL_W }}>
      <svg
        className={styles.lines}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {REGION_KEYS.map(key => {
          const term = termFor(key)
          const { cx, cy } = CENTROIDS[key]
          const { isSource, isTarget } = stateFor(key)
          const accent = isSource ? COL_SOURCE : (isTarget && term) ? COL_TARGET : null

          // Placed callout region: anchor dot at the centroid, leader line out to the pill
          if (term && CALLOUT_REGIONS.has(key)) {
            const a = CALLOUT_ANCHORS[key]
            return (
              <g key={key}>
                <line
                  x1={cx} y1={cy} x2={a.cx} y2={a.cy}
                  stroke={accent ?? '#bbb'} strokeWidth={1.5}
                />
                <circle cx={cx} cy={cy} r={4} fill={accent ?? '#888'} />
              </g>
            )
          }

          if (term) return null

          // Empty region: placement hint ring while a term is selected, plus the resting dot
          return (
            <g key={key}>
              {selectedTermId && validTargets.includes(key) && (
                <circle
                  cx={cx} cy={cy} r={22}
                  fill={COL_TARGET_BG} stroke={COL_TARGET}
                  strokeWidth={1.2} strokeDasharray="4 3"
                />
              )}
              <circle cx={cx} cy={cy} r={3} fill="#bbb" opacity={0.6} />
            </g>
          )
        })}
      </svg>

      {/* Placed terms */}
      {REGION_KEYS.map(key => {
        const term = termFor(key)
        if (!term) return null
        const { cx, cy } = visualCenter(key)
        return (
          <TermPill
            key={key}
            label={term.label}
            x={cx} y={cy}
            {...stateFor(key)}
            onClick={onRegionClick ? () => onRegionClick(key) : null}
          />
        )
      })}

      {/* Empty callout regions sit in dead space outside every circle, so the shell's
          geometric hit-test returns null there. These invisible slots make the spot where
          the label *will* appear placeable, matching the old hit-test's layer 3. */}
      {onRegionClick && [...CALLOUT_REGIONS].map(key => {
        if (placements[key]) return null
        const a = CALLOUT_ANCHORS[key]
        return (
          <button
            key={`slot-${key}`}
            type="button"
            className={styles.emptySlot}
            style={{ left: pctX(clampX(a.cx, PILL_W)), top: pctY(a.cy) }}
            onClick={() => onRegionClick(key)}
            aria-label={`Place term in overlap region ${key}`}
          />
        )
      })}

      {shuffleStep && (
        <ShuffleChips
          step={shuffleStep}
          fromLabel={termFor(shuffleStep.fromKey)?.label ?? ''}
          toLabel={termFor(shuffleStep.toKey)?.label ?? ''}
        />
      )}
    </div>
  )
}

// Two chips: the destination term sits still while the source term slides onto it.
// The double rAF lets the start position paint before the transition is armed.
function ShuffleChips({ step, fromLabel, toLabel }) {
  const { fromKey, toKey } = step
  const from = visualCenter(fromKey)
  const to   = visualCenter(toKey)
  const [pos, setPos] = useState({ ...from, animated: false })

  useEffect(() => {
    setPos({ ...from, animated: false })
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPos({ ...to, animated: true }))
    })
    return () => cancelAnimationFrame(raf)
  }, [fromKey, toKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.shuffle}>
      <TermPill label={toLabel}   x={to.cx}  y={to.cy}  variant="shuffleTo" />
      <TermPill label={fromLabel} x={pos.cx} y={pos.cy} variant="shuffleFrom" animated={pos.animated} />
    </div>
  )
}
