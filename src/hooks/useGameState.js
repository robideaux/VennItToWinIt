import { useState } from 'react'
import { REGION_KEYS, CIRCLE_REGIONS, getCorrectCircles, getValidTargets } from '../utils/puzzleUtils.js'
import { ATTEMPTS, ONE_SHOT_COST } from '../utils/gameRules.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomizePlacements(puzzle) {
  const termIds = puzzle.terms.map(t => t.id)
  let placements
  do {
    const shuffled = shuffle(termIds)
    placements = Object.fromEntries(REGION_KEYS.map((k, i) => [k, shuffled[i]]))
  } while (getCorrectCircles(puzzle, placements).length > 0)
  return placements
}

function initialState(puzzle) {
  return {
    placements: randomizePlacements(puzzle),
    selectedTermId: null,
    attemptsLeft: ATTEMPTS,
    revealedCircles: [],  // [{ circleId, category, name }]
    lastSubmitResult: null,
    oneShotUsed: false,
    lastOneShot: null,    // { correctCount, won } — the only thing a miss tells you
    // Ordered record of every submit, for the shareable result block. Kept here rather
    // than derived later because the order and the per-circle counts cannot be
    // reconstructed from the final board.
    submissions: [],      // [{ type: 'circle', circleId, correct } | { type: 'oneShot', correctCount }]
    phase: 'playing',     // 'playing' | 'won' | 'lost'
    gameKey: 0,
  }
}

export function useGameState(puzzle) {
  const [state, setState] = useState(() => initialState(puzzle))

  // --- Derived values ---

  const placedTermIds = new Set(Object.values(state.placements).filter(Boolean))
  const unplacedTerms = puzzle.terms.filter(t => !placedTermIds.has(t.id))
  const isTermPlaced = (termId) => placedTermIds.has(termId)
  const termInRegion = (regionKey) => {
    const id = state.placements[regionKey]
    return id ? puzzle.terms.find(t => t.id === id) ?? null : null
  }
  // Available only as an opening move, so any submit closes the window.
  const canOneShot = state.phase === 'playing' && state.submissions.length === 0

  const isCircleFilled = (circleId) =>
    CIRCLE_REGIONS[circleId].every(k => state.placements[k] !== null)

  const validTargetsFor = (termId) => {
    const term = puzzle.terms.find(t => t.id === termId)
    if (!term) return REGION_KEYS
    return getValidTargets(term, state.revealedCircles)
  }

  // --- Actions ---

  function selectTerm(termId) {
    setState(s => ({
      ...s,
      selectedTermId: s.selectedTermId === termId ? null : termId,
    }))
  }

  function placeTerm(targetRegionKey) {
    setState(s => {
      if (!s.selectedTermId) return s

      const term = puzzle.terms.find(t => t.id === s.selectedTermId)
      if (!getValidTargets(term, s.revealedCircles).includes(targetRegionKey)) return s

      const termId = s.selectedTermId
      const targetOccupant = s.placements[targetRegionKey]

      const sourceRegionKey =
        Object.entries(s.placements).find(([, v]) => v === termId)?.[0] ?? null

      const newPlacements = { ...s.placements }
      newPlacements[targetRegionKey] = termId

      if (sourceRegionKey !== null) {
        newPlacements[sourceRegionKey] = targetOccupant ?? null
      }

      return { ...s, placements: newPlacements, selectedTermId: null }
    })
  }

  function submitCircle(circleId) {
    setState(s => {
      if (s.phase !== 'playing') return s
      if (s.revealedCircles.some(c => c.circleId === circleId)) return s // already locked
      if (!CIRCLE_REGIONS[circleId].every(k => s.placements[k] !== null)) return s // not filled yet

      const result = getCorrectCircles(puzzle, s.placements).find(c => c.circleId === circleId)
      const merged = result ? [...s.revealedCircles, result] : s.revealedCircles

      const newAttemptsLeft = s.attemptsLeft - 1

      const newPhase =
        merged.length === 3   ? 'won'
        : newAttemptsLeft <= 0 ? 'lost'
        : 'playing'

      return {
        ...s,
        revealedCircles: merged,
        attemptsLeft: newAttemptsLeft,
        phase: newPhase,
        lastSubmitResult: { circleId, correct: !!result },
        // The revealed category, not just the circle: the shareable block normalises
        // groups by the puzzle's own A/B/C order, because circle colour means something
        // different to every player. A failed submit has no category — it matched no
        // group at all, so there is nothing to attribute it to.
        submissions: [...s.submissions, {
          type: 'circle', circleId, correct: !!result, category: result?.category ?? null,
        }],
      }
    })
  }

  // Checks the whole board at once. Wins outright if every group is right; otherwise
  // reports ONLY how many were correct — no reveals, no locks — and is spent either way.
  // That is what stops it dominating the per-circle submit: it trades a permanent lock
  // for a one-off count.
  function submitAll() {
    setState(s => {
      // Opening move only. Left available after a circle submit it becomes a hedge —
      // lock your surest circle first, then gamble on two instead of three — which is
      // strictly safer, so everyone would do it and the gamble stops being one.
      if (s.phase !== 'playing') return s
      if (s.submissions.length > 0) return s

      const correct = getCorrectCircles(puzzle, s.placements)
      const won = correct.length === 3
      const newAttemptsLeft = s.attemptsLeft - ONE_SHOT_COST

      return {
        ...s,
        oneShotUsed: true,
        // Only a win reveals anything. A miss deliberately leaves the board untouched.
        revealedCircles: won ? correct : s.revealedCircles,
        attemptsLeft: newAttemptsLeft,
        phase: won ? 'won' : newAttemptsLeft <= 0 ? 'lost' : 'playing',
        lastOneShot: { correctCount: correct.length, won },
        submissions: [...s.submissions, { type: 'oneShot', correctCount: correct.length }],
      }
    })
  }

  function resetGame() {
    setState(s => ({ ...initialState(puzzle), gameKey: s.gameKey + 1 }))
  }

  return {
    // State
    placements: state.placements,
    selectedTermId: state.selectedTermId,
    attemptsLeft: state.attemptsLeft,
    revealedCircles: state.revealedCircles,
    lastSubmitResult: state.lastSubmitResult,
    oneShotUsed: state.oneShotUsed,
    canOneShot,
    lastOneShot: state.lastOneShot,
    submissions: state.submissions,
    phase: state.phase,
    gameKey: state.gameKey,
    // Derived
    unplacedTerms,
    isCircleFilled,
    isTermPlaced,
    termInRegion,
    validTargetsFor,
    // Actions
    selectTerm,
    placeTerm,
    submitCircle,
    submitAll,
    resetGame,
  }
}
