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

// Build the canonical correct placements using category order as circle assignment.
// Category order index 0 → circle '1', index 1 → circle '2', index 2 → circle '3'.
export function buildSolutionPlacements(puzzle) {
  const catKeys = Object.keys(puzzle.categories)
  const catToCircle = Object.fromEntries(catKeys.map((k, i) => [k, String(i + 1)]))
  const placements = {}
  for (const term of puzzle.terms) {
    const regionKey = term.regions.map(c => catToCircle[c]).sort().join('')
    placements[regionKey] = term.id
  }
  return placements
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
