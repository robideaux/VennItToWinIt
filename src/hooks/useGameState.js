import { useState } from 'react'
import { REGION_KEYS, getCorrectCircles, getValidTargets } from '../utils/puzzleUtils.js'

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
    attemptsLeft: puzzle.maxAttempts,
    revealedCircles: [],  // [{ circleId, category, name }]
    lastSubmitResult: null,
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
  const allRegionsFilled = REGION_KEYS.every(k => state.placements[k] !== null)

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

  function submitGuess() {
    setState(s => {
      if (s.phase !== 'playing') return s

      const newlyRevealed = getCorrectCircles(puzzle, s.placements)
      const existingIds = new Set(s.revealedCircles.map(c => c.circleId))
      const merged = [
        ...s.revealedCircles,
        ...newlyRevealed.filter(c => !existingIds.has(c.circleId)),
      ]

      const newAttemptsLeft = s.attemptsLeft - 1

      const newPhase =
        merged.length === 3  ? 'won'
        : newAttemptsLeft <= 0 ? 'lost'
        : 'playing'

      return {
        ...s,
        revealedCircles: merged,
        attemptsLeft: newAttemptsLeft,
        phase: newPhase,
        lastSubmitResult: { correct: merged },
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
    phase: state.phase,
    gameKey: state.gameKey,
    // Derived
    unplacedTerms,
    allRegionsFilled,
    isTermPlaced,
    termInRegion,
    validTargetsFor,
    // Actions
    selectTerm,
    placeTerm,
    submitGuess,
    resetGame,
  }
}
