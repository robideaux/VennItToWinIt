// Haptic feedback (Phase 9).
//
// The Vibration API takes only DURATIONS: one number, or an array alternating
// vibrate / pause / vibrate / ... in milliseconds. There is no intensity control, so the
// only levers are length and rhythm. Phone motors differ, and a pulse under about 10 ms
// is often not felt at all, so the shortest cues here stay at or above that.
//
// iOS Safari (and so every browser on an iPhone) does not implement it at all. Android
// Chrome, Firefox and Samsung Internet do. Desktop browsers may expose the function and
// do nothing, so support is judged the same way the native share sheet is: a coarse
// primary pointer, meaning a phone or tablet, as well as the API existing.
import { loadSettings } from './settings.js'

export const PATTERNS = {
  pick:  10,                              // a term is picked up
  put:   15,                              // a term is put down (or put back)
  miss:  [60, 50, 60],                    // "uh oh": a failed submit or a missed One Shot
  solve: 150,                             // a circle is locked in
  win:   [60, 40, 60, 40, 60, 40, 220],   // rising and drawn out
  loss:  [100, 100, 100, 100, 100],       // three flat, slow pulses
}

// Which cue a submit earns, given the game phase AFTER it. The end of the game outranks
// the submit that caused it: the winning solve is a win, the fatal miss is a loss.
// `last` is the submission just made.
export function cueForSubmit(last, phase) {
  if (phase === 'won')  return 'win'
  if (phase === 'lost') return 'loss'
  if (last?.type === 'circle' && last.correct) return 'solve'
  return 'miss'   // a wrong circle, or a One Shot that was not a clean sweep
}

export function vibrationSupported(nav = globalThis.navigator, mm = globalThis.matchMedia) {
  if (typeof nav?.vibrate !== 'function') return false
  if (typeof mm !== 'function') return false
  try {
    return mm('(pointer: coarse)').matches
  } catch {
    return false
  }
}

// Fires `name` if the device supports it and the player has turned it on. Returns whether
// it vibrated. `force` skips the setting, for the buzz that confirms the toggle itself
// (the new value is not saved yet at that moment).
export function haptic(name, { force = false, nav = globalThis.navigator, mm = globalThis.matchMedia, storage } = {}) {
  const pattern = PATTERNS[name]
  if (pattern === undefined) return false
  if (!vibrationSupported(nav, mm)) return false
  if (!force && !loadSettings(storage).vibration) return false
  try {
    return nav.vibrate(pattern) === true
  } catch {
    return false
  }
}
