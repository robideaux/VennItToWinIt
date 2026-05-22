import { useState, useEffect, useRef } from 'react'
import { REGION_KEYS } from '../utils/puzzleUtils.js'

const SWAP_COUNT    = 5
const STEP_DURATION = 250  // ms between swaps — 4×300 = 1200ms total

function randomPairs() {
  const pairs = []
  for (let i = 0; i < SWAP_COUNT; i++) {
    const from = REGION_KEYS[Math.floor(Math.random() * REGION_KEYS.length)]
    let to
    do { to = REGION_KEYS[Math.floor(Math.random() * REGION_KEYS.length)] } while (to === from)
    pairs.push({ fromKey: from, toKey: to })
  }
  return pairs
}

export function useShuffleAnimation() {
  const [step, setStep] = useState(null)
  const timers = useRef([])

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function start() {
    clearTimers()
    const pairs = randomPairs()
    pairs.forEach((pair, i) => {
      timers.current.push(setTimeout(() => setStep(pair), i * STEP_DURATION))
    })
    timers.current.push(setTimeout(() => setStep(null), SWAP_COUNT * STEP_DURATION))
  }

  function skip() {
    clearTimers()
    setStep(null)
  }

  useEffect(() => () => clearTimers(), [])

  return { step, start, skip }
}
