import { useState, useEffect, useRef } from 'react'
import { computeSwapSequence } from '../utils/puzzleUtils.js'

const STEP_DURATION = 250 // ms between swaps, matches useShuffleAnimation

// Animates a board from its actual (unsolved) placements into the revealed solution,
// one true-swap at a time, reusing the same ShuffleOverlay visual as the game-start shuffle.
export function useRevealAnimation(fromPlacements, toPlacements) {
  const [board, setBoard] = useState(fromPlacements)
  const [step, setStep] = useState(null)
  const timers = useRef([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    let current = { ...fromPlacements }
    setBoard(current)
    setStep(null)

    const swaps = computeSwapSequence(fromPlacements, toPlacements)
    swaps.forEach((swap, i) => {
      timers.current.push(setTimeout(() => {
        current = { ...current }
        ;[current[swap.fromKey], current[swap.toKey]] = [current[swap.toKey], current[swap.fromKey]]
        setBoard(current)
        setStep(swap)
      }, i * STEP_DURATION))
    })
    timers.current.push(setTimeout(() => setStep(null), swaps.length * STEP_DURATION))

    return () => timers.current.forEach(clearTimeout)
  }, [fromPlacements, toPlacements]) // eslint-disable-line react-hooks/exhaustive-deps

  return { board, step }
}
