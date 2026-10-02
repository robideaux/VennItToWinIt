import { useState, useEffect } from 'react'
import { REGION_KEYS } from '../utils/puzzleUtils.js'
import {
  VB_W, VB_H, CENTROIDS, CALLOUT_REGIONS, CALLOUT_ANCHORS, visualCenter,
  pctX, pctY, UNIT_CSS, clampX,
} from '../utils/vennGeometry.js'
import { PILL_W } from '../utils/fitText.js'
import TermPill from './TermPill.jsx'
import { SWAP_MS } from '../utils/feedback.js'
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
  swap           = null,   // { fromKey, toKey, movedId, displacedId } while a drop animates
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
          // Same scheme as the pills: solid for the picked-up term, a quieter grey for targets.
          // Applied through style: CSS variables do not resolve in SVG presentation attributes.
          const accent = isSource ? 'var(--pick-line)' : (isTarget && term) ? 'var(--target-ring)' : null

          // Placed callout region: anchor dot at the centroid, leader line out to the pill
          if (term && CALLOUT_REGIONS.has(key)) {
            const a = CALLOUT_ANCHORS[key]
            return (
              <g key={key}>
                <line
                  x1={cx} y1={cy} x2={a.cx} y2={a.cy}
                  strokeWidth={1.5}
                  style={{ stroke: accent ?? '#bbb' }}
                />
                <circle cx={cx} cy={cy} r={4} style={{ fill: accent ?? '#888' }} />
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
                  style={{ fill: 'var(--target-ring-fill)', stroke: 'var(--target-ring)' }}
                  strokeWidth={2} strokeDasharray="5 3"
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
        // The two terms that just traded places are drawn by SwapChips instead, sliding
        // between the regions. The board state already has them in their new homes.
        if (swap && (key === swap.fromKey || key === swap.toKey)) return null
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

      {swap && (
        <SwapChips
          key={swap.id}
          swap={swap}
          movedLabel={puzzle.terms.find(t => t.id === swap.movedId)?.label ?? ''}
          displacedLabel={puzzle.terms.find(t => t.id === swap.displacedId)?.label ?? ''}
        />
      )}

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

// A real two-way swap after a drop: the term you moved slides to the target while the term
// it displaced slides back to where yours came from. They reuse the shuffle's two looks —
// the dark lifted pill for the one in hand, the dashed edge for the one it lands on — but
// both travel, and slowly enough to see.
function SwapChips({ swap, movedLabel, displacedLabel }) {
  const a = visualCenter(swap.fromKey)
  const b = visualCenter(swap.toKey)
  const [go, setGo] = useState(false)

  useEffect(() => {
    // Armed after the start position has painted, or there is nothing to transition from
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setGo(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const moved     = go ? b : a
  const displaced = go ? a : b
  return (
    <div className={styles.shuffle}>
      <TermPill label={displacedLabel} x={displaced.cx} y={displaced.cy} variant="shuffleTo"   animated slideMs={SWAP_MS} />
      <TermPill label={movedLabel}     x={moved.cx}     y={moved.cy}     variant="shuffleFrom" animated slideMs={SWAP_MS} />
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
