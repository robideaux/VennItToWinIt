// Physical region keys — circle numbers, not category labels.
// Circle 1 = top, 2 = bottom-left, 3 = bottom-right.
export const REGION_KEYS = ['1', '2', '3', '12', '13', '23', '123']

// All regions that touch each physical circle (the 4 regions a circle "owns")
export const CIRCLE_REGIONS = {
  '1': ['1', '12', '13', '123'],
  '2': ['2', '12', '23', '123'],
  '3': ['3', '13', '23', '123'],
}

// All 6 ways to assign puzzle categories (A, B, C) onto physical circles (1, 2, 3)
const PERMUTATIONS = [
  { '1': 'A', '2': 'B', '3': 'C' },
  { '1': 'A', '2': 'C', '3': 'B' },
  { '1': 'B', '2': 'A', '3': 'C' },
  { '1': 'B', '2': 'C', '3': 'A' },
  { '1': 'C', '2': 'A', '3': 'B' },
  { '1': 'C', '2': 'B', '3': 'A' },
]

export function getCorrectRegionKey(term) {
  return [...term.regions].sort().join('')
}

function buildCategoryAnswerKey(puzzle) {
  return Object.fromEntries(
    puzzle.terms.map(t => [getCorrectRegionKey(t), t.id])
  )
}

function physicalToCategory(physicalKey, permutation) {
  return physicalKey.split('').map(c => permutation[c]).sort().join('')
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

// LENIENT circle check — a circle is correct when the SET of terms placed in its
// 4 regions matches the set of terms belonging to any one category, regardless of
// which specific sub-region each term occupies.
// Returns [{ circleId, category, name }, ...]
export function getCorrectCircles(puzzle, placements) {
  const result = []

  for (const circleId of ['1', '2', '3']) {
    const placedIds = new Set(
      CIRCLE_REGIONS[circleId].map(k => placements[k]).filter(Boolean)
    )
    if (placedIds.size !== 4) continue // circle not fully populated

    for (const [catKey, catName] of Object.entries(puzzle.categories)) {
      const expectedIds = new Set(
        puzzle.terms.filter(t => t.regions.includes(catKey)).map(t => t.id)
      )
      if (setsEqual(placedIds, expectedIds)) {
        result.push({ circleId, category: catKey, name: catName })
        break
      }
    }
  }

  return result
}

// Valid target regions for a term given the current set of locked circles.
// A region is valid iff: for every locked circle, the term belongs to it ↔ the region is inside it.
export function getValidTargets(term, lockedCircles) {
  return REGION_KEYS.filter(regionKey => {
    const regionCircles = new Set(regionKey.split(''))
    for (const { circleId, category } of lockedCircles) {
      const termBelongs        = term.regions.includes(category)
      const regionHasCircle    = regionCircles.has(circleId)
      if (termBelongs && !regionHasCircle) return false
      if (!termBelongs && regionHasCircle) return false
    }
    return true
  })
}

// Build the Game Over reveal state: circles the player already had locked correct
// keep their category pinned to that same physical circle (a locked circle's terms
// can only ever be rearranged among its own 4 regions anyway — the exact sub-region
// each sits in was never meaningful), and the remaining categories are assigned to
// whichever circles aren't locked (category order index → circle order index when
// nothing is locked yet). The whole board is then computed as one consistent solution.
export function buildRevealState(puzzle, lockedCircles) {
  const catToCircle = {}
  const lockedCircleIds = new Set()

  for (const { circleId, category } of lockedCircles) {
    catToCircle[category] = circleId
    lockedCircleIds.add(circleId)
  }

  const remainingCircleIds = ['1', '2', '3'].filter(id => !lockedCircleIds.has(id))
  const remainingCategories = Object.keys(puzzle.categories).filter(k => !(k in catToCircle))
  remainingCategories.forEach((catKey, i) => {
    catToCircle[catKey] = remainingCircleIds[i]
  })

  const placements = {}
  for (const term of puzzle.terms) {
    const regionKey = term.regions.map(c => catToCircle[c]).sort().join('')
    placements[regionKey] = term.id
  }

  const revealedCircles = ['1', '2', '3'].map(circleId => {
    const category = Object.keys(catToCircle).find(k => catToCircle[k] === circleId)
    return { circleId, category, name: puzzle.categories[category] }
  })

  return { placements, revealedCircles }
}

// Sequence of pairwise region swaps that transforms one full placements object into
// another (both must hold the same set of term ids across all REGION_KEYS). Used to
// animate the Game Over reveal the same way the game-start shuffle animates swaps.
export function computeSwapSequence(fromPlacements, toPlacements) {
  const current = { ...fromPlacements }
  const swaps = []
  for (const key of REGION_KEYS) {
    while (current[key] !== toPlacements[key]) {
      const otherKey = REGION_KEYS.find(k => current[k] === toPlacements[key])
      ;[current[key], current[otherKey]] = [current[otherKey], current[key]]
      swaps.push({ fromKey: key, toKey: otherKey })
    }
  }
  return swaps
}

// STRICT win check — all 7 specific regions are exactly correct under any permutation.
export function isSolved(puzzle, placements) {
  const answerKey = buildCategoryAnswerKey(puzzle)
  return PERMUTATIONS.some(perm =>
    REGION_KEYS.every(physRegion => {
      const catKey = physicalToCategory(physRegion, perm)
      return placements[physRegion] === answerKey[catKey]
    })
  )
}
