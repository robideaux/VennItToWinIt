import { useState } from 'react'
import { CATEGORY_KEYS, CATEGORY_REGION_KEYS, MAX_TERM_CHARS, COUNTER_WITHIN } from '../utils/validatePuzzle.js'
import { categoryRegionToPhysical } from '../utils/puzzleUtils.js'
import {
  VB_W, VB_H, CENTROIDS, CALLOUT_REGIONS, CALLOUT_ANCHORS, visualCenter,
  pctX, pctY, UNIT_CSS, clampX,
} from '../utils/vennGeometry.js'
import { PILL_W, PILL_PAD, BASE_FONT } from '../utils/fitText.js'
import { CIRCLE_COLORS } from '../styles/colors.js'
import chipStyles from './CircleLabels.module.css'
import styles from './EditOverlay.module.css'

// The editor's half of the diagram overlay — swaps in where PlayOverlay sits, on the same
// geometry-only <VennDiagram> shell. Both read their coordinates from vennGeometry, so an
// input always lands exactly where its term will be drawn.
//
// Seven slots keyed by category region, one input each. That fixed structure is why the
// editor cannot produce a structurally invalid puzzle: duplicate or unknown region keys
// are impossible when the keys ARE the layout.
export default function EditOverlay({ draft, onChange, fieldIssues = new Map(), disabled = false }) {
  // Only the focused field can show a counter, so one piece of state covers all ten inputs.
  const [focused, setFocused] = useState(null)

  // The counter stays out of the way until the limit is nearly reached — a permanent
  // "0/40" on every field is noise, but hitting a hard stop with no warning reads as broken.
  const counterFor = (key, value) =>
    focused === key && value.length >= MAX_TERM_CHARS - COUNTER_WITHIN
      ? `${value.length}/${MAX_TERM_CHARS}`
      : null

  const problem = field => fieldIssues.get(field) ?? null

  const setTerm     = (key, value) => onChange({ ...draft, terms: { ...draft.terms, [key]: value } })
  const setCategory = (key, value) => onChange({ ...draft, categories: { ...draft.categories, [key]: value } })

  return (
    <div
      className={styles.overlay}
      style={{ '--u': UNIT_CSS, '--pill-w': PILL_W, '--pill-h': 26, '--pill-pad': PILL_PAD, '--pill-font': BASE_FONT }}
    >
      {/* Leader lines for the three lens regions, so a term reads as belonging to its
          overlap rather than floating in dead space. Neutral here — the source/target
          colouring PlayOverlay applies has no meaning while authoring. */}
      <svg className={styles.lines} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
        {[...CALLOUT_REGIONS].map(key => {
          const { cx, cy } = CENTROIDS[key]
          const a = CALLOUT_ANCHORS[key]
          return (
            <g key={key}>
              <line x1={cx} y1={cy} x2={a.cx} y2={a.cy} stroke="#bbb" strokeWidth={1.5} />
              <circle cx={cx} cy={cy} r={4} fill="#888" />
            </g>
          )
        })}
      </svg>

      {/* Category names sit at the circle-label chip positions, reusing those coordinates
          from CircleLabels rather than restating them. */}
      {CATEGORY_KEYS.map((key, i) => {
        const circleId = String(i + 1)
        return (
          <input
            key={key}
            className={[
              chipStyles[`circle${circleId}`],
              styles.category,
              problem(`category:${key}`) ? styles.flagged : '',
            ].join(' ').trim()}
            style={problem(`category:${key}`) ? undefined : { borderColor: CIRCLE_COLORS[circleId].bold }}
            title={problem(`category:${key}`) ?? ''}
            value={draft.categories[key]}
            onChange={e => setCategory(key, e.target.value)}
            maxLength={MAX_TERM_CHARS}
            placeholder={`Category ${circleId}`}
            aria-label={`Category ${circleId} name`}
            disabled={disabled}
            onFocus={() => setFocused(`cat-${key}`)}
            onBlur={() => setFocused(f => (f === `cat-${key}` ? null : f))}
          />
        )
      })}

      {CATEGORY_KEYS.map((key, i) => {
        const text = counterFor(`cat-${key}`, draft.categories[key])
        if (!text) return null
        return (
          <span key={`cc-${key}`} className={`${chipStyles[`circle${i + 1}`]} ${styles.chipCounter}`}>
            {text}
          </span>
        )
      })}

      {/* One input per region, positioned exactly where its pill will render */}
      {CATEGORY_REGION_KEYS.map((key, i) => {
        const { cx, cy } = visualCenter(categoryRegionToPhysical(key))
        const counter = counterFor(key, draft.terms[key])
        return (
          <div key={key}>
            <input
              className={`${styles.slot} ${problem(`term:${key}`) ? styles.flagged : ''}`}
              style={{ left: pctX(clampX(cx, PILL_W)), top: pctY(cy) }}
              title={problem(`term:${key}`) ?? ''}
              value={draft.terms[key]}
              onChange={e => setTerm(key, e.target.value)}
              maxLength={MAX_TERM_CHARS}
              placeholder={`Term ${i + 1}`}
              aria-label={`Term for region ${key}`}
              disabled={disabled}
              onFocus={() => setFocused(key)}
              onBlur={() => setFocused(f => (f === key ? null : f))}
            />
            {counter && (
              <span
                className={styles.counter}
                style={{ left: pctX(clampX(cx, PILL_W)), top: pctY(cy) }}
              >
                {counter}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
