import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'vennit_progress'

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

// Guarded: setItem throws on quota, and in Safari private browsing even touching
// localStorage can throw. This persists during the win/lose transition, so an unhandled
// throw would take the results screen down with it. Losing a progress entry is a far
// better outcome than losing the screen.
function write(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    /* progress is disposable — never let persistence failure break gameplay */
  }
}

// One puzzle's entry after another play of it.
//
// The FIRST play is the official record and is never overwritten — later plays only count
// up `plays`. Try Again is allowed, but a retried perfect score must not quietly replace
// the real first attempt; the share block shows the play number instead. `submissions` is
// kept so the share row can be rebuilt after leaving the results screen.
//
// Older entries predate `plays` and `submissions` (and may carry `attempts`, which
// `misses` replaced); they count as one play and are otherwise left as they are.
export function applyResult(entry, { won, misses, submissions }, completedAt) {
  if (entry) return { ...entry, plays: (entry.plays ?? 1) + 1 }
  return { won, misses, submissions, completedAt, plays: 1 }
}

export function useProgress() {
  const [progress, setProgress] = useState(read)

  // Persist as an effect rather than inside the state updaters below. A setState updater
  // must be pure, and React double-invokes it under StrictMode in development — so a
  // write in there runs twice per call and is a side effect where none is allowed.
  const loaded = useRef(false)
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true   // skip the mount pass: that value came FROM storage
      return
    }
    write(progress)
  }, [progress])

  function recordResult(puzzleId, result) {
    setProgress(prev => ({
      ...prev,
      [puzzleId]: applyResult(prev[puzzleId], result, new Date().toISOString()),
    }))
  }

  // Called when a custom puzzle is deleted, so its result doesn't linger as an orphan.
  // Every write to this key stays inside this hook: a utility writing it directly would
  // leave this state stale, and the UI would show progress for a deleted puzzle.
  function clearResult(puzzleId) {
    setProgress(prev => {
      if (!(puzzleId in prev)) return prev   // same reference -> no write, no re-render
      const next = { ...prev }
      delete next[puzzleId]
      return next
    })
  }

  return { progress, recordResult, clearResult }
}
