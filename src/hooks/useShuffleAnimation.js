import { useState, useEffect, useRef } from 'react'
import { REGION_KEYS } from '../utils/puzzleUtils.js'
import { CATEGORY_KEYS } from '../utils/validatePuzzle.js'

const SWAP_COUNT    = 5
const STEP_DURATION = 250  // ms between swaps — 5×250 = 1250ms total

const CIRCLE_IDS = ['1', '2', '3']

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

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// The category colours flashed across the circles while the terms shuffle, before the
// board settles neutral. It says that colour is hidden too, not simply absent — and that
// it is being scrambled rather than fixed to a position.
//
// One { circleId: category } per step, each a full permutation (every colour on screen
// at once) and never the same as the step before, so every tick visibly changes.
export function flashSequence(count = SWAP_COUNT) {
  const seq = []
  let prev = null
  for (let i = 0; i < count; i++) {
    let perm
    do { perm = shuffled(CATEGORY_KEYS) } while (prev && perm.every((c, j) => c === prev[j]))
    prev = perm
    seq.push(Object.fromEntries(CIRCLE_IDS.map((id, j) => [id, perm[j]])))
  }
  return seq
}

export function useShuffleAnimation() {
  const [step, setStep] = useState(null)
  const [flash, setFlash] = useState(null)
  const timers = useRef([])

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function start() {
    clearTimers()
    const pairs = randomPairs()
    const colors = flashSequence()
    pairs.forEach((pair, i) => {
      timers.current.push(setTimeout(() => { setStep(pair); setFlash(colors[i]) }, i * STEP_DURATION))
    })
    timers.current.push(setTimeout(() => { setStep(null); setFlash(null) }, SWAP_COUNT * STEP_DURATION))
  }

  function skip() {
    clearTimers()
    setStep(null)
    setFlash(null)
  }

  useEffect(() => () => clearTimers(), [])

  return { step, flash, start, skip }
}
